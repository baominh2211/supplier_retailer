import { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';
import { cache, cacheKeys } from '../config/redis.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors.js';
import { CreateProductInput, UpdateProductInput, ProductFilterInput } from '../utils/validators.js';
import { logger } from '../utils/logger.js';

export interface ProductWithDetails {
  id: string;
  supplierId: string;
  categoryId: string;
  name: string;
  description: string | null;
  unitPrice: Prisma.Decimal;
  currency: string;
  minOrderQuantity: number;
  stockQuantity: number;
  isActive: boolean;
  mainImageUrl: string | null;
  createdAt: Date;
  supplier: {
    id: string;
    companyName: string;
    country: string;
    ratingAverage: Prisma.Decimal;
    status: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
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

export const productService = {
  /**
   * Get product by ID
   */
  async getById(id: string): Promise<ProductWithDetails | null> {
    // Try cache first
    const cached = await cache.get<ProductWithDetails>(cacheKeys.product(id));
    if (cached) return cached;

    const product = await prisma.product.findUnique({
      where: { id, deletedAt: null },
      include: {
        supplier: {
          select: {
            id: true,
            companyName: true,
            country: true,
            ratingAverage: true,
            status: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (product) {
      // Cache for 5 minutes
      await cache.set(cacheKeys.product(id), product, 300);
    }

    return product;
  },

  /**
   * List products with filters
   */
  async list(filters: ProductFilterInput): Promise<PaginatedResult<ProductWithDetails>> {
    const {
      page,
      limit,
      sortBy,
      sortOrder,
      categoryId,
      supplierId,
      minPrice,
      maxPrice,
      minMoq,
      maxMoq,
      country,
      brand,
      search,
      isActive,
      isFeatured,
    } = filters;

    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      ...(categoryId && { categoryId }),
      ...(supplierId && { supplierId }),
      ...(minPrice !== undefined && { unitPrice: { gte: minPrice } }),
      ...(maxPrice !== undefined && { unitPrice: { lte: maxPrice } }),
      ...(minMoq !== undefined && { minOrderQuantity: { gte: minMoq } }),
      ...(maxMoq !== undefined && { minOrderQuantity: { lte: maxMoq } }),
      ...(brand && { brand: { contains: brand, mode: 'insensitive' } }),
      ...(isActive !== undefined && { isActive }),
      ...(isFeatured !== undefined && { isFeatured }),
      ...(country && {
        supplier: {
          country: { contains: country, mode: 'insensitive' },
        },
      }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { brand: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ],
      }),
      // Only show products from verified suppliers for public listing
      supplier: {
        status: 'VERIFIED',
        deletedAt: null,
      },
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput = sortBy
      ? { [sortBy]: sortOrder }
      : { createdAt: 'desc' };

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          supplier: {
            select: {
              id: true,
              companyName: true,
              country: true,
              ratingAverage: true,
              status: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
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
   * List products by supplier (includes non-verified)
   */
  async listBySupplier(
    supplierId: string,
    filters: Omit<ProductFilterInput, 'supplierId'>
  ): Promise<PaginatedResult<ProductWithDetails>> {
    const { page, limit, sortBy, sortOrder, search, isActive } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      supplierId,
      deletedAt: null,
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput = sortBy
      ? { [sortBy]: sortOrder }
      : { createdAt: 'desc' };

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          supplier: {
            select: {
              id: true,
              companyName: true,
              country: true,
              ratingAverage: true,
              status: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
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
   * Create a new product
   */
  async create(
    supplierId: string,
    userId: string,
    data: CreateProductInput
  ): Promise<ProductWithDetails> {
    // Verify supplier ownership
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });

    if (!supplier || supplier.deletedAt) {
      throw new NotFoundError('Supplier not found');
    }

    if (supplier.userId !== userId) {
      throw new ForbiddenError('You can only create products for your own supplier account');
    }

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId, isActive: true },
    });

    if (!category) {
      throw new BadRequestError('Invalid category');
    }

    // Check for duplicate SKU if provided
    if (data.sku) {
      const existingSku = await prisma.product.findUnique({
        where: { sku: data.sku },
      });

      if (existingSku) {
        throw new BadRequestError('SKU already exists');
      }
    }

    const product = await prisma.product.create({
      data: {
        supplierId,
        ...data,
        unitPrice: new Prisma.Decimal(data.unitPrice),
      },
      include: {
        supplier: {
          select: {
            id: true,
            companyName: true,
            country: true,
            ratingAverage: true,
            status: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Update supplier product count
    await prisma.supplier.update({
      where: { id: supplierId },
      data: { totalProducts: { increment: 1 } },
    });

    // Update category product count
    await prisma.category.update({
      where: { id: data.categoryId },
      data: { productCount: { increment: 1 } },
    });

    logger.info({ productId: product.id, supplierId }, 'Product created');

    return product;
  },

  /**
   * Update a product
   */
  async update(
    id: string,
    userId: string,
    data: UpdateProductInput
  ): Promise<ProductWithDetails> {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { supplier: true },
    });

    if (!product || product.deletedAt) {
      throw new NotFoundError('Product not found');
    }

    if (product.supplier.userId !== userId) {
      throw new ForbiddenError('You can only update your own products');
    }

    // Verify category if changing
    if (data.categoryId && data.categoryId !== product.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId, isActive: true },
      });

      if (!category) {
        throw new BadRequestError('Invalid category');
      }

      // Update category counts
      await Promise.all([
        prisma.category.update({
          where: { id: product.categoryId },
          data: { productCount: { decrement: 1 } },
        }),
        prisma.category.update({
          where: { id: data.categoryId },
          data: { productCount: { increment: 1 } },
        }),
      ]);
    }

    // Check for duplicate SKU if changing
    if (data.sku && data.sku !== product.sku) {
      const existingSku = await prisma.product.findUnique({
        where: { sku: data.sku },
      });

      if (existingSku && existingSku.id !== id) {
        throw new BadRequestError('SKU already exists');
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...data,
        ...(data.unitPrice && { unitPrice: new Prisma.Decimal(data.unitPrice) }),
        updatedAt: new Date(),
      },
      include: {
        supplier: {
          select: {
            id: true,
            companyName: true,
            country: true,
            ratingAverage: true,
            status: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Invalidate cache
    await cache.del(cacheKeys.product(id));

    logger.info({ productId: id }, 'Product updated');

    return updated;
  },

  /**
   * Soft delete a product
   */
  async delete(id: string, userId: string): Promise<void> {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { supplier: true },
    });

    if (!product || product.deletedAt) {
      throw new NotFoundError('Product not found');
    }

    if (product.supplier.userId !== userId) {
      throw new ForbiddenError('You can only delete your own products');
    }

    await prisma.product.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    // Update supplier product count
    await prisma.supplier.update({
      where: { id: product.supplierId },
      data: { totalProducts: { decrement: 1 } },
    });

    // Update category count
    await prisma.category.update({
      where: { id: product.categoryId },
      data: { productCount: { decrement: 1 } },
    });

    // Invalidate cache
    await cache.del(cacheKeys.product(id));

    logger.info({ productId: id }, 'Product deleted');
  },

  /**
   * Increment view count
   */
  async incrementViewCount(id: string): Promise<void> {
    await prisma.product.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  },

  /**
   * Toggle product active status
   */
  async toggleActive(id: string, userId: string): Promise<ProductWithDetails> {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { supplier: true },
    });

    if (!product || product.deletedAt) {
      throw new NotFoundError('Product not found');
    }

    if (product.supplier.userId !== userId) {
      throw new ForbiddenError('You can only update your own products');
    }

    const updated = await prisma.product.update({
      where: { id },
      data: { isActive: !product.isActive },
      include: {
        supplier: {
          select: {
            id: true,
            companyName: true,
            country: true,
            ratingAverage: true,
            status: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Invalidate cache
    await cache.del(cacheKeys.product(id));

    return updated;
  },

  /**
   * Get featured products
   */
  async getFeatured(limit: number = 10): Promise<ProductWithDetails[]> {
    return prisma.product.findMany({
      where: {
        isActive: true,
        isFeatured: true,
        featuredUntil: { gt: new Date() },
        deletedAt: null,
        supplier: {
          status: 'VERIFIED',
          deletedAt: null,
        },
      },
      include: {
        supplier: {
          select: {
            id: true,
            companyName: true,
            country: true,
            ratingAverage: true,
            status: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { qualityScore: 'desc' },
      take: limit,
    });
  },
};
