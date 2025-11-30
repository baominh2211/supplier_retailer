import { Prisma, NegotiationStatus, ParticipantRole, MessageType } from '@prisma/client';
import { prisma } from '../config/database.js';
import { cache, cacheKeys } from '../config/redis.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors.js';
import { CreateNegotiationInput, SendMessageInput, PaginationInput } from '../utils/validators.js';
import { emailService } from './emailService.js';
import { logger } from '../utils/logger.js';

export interface NegotiationWithDetails {
  id: string;
  shopId: string;
  supplierId: string;
  productId: string | null;
  status: NegotiationStatus;
  initialMessage: string;
  requestedQuantity: number | null;
  requestedPrice: Prisma.Decimal | null;
  totalMessages: number;
  shopUnreadCount: number;
  supplierUnreadCount: number;
  createdAt: Date;
  updatedAt: Date;
  shop: {
    id: string;
    shopName: string;
    country: string;
    user: { email: string };
  };
  supplier: {
    id: string;
    companyName: string;
    country: string;
    user: { email: string };
  };
  product: {
    id: string;
    name: string;
    unitPrice: Prisma.Decimal;
  } | null;
}

export interface MessageWithSender {
  id: string;
  sessionId: string;
  content: string;
  messageType: MessageType;
  senderRole: ParticipantRole;
  metadata: Prisma.JsonValue;
  isReadByShop: boolean;
  isReadBySupplier: boolean;
  createdAt: Date;
  sender: {
    id: string;
    email: string;
  };
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const negotiationService = {
  /**
   * Get negotiation by ID
   */
  async getById(id: string, userId: string): Promise<NegotiationWithDetails | null> {
    const negotiation = await prisma.negotiationSession.findUnique({
      where: { id, deletedAt: null },
      include: {
        shop: {
          select: {
            id: true,
            shopName: true,
            country: true,
            user: { select: { email: true } },
          },
        },
        supplier: {
          select: {
            id: true,
            companyName: true,
            country: true,
            user: { select: { email: true } },
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            unitPrice: true,
          },
        },
      },
    });

    if (!negotiation) return null;

    // Verify user is a participant
    const isShop = negotiation.shop.user.email === (await this.getUserEmail(userId));
    const isSupplier = negotiation.supplier.user.email === (await this.getUserEmail(userId));

    if (!isShop && !isSupplier) {
      throw new ForbiddenError('You are not a participant in this negotiation');
    }

    return negotiation;
  },

  /**
   * Helper to get user email
   */
  async getUserEmail(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    return user?.email || '';
  },

  /**
   * List negotiations for a user
   */
  async listForUser(
    userId: string,
    role: 'SHOP' | 'SUPPLIER',
    filters: PaginationInput & { status?: NegotiationStatus }
  ): Promise<PaginatedResult<NegotiationWithDetails>> {
    const { page, limit, sortOrder, status } = filters;
    const skip = (page - 1) * limit;

    // Get user's shop or supplier ID
    let entityId: string | undefined;

    if (role === 'SHOP') {
      const shop = await prisma.shop.findUnique({
        where: { userId },
        select: { id: true },
      });
      entityId = shop?.id;
    } else {
      const supplier = await prisma.supplier.findUnique({
        where: { userId },
        select: { id: true },
      });
      entityId = supplier?.id;
    }

    if (!entityId) {
      return {
        data: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      };
    }

    const where: Prisma.NegotiationSessionWhereInput = {
      deletedAt: null,
      ...(role === 'SHOP' ? { shopId: entityId } : { supplierId: entityId }),
      ...(status && { status }),
    };

    const [data, total] = await Promise.all([
      prisma.negotiationSession.findMany({
        where,
        include: {
          shop: {
            select: {
              id: true,
              shopName: true,
              country: true,
              user: { select: { email: true } },
            },
          },
          supplier: {
            select: {
              id: true,
              companyName: true,
              country: true,
              user: { select: { email: true } },
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              unitPrice: true,
            },
          },
        },
        orderBy: { updatedAt: sortOrder },
        skip,
        take: limit,
      }),
      prisma.negotiationSession.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Create a new negotiation (Shop initiates)
   */
  async create(userId: string, data: CreateNegotiationInput): Promise<NegotiationWithDetails> {
    // Get shop for user
    const shop = await prisma.shop.findUnique({
      where: { userId },
      include: { user: { select: { email: true } } },
    });

    if (!shop) {
      throw new ForbiddenError('Only shops can initiate negotiations');
    }

    // Verify supplier exists and is verified
    const supplier = await prisma.supplier.findUnique({
      where: { id: data.supplierId },
      include: { user: { select: { email: true } } },
    });

    if (!supplier || supplier.deletedAt || supplier.status !== 'VERIFIED') {
      throw new BadRequestError('Invalid or unverified supplier');
    }

    // Verify product if provided
    let product = null;
    if (data.productId) {
      product = await prisma.product.findUnique({
        where: { id: data.productId },
        select: { id: true, name: true, supplierId: true },
      });

      if (!product || product.supplierId !== data.supplierId) {
        throw new BadRequestError('Invalid product or product does not belong to supplier');
      }
    }

    // Check active negotiation limit (max 5 per shop)
    const activeCount = await prisma.negotiationSession.count({
      where: {
        shopId: shop.id,
        status: { in: ['INITIATED', 'PENDING_SUPPLIER_RESPONSE', 'ACTIVE'] },
        deletedAt: null,
      },
    });

    if (activeCount >= 5) {
      throw new BadRequestError('Maximum active negotiations limit reached (5)');
    }

    // Create negotiation with transaction
    const negotiation = await prisma.$transaction(async (tx) => {
      // Create session
      const session = await tx.negotiationSession.create({
        data: {
          shopId: shop.id,
          supplierId: data.supplierId,
          productId: data.productId,
          createdByUserId: userId,
          status: 'INITIATED',
          initiatedBy: 'SHOP',
          requestedQuantity: data.requestedQuantity,
          requestedPrice: data.requestedPrice ? new Prisma.Decimal(data.requestedPrice) : null,
          requestedCurrency: data.requestedCurrency || 'USD',
          shippingRequirements: data.shippingRequirements,
          paymentTermsRequest: data.paymentTermsRequest,
          initialMessage: data.initialMessage,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
        include: {
          shop: {
            select: {
              id: true,
              shopName: true,
              country: true,
              user: { select: { email: true } },
            },
          },
          supplier: {
            select: {
              id: true,
              companyName: true,
              country: true,
              user: { select: { email: true } },
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              unitPrice: true,
            },
          },
        },
      });

      // Create initial message
      await tx.negotiationMessage.create({
        data: {
          sessionId: session.id,
          senderUserId: userId,
          content: data.initialMessage,
          messageType: 'TEXT',
          senderRole: 'SHOP',
        },
      });

      // Update session message count
      await tx.negotiationSession.update({
        where: { id: session.id },
        data: {
          totalMessages: 1,
          lastMessageAt: new Date(),
          lastMessageById: userId,
          supplierUnreadCount: 1,
        },
      });

      // Create participants
      await tx.negotiationParticipant.createMany({
        data: [
          { sessionId: session.id, userId, role: 'SHOP' },
          { sessionId: session.id, userId: supplier.userId, role: 'SUPPLIER' },
        ],
      });

      // Log event
      await tx.negotiationEvent.create({
        data: {
          sessionId: session.id,
          userId,
          eventType: 'SESSION_CREATED',
          description: 'Negotiation session created',
        },
      });

      // Update shop stats
      await tx.shop.update({
        where: { id: shop.id },
        data: { totalNegotiations: { increment: 1 } },
      });

      // Update supplier stats
      await tx.supplier.update({
        where: { id: data.supplierId },
        data: { totalNegotiations: { increment: 1 } },
      });

      return session;
    });

    // Send email notification to supplier
    await emailService.sendNegotiationNotification(
      supplier.user.email,
      'new',
      {
        sessionId: negotiation.id,
        productName: product?.name,
        shopName: shop.shopName,
      }
    );

    logger.info({ negotiationId: negotiation.id, shopId: shop.id }, 'Negotiation created');

    return negotiation;
  },

  /**
   * Send a message in a negotiation
   */
  async sendMessage(
    sessionId: string,
    userId: string,
    data: SendMessageInput
  ): Promise<MessageWithSender> {
    // Get session and verify participant
    const session = await prisma.negotiationSession.findUnique({
      where: { id: sessionId },
      include: {
        shop: {
          include: { user: { select: { id: true, email: true } } },
        },
        supplier: {
          include: { user: { select: { id: true, email: true } } },
        },
      },
    });

    if (!session || session.deletedAt) {
      throw new NotFoundError('Negotiation session not found');
    }

    // Determine sender role
    let senderRole: ParticipantRole;
    let recipientEmail: string;

    if (session.shop.user.id === userId) {
      senderRole = 'SHOP';
      recipientEmail = session.supplier.user.email;
    } else if (session.supplier.user.id === userId) {
      senderRole = 'SUPPLIER';
      recipientEmail = session.shop.user.email;
    } else {
      throw new ForbiddenError('You are not a participant in this negotiation');
    }

    // Check if session allows messages
    const closedStatuses: NegotiationStatus[] = ['AGREED', 'CLOSED_CANCELLED', 'CLOSED_EXPIRED'];
    if (closedStatuses.includes(session.status)) {
      throw new BadRequestError('Cannot send messages in a closed negotiation');
    }

    // Create message
    const message = await prisma.$transaction(async (tx) => {
      const msg = await tx.negotiationMessage.create({
        data: {
          sessionId,
          senderUserId: userId,
          content: data.content,
          messageType: data.messageType || 'TEXT',
          senderRole,
          metadata: data.metadata || {},
          replyToMessageId: data.replyToMessageId,
        },
        include: {
          sender: {
            select: { id: true, email: true },
          },
        },
      });

      // Update session
      const updateData: Prisma.NegotiationSessionUpdateInput = {
        totalMessages: { increment: 1 },
        lastMessageAt: new Date(),
        lastMessageById: userId,
        updatedAt: new Date(),
      };

      // Update unread count for recipient
      if (senderRole === 'SHOP') {
        updateData.supplierUnreadCount = { increment: 1 };
      } else {
        updateData.shopUnreadCount = { increment: 1 };
      }

      // Update status if first response
      if (session.status === 'INITIATED' && senderRole === 'SUPPLIER') {
        updateData.status = 'ACTIVE';
        updateData.firstResponseAt = new Date();
      }

      await tx.negotiationSession.update({
        where: { id: sessionId },
        data: updateData,
      });

      return msg;
    });

    // Send email notification (async, don't wait)
    emailService.sendNegotiationNotification(
      recipientEmail,
      'message',
      {
        sessionId,
        shopName: session.shop.shopName,
        supplierName: session.supplier.companyName,
      }
    ).catch(err => logger.error({ error: err }, 'Failed to send message notification'));

    logger.info({ messageId: message.id, sessionId }, 'Message sent');

    return message;
  },

  /**
   * Get messages for a negotiation
   */
  async getMessages(
    sessionId: string,
    userId: string,
    filters: PaginationInput
  ): Promise<PaginatedResult<MessageWithSender>> {
    // Verify access
    await this.getById(sessionId, userId);

    const { page, limit } = filters;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.negotiationMessage.findMany({
        where: { sessionId, deletedAt: null },
        include: {
          sender: {
            select: { id: true, email: true },
          },
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      prisma.negotiationMessage.count({
        where: { sessionId, deletedAt: null },
      }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Mark messages as read
   */
  async markAsRead(sessionId: string, userId: string): Promise<void> {
    const session = await prisma.negotiationSession.findUnique({
      where: { id: sessionId },
      include: {
        shop: { select: { userId: true } },
        supplier: { select: { userId: true } },
      },
    });

    if (!session) {
      throw new NotFoundError('Negotiation session not found');
    }

    const isShop = session.shop.userId === userId;
    const isSupplier = session.supplier.userId === userId;

    if (!isShop && !isSupplier) {
      throw new ForbiddenError('You are not a participant');
    }

    // Update messages and session
    await prisma.$transaction([
      prisma.negotiationMessage.updateMany({
        where: {
          sessionId,
          ...(isShop ? { isReadByShop: false } : { isReadBySupplier: false }),
        },
        data: {
          ...(isShop
            ? { isReadByShop: true, readByShopAt: new Date() }
            : { isReadBySupplier: true, readBySupplierAt: new Date() }),
        },
      }),
      prisma.negotiationSession.update({
        where: { id: sessionId },
        data: {
          ...(isShop ? { shopUnreadCount: 0 } : { supplierUnreadCount: 0 }),
        },
      }),
    ]);
  },

  /**
   * Update negotiation status (agree/cancel)
   */
  async updateStatus(
    sessionId: string,
    userId: string,
    newStatus: 'AGREED' | 'CLOSED_CANCELLED',
    data?: {
      closedReason?: string;
      finalAgreedPrice?: number;
      finalAgreedQuantity?: number;
      finalShippingTerms?: string;
      finalPaymentTerms?: string;
    }
  ): Promise<NegotiationWithDetails> {
    const session = await this.getById(sessionId, userId);

    if (!session) {
      throw new NotFoundError('Negotiation session not found');
    }

    // Validate status transition
    const validTransitions: Record<NegotiationStatus, NegotiationStatus[]> = {
      INITIATED: ['ACTIVE', 'CLOSED_CANCELLED'],
      PENDING_SUPPLIER_RESPONSE: ['ACTIVE', 'AGREED', 'CLOSED_CANCELLED'],
      ACTIVE: ['AGREED', 'CLOSED_CANCELLED'],
      AWAITING_SHOP_RESPONSE: ['AGREED', 'CLOSED_CANCELLED'],
      AWAITING_SUPPLIER_RESPONSE: ['AGREED', 'CLOSED_CANCELLED'],
      AGREED: [],
      CLOSED_CANCELLED: [],
      CLOSED_EXPIRED: [],
    };

    if (!validTransitions[session.status].includes(newStatus)) {
      throw new BadRequestError(
        `Cannot transition from ${session.status} to ${newStatus}`
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updateData: Prisma.NegotiationSessionUpdateInput = {
        status: newStatus,
        updatedAt: new Date(),
      };

      if (newStatus === 'AGREED') {
        updateData.agreedAt = new Date();
        updateData.finalAgreedPrice = data?.finalAgreedPrice
          ? new Prisma.Decimal(data.finalAgreedPrice)
          : null;
        updateData.finalAgreedQuantity = data?.finalAgreedQuantity;
        updateData.finalShippingTerms = data?.finalShippingTerms;
        updateData.finalPaymentTerms = data?.finalPaymentTerms;

        // Update supplier success count
        await tx.supplier.update({
          where: { id: session.supplierId },
          data: { successfulNegotiations: { increment: 1 } },
        });
      }

      if (newStatus === 'CLOSED_CANCELLED') {
        updateData.closedAt = new Date();
        updateData.closedByUserId = userId;
        updateData.closedReason = data?.closedReason;
      }

      const result = await tx.negotiationSession.update({
        where: { id: sessionId },
        data: updateData,
        include: {
          shop: {
            select: {
              id: true,
              shopName: true,
              country: true,
              user: { select: { email: true } },
            },
          },
          supplier: {
            select: {
              id: true,
              companyName: true,
              country: true,
              user: { select: { email: true } },
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              unitPrice: true,
            },
          },
        },
      });

      // Log event
      await tx.negotiationEvent.create({
        data: {
          sessionId,
          userId,
          eventType: 'STATUS_CHANGED',
          oldValue: { status: session.status },
          newValue: { status: newStatus },
        },
      });

      return result;
    });

    // Send notifications
    const notificationType = newStatus === 'AGREED' ? 'agreed' : 'cancelled';
    await Promise.all([
      emailService.sendNegotiationNotification(
        updated.shop.user.email,
        notificationType,
        { sessionId, supplierName: updated.supplier.companyName }
      ),
      emailService.sendNegotiationNotification(
        updated.supplier.user.email,
        notificationType,
        { sessionId, shopName: updated.shop.shopName }
      ),
    ]).catch(err => logger.error({ error: err }, 'Failed to send status notification'));

    logger.info({ sessionId, newStatus }, 'Negotiation status updated');

    return updated;
  },
};
