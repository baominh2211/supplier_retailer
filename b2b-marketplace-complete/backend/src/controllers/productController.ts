import { Request, Response } from 'express';
import { productService } from '../services/productService.js';
import { prisma } from '../config/database.js';

export const productController = {
  /**
   * Get product by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const product = await productService.getById(id);

    if (!product) {
      res.status(404).json({
        success: false,
        error: { message: 'Product not found' },
      });
      return;
    }

    // Increment view count (async, don't wait)
    productService.incrementViewCount(id).catch(() => {});

    res.json({
      success: true,
      data: product,
    });
  },

  /**
   * List products (public)
   */
  async list(req: Request, res: Response): Promise<void> {
    const result = await productService.list(req.query as any);

    res.json({
      success: true,
      ...result,
    });
  },

  /**
   * List products by supplier
   */
  async listBySupplier(req: Request, res: Response): Promise<void> {
    const { supplierId } = req.params;
    const result = await productService.listBySupplier(supplierId, req.query as any);

    res.json({
      success: true,
      ...result,
    });
  },

  /**
   * List my products (supplier)
   */
  async listMyProducts(req: Request, res: Response): Promise<void> {
    const supplier = await prisma.supplier.findUnique({
      where: { userId: req.user!.id },
      select: { id: true },
    });

    if (!supplier) {
      res.status(404).json({
        success: false,
        error: { message: 'Supplier profile not found' },
      });
      return;
    }

    const result = await productService.listBySupplier(supplier.id, req.query as any);

    res.json({
      success: true,
      ...result,
    });
  },

  /**
   * Create product
   */
  async create(req: Request, res: Response): Promise<void> {
    const supplier = await prisma.supplier.findUnique({
      where: { userId: req.user!.id },
      select: { id: true },
    });

    if (!supplier) {
      res.status(404).json({
        success: false,
        error: { message: 'Supplier profile not found' },
      });
      return;
    }

    const product = await productService.create(supplier.id, req.user!.id, req.body);

    res.status(201).json({
      success: true,
      message: 'Product created',
      data: product,
    });
  },

  /**
   * Update product
   */
  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const product = await productService.update(id, req.user!.id, req.body);

    res.json({
      success: true,
      message: 'Product updated',
      data: product,
    });
  },

  /**
   * Delete product
   */
  async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    await productService.delete(id, req.user!.id);

    res.json({
      success: true,
      message: 'Product deleted',
    });
  },

  /**
   * Toggle product active status
   */
  async toggleActive(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const product = await productService.toggleActive(id, req.user!.id);

    res.json({
      success: true,
      message: `Product ${product.isActive ? 'activated' : 'deactivated'}`,
      data: product,
    });
  },

  /**
   * Get featured products
   */
  async getFeatured(req: Request, res: Response): Promise<void> {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const products = await productService.getFeatured(limit);

    res.json({
      success: true,
      data: products,
    });
  },
};
