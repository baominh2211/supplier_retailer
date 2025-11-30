import { Request, Response } from 'express';
import { supplierService } from '../services/supplierService.js';

export const supplierController = {
  /**
   * Get supplier by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const supplier = await supplierService.getById(id);

    if (!supplier) {
      res.status(404).json({
        success: false,
        error: { message: 'Supplier not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: supplier,
    });
  },

  /**
   * Get current user's supplier profile
   */
  async getMyProfile(req: Request, res: Response): Promise<void> {
    const supplier = await supplierService.getByUserId(req.user!.id);

    if (!supplier) {
      res.status(404).json({
        success: false,
        error: { message: 'Supplier profile not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: supplier,
    });
  },

  /**
   * List suppliers (public - verified only)
   */
  async list(req: Request, res: Response): Promise<void> {
    const result = await supplierService.listVerified(req.query as any);

    res.json({
      success: true,
      ...result,
    });
  },

  /**
   * List all suppliers (admin)
   */
  async listAll(req: Request, res: Response): Promise<void> {
    const result = await supplierService.list(req.query as any);

    res.json({
      success: true,
      ...result,
    });
  },

  /**
   * Update supplier profile
   */
  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const supplier = await supplierService.update(id, req.user!.id, req.body);

    res.json({
      success: true,
      message: 'Supplier profile updated',
      data: supplier,
    });
  },

  /**
   * Submit for verification
   */
  async submitForVerification(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const supplier = await supplierService.submitForVerification(id, req.user!.id);

    res.json({
      success: true,
      message: 'Supplier submitted for verification',
      data: supplier,
    });
  },

  /**
   * Admin: Verify supplier
   */
  async verify(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { approved, rejectionReason } = req.body;

    const supplier = await supplierService.verify(
      id,
      req.user!.id,
      approved,
      rejectionReason
    );

    res.json({
      success: true,
      message: approved ? 'Supplier verified' : 'Supplier rejected',
      data: supplier,
    });
  },

  /**
   * Admin: Suspend supplier
   */
  async suspend(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { reason } = req.body;

    const supplier = await supplierService.suspend(id, req.user!.id, reason);

    res.json({
      success: true,
      message: 'Supplier suspended',
      data: supplier,
    });
  },

  /**
   * Get supplier statistics
   */
  async getStats(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const stats = await supplierService.getStats(id);

    res.json({
      success: true,
      data: stats,
    });
  },
};
