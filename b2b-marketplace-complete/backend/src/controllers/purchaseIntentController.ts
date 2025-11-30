import { Request, Response } from 'express';
import { purchaseIntentService } from '../services/purchaseIntentService.js';

export const purchaseIntentController = {
  /**
   * Get purchase intent by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const intent = await purchaseIntentService.getById(id, req.user!.id);

    if (!intent) {
      res.status(404).json({
        success: false,
        error: { message: 'Purchase intent not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: intent,
    });
  },

  /**
   * Get purchase intent by intent number
   */
  async getByIntentNumber(req: Request, res: Response): Promise<void> {
    const { intentNumber } = req.params;
    const intent = await purchaseIntentService.getByIntentNumber(
      intentNumber,
      req.user!.id
    );

    if (!intent) {
      res.status(404).json({
        success: false,
        error: { message: 'Purchase intent not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: intent,
    });
  },

  /**
   * List purchase intents
   */
  async list(req: Request, res: Response): Promise<void> {
    const role = req.user!.role as 'SHOP' | 'SUPPLIER';

    if (role !== 'SHOP' && role !== 'SUPPLIER') {
      res.status(403).json({
        success: false,
        error: { message: 'Only shops and suppliers can list purchase intents' },
      });
      return;
    }

    const result = await purchaseIntentService.listForUser(
      req.user!.id,
      role,
      req.query as any
    );

    res.json({
      success: true,
      ...result,
    });
  },

  /**
   * Create purchase intent (Shop only)
   */
  async create(req: Request, res: Response): Promise<void> {
    const intent = await purchaseIntentService.create(req.user!.id, req.body);

    res.status(201).json({
      success: true,
      message: 'Purchase intent created',
      data: intent,
    });
  },

  /**
   * Submit purchase intent to supplier
   */
  async submit(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const intent = await purchaseIntentService.submit(id, req.user!.id);

    res.json({
      success: true,
      message: 'Purchase intent submitted to supplier',
      data: intent,
    });
  },

  /**
   * Supplier accepts purchase intent
   */
  async accept(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const intent = await purchaseIntentService.accept(id, req.user!.id);

    res.json({
      success: true,
      message: 'Purchase intent accepted',
      data: intent,
    });
  },

  /**
   * Cancel/Reject purchase intent
   */
  async cancel(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { cancellationReason } = req.body;

    const intent = await purchaseIntentService.cancel(
      id,
      req.user!.id,
      cancellationReason
    );

    res.json({
      success: true,
      message: 'Purchase intent cancelled',
      data: intent,
    });
  },
};
