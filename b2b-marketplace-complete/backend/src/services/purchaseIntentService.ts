import { Prisma, PurchaseIntentStatus } from '@prisma/client';
import { prisma } from '../config/database.js';
import { NotFoundError, ForbiddenError, BadRequestError, InvalidStateTransitionError } from '../utils/errors.js';
import { CreatePurchaseIntentInput, PaginationInput } from '../utils/validators.js';
import { emailService } from './emailService.js';
import { logger } from '../utils/logger.js';

export interface PurchaseIntentWithDetails {
  id: string;
  intentNumber: string;
  shopId: string;
  supplierId: string;
  status: PurchaseIntentStatus;
  productName: string;
  quantity: number;
  agreedUnitPrice: Prisma.Decimal;
  currency: string;
  totalAmount: Prisma.Decimal;
  createdAt: Date;
  expiresAt: Date | null;
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

// State machine valid transitions
const VALID_TRANSITIONS: Record<PurchaseIntentStatus, PurchaseIntentStatus[]> = {
  DRAFT: ['WAITING_SUPPLIER_RESPONSE', 'CANCELLED', 'EXPIRED'],
  WAITING_SUPPLIER_RESPONSE: ['NEGOTIATING', 'AGREED', 'CANCELLED', 'EXPIRED'],
  NEGOTIATING: ['NEGOTIATING', 'AGREED', 'CANCELLED', 'EXPIRED'],
  AGREED: [],
  CANCELLED: [],
  EXPIRED: [],
};

// Expiration times in milliseconds
const EXPIRATION_TIMES = {
  DRAFT: 30 * 24 * 60 * 60 * 1000, // 30 days
  WAITING_SUPPLIER_RESPONSE: 7 * 24 * 60 * 60 * 1000, // 7 days
  NEGOTIATING: 30 * 24 * 60 * 60 * 1000, // 30 days
};

/**
 * Generate unique intent number
 */
async function generateIntentNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.purchaseIntent.count({
    where: {
      createdAt: {
        gte: new Date(year, 0, 1),
        lt: new Date(year + 1, 0, 1),
      },
    },
  });
  return `PI-${year}-${String(count + 1).padStart(6, '0')}`;
}

