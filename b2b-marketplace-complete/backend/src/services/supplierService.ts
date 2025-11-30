import { Prisma, SupplierStatus } from '@prisma/client';
import { prisma } from '../config/database.js';
import { cache, cacheKeys } from '../config/redis.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors.js';
import { CreateSupplierInput, UpdateSupplierInput, SupplierFilterInput } from '../utils/validators.js';
import { emailService } from './emailService.js';
import { logger } from '../utils/logger.js';

export interface SupplierWithUser {
  id: string;
  userId: string;
  companyName: string;
  legalName: string;
  taxId: string;
  country: string;
  status: SupplierStatus;
  ratingAverage: Prisma.Decimal;
  ratingCount: number;
  totalProducts: number;
  description: string | null;
  logoUrl: string | null;
  verifiedAt: Date | null;
  createdAt: Date;
  user: {
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

export const supplierService = {
  /**
   * Get supplier by ID
   */
  async getById(id: string): Promise<SupplierWithUser | null> {
    // Try cache first
    const cached = await cache.get<SupplierWithUser>(cacheKeys.supplier(id));
    if (cached) return cached;

    const supplier = await prisma.supplier.findUnique({
      where: { id, deletedAt: null },
      include: {
        user: {
          select: { email: true },
        },
      },
    });

    if (supplier) {
      // Cache for 5 minutes
      await cache.set(cacheKeys.supplier(id), supplier, 300);
    }

    return supplier;
  },

  /**
   * Get supplier by user ID
   */
  async getByUserId(userId: string): Promise<SupplierWithUser | null> {
    return prisma.supplier.findUnique({
      where: { userId, deletedAt: null },
      include: {
        user: {
          select: { email: true },
        },
      },
    });
  },

  /**
   * List suppliers with filters
   */
  async list(filters: SupplierFilterInput): Promise<PaginatedResult<SupplierWithUser>> {
    const { page, limit, sortBy, sortOrder, status, country, minRating, search } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.SupplierWhereInput = {
      deletedAt: null,
      ...(status && { status }),
      ...(country && { country }),
      ...(minRating !== undefined && { ratingAverage: { gte: minRating } }),
      ...(search && {
        OR: [
          { companyName: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const orderBy: Prisma.SupplierOrderByWithRelationInput = sortBy
      ? { [sortBy]: sortOrder }
      : { createdAt: 'desc' };

    const [data, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        include: {
          user: {
            select: { email: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.supplier.count({ where }),
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
   * List verified suppliers for public view
   */
  async listVerified(filters: SupplierFilterInput): Promise<PaginatedResult<SupplierWithUser>> {
    return this.list({
      ...filters,
      status: 'VERIFIED',
    });
  },

  /**
   * Update supplier profile
   */
  async update(id: string, userId: string, data: UpdateSupplierInput): Promise<SupplierWithUser> {
    const supplier = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!supplier || supplier.deletedAt) {
      throw new NotFoundError('Supplier not found');
    }

    if (supplier.userId !== userId) {
      throw new ForbiddenError('You can only update your own supplier profile');
    }

    const updated = await prisma.supplier.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: { email: true },
        },
      },
    });

    // Invalidate cache
    await cache.del(cacheKeys.supplier(id));

    logger.info({ supplierId: id }, 'Supplier profile updated');

    return updated;
  },

  /**
   * Submit supplier for verification
   */
  async submitForVerification(id: string, userId: string): Promise<SupplierWithUser> {
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        user: {
          select: { email: true },
        },
      },
    });

    if (!supplier || supplier.deletedAt) {
      throw new NotFoundError('Supplier not found');
    }

    if (supplier.userId !== userId) {
      throw new ForbiddenError('You can only submit your own supplier profile');
    }

    if (supplier.status !== 'PENDING_VERIFICATION' && supplier.status !== 'REJECTED') {
      throw new BadRequestError('Supplier is already submitted or verified');
    }

    // Validate required fields for verification
    const requiredFields = ['companyName', 'legalName', 'taxId', 'country'];
    const missingFields = requiredFields.filter(field => !supplier[field as keyof typeof supplier]);

    if (missingFields.length > 0) {
      throw new BadRequestError(`Missing required fields: ${missingFields.join(', ')}`);
    }

    const updated = await prisma.supplier.update({
      where: { id },
      data: {
        status: 'PENDING_VERIFICATION',
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: { email: true },
        },
      },
    });

    // Invalidate cache
    await cache.del(cacheKeys.supplier(id));

    logger.info({ supplierId: id }, 'Supplier submitted for verification');

    return updated;
  },

  /**
   * Admin: Verify or reject supplier
   */
  async verify(
    id: string,
    adminId: string,
    approved: boolean,
    rejectionReason?: string
  ): Promise<SupplierWithUser> {
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        user: {
          select: { email: true },
        },
      },
    });

    if (!supplier || supplier.deletedAt) {
      throw new NotFoundError('Supplier not found');
    }

    if (supplier.status !== 'PENDING_VERIFICATION') {
      throw new BadRequestError('Supplier is not pending verification');
    }

    const newStatus = approved ? 'VERIFIED' : 'REJECTED';

    const updated = await prisma.supplier.update({
      where: { id },
      data: {
        status: newStatus,
        verifiedAt: approved ? new Date() : null,
        verifiedByAdminId: approved ? adminId : null,
        rejectionReason: approved ? null : rejectionReason,
        nextReverificationDate: approved
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
          : null,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: { email: true },
        },
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: approved ? 'SUPPLIER_VERIFIED' : 'SUPPLIER_REJECTED',
        entityType: 'SUPPLIER',
        entityId: id,
        newValue: { status: newStatus, rejectionReason },
      },
    });

