import { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { cache, cacheKeys } from '../config/redis.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  level: number;
  productCount: number;
  children: CategoryNode[];
}

export const categoryController = {
  /**
   * Get all categories as a tree
   */
  async getTree(req: Request, res: Response): Promise<void> {
    // Try cache first
    const cached = await cache.get<CategoryNode[]>(cacheKeys.categoryTree());
    if (cached) {
      res.json({
        success: true,
        data: cached,
      });
      return;
    }

    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ level: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });

    // Build tree structure
    const categoryMap = new Map<string, CategoryNode>();
    const roots: CategoryNode[] = [];

    // First pass: create nodes
    for (const cat of categories) {
      categoryMap.set(cat.id, {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        level: cat.level,
        productCount: cat.productCount,
        children: [],
      });
    }

    // Second pass: build tree
    for (const cat of categories) {
      const node = categoryMap.get(cat.id)!;
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        roots.push(node);
      }
    }

    // Cache for 10 minutes
    await cache.set(cacheKeys.categoryTree(), roots, 600);

    res.json({
      success: true,
      data: roots,
    });
  },

  /**
   * Get category by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: {
          select: { id: true, name: true, slug: true },
        },
        children: {
          where: { isActive: true },
          select: { id: true, name: true, slug: true, productCount: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!category) {
      res.status(404).json({
        success: false,
        error: { message: 'Category not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: category,
    });
  },

  /**
   * Get category by slug
   */
  async getBySlug(req: Request, res: Response): Promise<void> {
    const { slug } = req.params;

    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        parent: {
          select: { id: true, name: true, slug: true },
        },
        children: {
          where: { isActive: true },
          select: { id: true, name: true, slug: true, productCount: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!category) {
      res.status(404).json({
        success: false,
        error: { message: 'Category not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: category,
    });
  },

  /**
   * Create category (Admin only)
   */
  async create(req: Request, res: Response): Promise<void> {
    const { parentId, slug, ...data } = req.body;

    // Check slug uniqueness
    const existing = await prisma.category.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new BadRequestError('Category slug already exists');
    }

    // Determine level
    let level = 1;
    if (parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: parentId },
      });

      if (!parent) {
        throw new BadRequestError('Parent category not found');
      }

      level = parent.level + 1;

      // Limit depth to 5 levels
      if (level > 5) {
        throw new BadRequestError('Maximum category depth (5) exceeded');
      }
    }

    const category = await prisma.category.create({
      data: {
        ...data,
        slug,
        parentId,
        level,
      },
    });

    // Invalidate cache
    await cache.del(cacheKeys.categoryTree());

    logger.info({ categoryId: category.id }, 'Category created');

    res.status(201).json({
      success: true,
      message: 'Category created',
      data: category,
    });
  },

  /**
   * Update category (Admin only)
   */
  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { slug, parentId, ...data } = req.body;

    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    // Check slug uniqueness if changing
    if (slug && slug !== category.slug) {
      const existing = await prisma.category.findUnique({
        where: { slug },
      });

      if (existing) {
        throw new BadRequestError('Category slug already exists');
      }
    }

    // Handle parent change
    let level = category.level;
    if (parentId !== undefined && parentId !== category.parentId) {
      if (parentId === id) {
        throw new BadRequestError('Category cannot be its own parent');
      }

      if (parentId) {
        const parent = await prisma.category.findUnique({
          where: { id: parentId },
        });

        if (!parent) {
          throw new BadRequestError('Parent category not found');
        }

        // Check for circular reference
        let currentParent = parent;
        while (currentParent.parentId) {
          if (currentParent.parentId === id) {
            throw new BadRequestError('Circular reference detected');
          }
          const nextParent = await prisma.category.findUnique({
            where: { id: currentParent.parentId },
          });
          if (!nextParent) break;
          currentParent = nextParent;
        }

        level = parent.level + 1;
      } else {
        level = 1;
      }
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...data,
        ...(slug && { slug }),
        ...(parentId !== undefined && { parentId, level }),
      },
    });

    // Invalidate cache
    await cache.del(cacheKeys.categoryTree());

    logger.info({ categoryId: id }, 'Category updated');

    res.json({
      success: true,
      message: 'Category updated',
      data: updated,
    });
  },

  /**
   * Delete category (Admin only)
   */
  async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        children: { select: { id: true } },
        products: { select: { id: true }, take: 1 },
      },
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    if (category.children.length > 0) {
      throw new BadRequestError('Cannot delete category with subcategories');
    }

    if (category.products.length > 0) {
      throw new BadRequestError('Cannot delete category with products');
    }

    await prisma.category.delete({
      where: { id },
    });

    // Invalidate cache
    await cache.del(cacheKeys.categoryTree());

    logger.info({ categoryId: id }, 'Category deleted');

    res.json({
      success: true,
      message: 'Category deleted',
    });
  },
};