export const purchaseIntentService = {
  /**
   * Validate state transition
   */
  isValidTransition(from: PurchaseIntentStatus, to: PurchaseIntentStatus): boolean {
    return VALID_TRANSITIONS[from].includes(to);
  },

  /**
   * Get purchase intent by ID
   */
  async getById(id: string, userId: string): Promise<PurchaseIntentWithDetails | null> {
    const intent = await prisma.purchaseIntent.findUnique({
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
      },
    });

    if (!intent) return null;

    // Verify user is a participant
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { shop: true, supplier: true },
    });

    const isShop = user?.shop?.id === intent.shopId;
    const isSupplier = user?.supplier?.id === intent.supplierId;
    const isAdmin = user?.role === 'ADMIN';

    if (!isShop && !isSupplier && !isAdmin) {
      throw new ForbiddenError('You are not authorized to view this purchase intent');
    }

    return intent;
  },

  /**
   * Get purchase intent by intent number
   */
  async getByIntentNumber(intentNumber: string, userId: string): Promise<PurchaseIntentWithDetails | null> {
    const intent = await prisma.purchaseIntent.findUnique({
      where: { intentNumber, deletedAt: null },
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
      },
    });

    if (!intent) return null;

    // Authorization check
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { shop: true, supplier: true },
    });

    const isShop = user?.shop?.id === intent.shopId;
    const isSupplier = user?.supplier?.id === intent.supplierId;
    const isAdmin = user?.role === 'ADMIN';

    if (!isShop && !isSupplier && !isAdmin) {
      throw new ForbiddenError('You are not authorized to view this purchase intent');
    }

    return intent;
  },

  /**
   * List purchase intents for a user
   */
  async listForUser(
    userId: string,
    role: 'SHOP' | 'SUPPLIER',
    filters: PaginationInput & { status?: PurchaseIntentStatus }
  ): Promise<PaginatedResult<PurchaseIntentWithDetails>> {
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

    const where: Prisma.PurchaseIntentWhereInput = {
      deletedAt: null,
      ...(role === 'SHOP' ? { shopId: entityId } : { supplierId: entityId }),
      ...(status && { status }),
    };

    const [data, total] = await Promise.all([
      prisma.purchaseIntent.findMany({
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
        },
        orderBy: { createdAt: sortOrder },
        skip,
        take: limit,
      }),
      prisma.purchaseIntent.count({ where }),
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
   * Create a new purchase intent (Shop creates)
   */
  async create(userId: string, data: CreatePurchaseIntentInput): Promise<PurchaseIntentWithDetails> {
    // Get shop for user
    const shop = await prisma.shop.findUnique({
      where: { userId },
      include: { user: { select: { email: true } } },
    });

    if (!shop) {
      throw new ForbiddenError('Only shops can create purchase intents');
    }

    // Verify supplier exists and is verified
    const supplier = await prisma.supplier.findUnique({
      where: { id: data.supplierId },
      include: { user: { select: { email: true } } },
    });

    if (!supplier || supplier.deletedAt || supplier.status !== 'VERIFIED') {
      throw new BadRequestError('Invalid or unverified supplier');
    }

    // Generate intent number
    const intentNumber = await generateIntentNumber();

    // Calculate total amount
    const totalAmount = new Prisma.Decimal(data.quantity).mul(data.agreedUnitPrice);

    const intent = await prisma.purchaseIntent.create({
      data: {
        intentNumber,
        shopId: shop.id,
        supplierId: data.supplierId,
        productId: data.productId,
        negotiationSessionId: data.negotiationSessionId,
        status: 'DRAFT',
        productName: data.productName,
        productSku: data.productSku,
        quantity: data.quantity,
        agreedUnitPrice: new Prisma.Decimal(data.agreedUnitPrice),
        currency: data.currency || 'USD',
        totalAmount,
        shippingTerms: data.shippingTerms,
        paymentTerms: data.paymentTerms,
        deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
        shippingAddress: data.shippingAddress || null,
        notes: data.notes,
        expiresAt: new Date(Date.now() + EXPIRATION_TIMES.DRAFT),
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
      },
    });

    // Update shop stats
    await prisma.shop.update({
      where: { id: shop.id },
      data: { totalPurchaseIntents: { increment: 1 } },
    });

    logger.info({ intentId: intent.id, intentNumber }, 'Purchase intent created');

    return intent;
  },

  /**
   * Submit purchase intent to supplier
   */
  async submit(id: string, userId: string): Promise<PurchaseIntentWithDetails> {
    const intent = await this.getById(id, userId);

    if (!intent) {
      throw new NotFoundError('Purchase intent not found');
    }

    // Validate shop ownership
    const shop = await prisma.shop.findUnique({
      where: { userId },
    });

    if (!shop || shop.id !== intent.shopId) {
      throw new ForbiddenError('Only the shop owner can submit this intent');
    }

    // Validate transition
    if (!this.isValidTransition(intent.status, 'WAITING_SUPPLIER_RESPONSE')) {
      throw new InvalidStateTransitionError(intent.status, 'WAITING_SUPPLIER_RESPONSE');
    }

    // Validate required fields
    if (!intent.quantity || !intent.agreedUnitPrice) {
      throw new BadRequestError('Quantity and price are required to submit');
    }

    const updated = await prisma.purchaseIntent.update({
      where: { id },
      data: {
        status: 'WAITING_SUPPLIER_RESPONSE',
        submittedAt: new Date(),
        expiresAt: new Date(Date.now() + EXPIRATION_TIMES.WAITING_SUPPLIER_RESPONSE),
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
      },
    });

    // Send notification to supplier
    await emailService.sendPurchaseIntentNotification(
      updated.supplier.user.email,
      'submitted',
      {
        intentNumber: updated.intentNumber,
        productName: updated.productName,
        amount: `${updated.currency} ${updated.totalAmount}`,
      }
    );

    logger.info({ intentId: id }, 'Purchase intent submitted');

    return updated;
  },

  /**
   * Supplier accepts purchase intent
   */
  async accept(id: string, userId: string): Promise<PurchaseIntentWithDetails> {
    const intent = await this.getById(id, userId);

    if (!intent) {
      throw new NotFoundError('Purchase intent not found');
    }

    // Validate supplier ownership
    const supplier = await prisma.supplier.findUnique({
      where: { userId },
    });

    if (!supplier || supplier.id !== intent.supplierId) {
      throw new ForbiddenError('Only the supplier can accept this intent');
    }

    // Validate transition
    if (!this.isValidTransition(intent.status, 'AGREED')) {
      throw new InvalidStateTransitionError(intent.status, 'AGREED');
    }

    const updated = await prisma.purchaseIntent.update({
      where: { id },
      data: {
        status: 'AGREED',
        agreedAt: new Date(),
        expiresAt: null, // No expiration for agreed intents
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
      },
    });

    // Update shop total orders value
    await prisma.shop.update({
      where: { id: intent.shopId },
      data: {
        totalOrdersValue: { increment: Number(updated.totalAmount) },
      },
    });

    // Send notification to shop
    await emailService.sendPurchaseIntentNotification(
      updated.shop.user.email,
      'agreed',
      {
        intentNumber: updated.intentNumber,
        productName: updated.productName,
        amount: `${updated.currency} ${updated.totalAmount}`,
      }
    );

    logger.info({ intentId: id }, 'Purchase intent agreed');

    return updated;
  },

  /**
   * Reject/Cancel purchase intent
   */
  async cancel(
    id: string,
    userId: string,
    reason: string
  ): Promise<PurchaseIntentWithDetails> {
    const intent = await this.getById(id, userId);

    if (!intent) {
      throw new NotFoundError('Purchase intent not found');
    }

    // Determine who is cancelling
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { shop: true, supplier: true },
    });

    const isShop = user?.shop?.id === intent.shopId;
    const isSupplier = user?.supplier?.id === intent.supplierId;

    // Validate transition
    if (!this.isValidTransition(intent.status, 'CANCELLED')) {
      throw new InvalidStateTransitionError(intent.status, 'CANCELLED');
    }

    const cancelledBy = isShop ? 'SHOP' : isSupplier ? 'SUPPLIER' : 'UNKNOWN';

    const updated = await prisma.purchaseIntent.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: reason,
        cancelledBy,
        expiresAt: null,
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
      },
    });

    // Send notification to the other party
    const recipientEmail = isShop
      ? updated.supplier.user.email
      : updated.shop.user.email;

    await emailService.sendPurchaseIntentNotification(
      recipientEmail,
      'cancelled',
      {
        intentNumber: updated.intentNumber,
        productName: updated.productName,
        amount: `${updated.currency} ${updated.totalAmount}`,
      }
    );

    logger.info({ intentId: id, cancelledBy }, 'Purchase intent cancelled');

    return updated;
  },

  /**
   * Expire purchase intents (called by cron job)
   */
  async expireIntents(): Promise<number> {
    const now = new Date();

    // Find all expired intents
    const expiredIntents = await prisma.purchaseIntent.findMany({
      where: {
        status: {
          in: ['DRAFT', 'WAITING_SUPPLIER_RESPONSE', 'NEGOTIATING'],
        },
        expiresAt: { lt: now },
        deletedAt: null,
      },
      include: {
        shop: {
          select: {
            user: { select: { email: true } },
          },
        },
      },
    });

    if (expiredIntents.length === 0) {
      return 0;
    }

    // Update all to expired
    await prisma.purchaseIntent.updateMany({
      where: {
        id: { in: expiredIntents.map(i => i.id) },
      },
      data: {
        status: 'EXPIRED',
        expiresAt: null,
      },
    });

    // Send notifications
    for (const intent of expiredIntents) {
      await emailService.sendPurchaseIntentNotification(
        intent.shop.user.email,
        'expired',
        {
          intentNumber: intent.intentNumber,
          productName: intent.productName,
          amount: `${intent.currency} ${intent.totalAmount}`,
        }
      ).catch(err => logger.error({ error: err }, 'Failed to send expiration notification'));
    }

    logger.info({ count: expiredIntents.length }, 'Purchase intents expired');

    return expiredIntents.length;
  },
};