    // Send notification email
    await emailService.sendSupplierVerificationEmail(
      updated.user.email,
      updated.companyName,
      approved,
      rejectionReason
    );

    // Invalidate cache
    await cache.del(cacheKeys.supplier(id));

    logger.info({ supplierId: id, approved }, 'Supplier verification processed');

    return updated;
  },

  /**
   * Admin: Suspend supplier
   */
  async suspend(id: string, adminId: string, reason: string): Promise<SupplierWithUser> {
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        user: {
          select: { email: true },
        },
      },
    });

    if (!supplier || supplier.deletedAt) {
      throw new NotFoundError('Supplier not found');
    }

    if (supplier.status === 'SUSPENDED' || supplier.status === 'BANNED') {
      throw new BadRequestError('Supplier is already suspended or banned');
    }

    const updated = await prisma.supplier.update({
      where: { id },
      data: {
        status: 'SUSPENDED',
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: { email: true },
        },
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'SUPPLIER_SUSPENDED',
        entityType: 'SUPPLIER',
        entityId: id,
        newValue: { reason },
      },
    });

    // Invalidate cache
    await cache.del(cacheKeys.supplier(id));

    logger.info({ supplierId: id, reason }, 'Supplier suspended');

    return updated;
  },

  /**
   * Get supplier statistics
   */
  async getStats(id: string): Promise<{
    totalProducts: number;
    totalNegotiations: number;
    successfulNegotiations: number;
    responseTimeHours: number | null;
    ratingAverage: number;
    ratingCount: number;
  }> {
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      select: {
        totalProducts: true,
        totalNegotiations: true,
        successfulNegotiations: true,
        responseTimeHours: true,
        ratingAverage: true,
        ratingCount: true,
      },
    });

    if (!supplier) {
      throw new NotFoundError('Supplier not found');
    }

    return {
      ...supplier,
      ratingAverage: Number(supplier.ratingAverage),
      responseTimeHours: supplier.responseTimeHours
        ? Number(supplier.responseTimeHours)
        : null,
    };
  },
};
