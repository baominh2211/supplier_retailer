import { Request, Response } from 'express';
import { negotiationService } from '../services/negotiationService.js';
import { UserRole } from '@prisma/client';

export const negotiationController = {
  /**
   * Get negotiation by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const negotiation = await negotiationService.getById(id, req.user!.id);

    if (!negotiation) {
      res.status(404).json({
        success: false,
        error: { message: 'Negotiation not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: negotiation,
    });
  },

  /**
   * List negotiations
   */
  async list(req: Request, res: Response): Promise<void> {
    const role = req.user!.role as 'SHOP' | 'SUPPLIER';

    if (role !== 'SHOP' && role !== 'SUPPLIER') {
      res.status(403).json({
        success: false,
        error: { message: 'Only shops and suppliers can list negotiations' },
      });
      return;
    }

    const result = await negotiationService.listForUser(
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
   * Create negotiation (Shop only)
   */
  async create(req: Request, res: Response): Promise<void> {
    const negotiation = await negotiationService.create(req.user!.id, req.body);

    res.status(201).json({
      success: true,
      message: 'Negotiation started',
      data: negotiation,
    });
  },

  /**
   * Send message
   */
  async sendMessage(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const message = await negotiationService.sendMessage(id, req.user!.id, req.body);

    res.status(201).json({
      success: true,
      data: message,
    });
  },

  /**
   * Get messages
   */
  async getMessages(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const result = await negotiationService.getMessages(
      id,
      req.user!.id,
      req.query as any
    );

    res.json({
      success: true,
      ...result,
    });
  },

  /**
   * Mark messages as read
   */
  async markAsRead(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    await negotiationService.markAsRead(id, req.user!.id);

    res.json({
      success: true,
      message: 'Messages marked as read',
    });
  },

  /**
   * Update negotiation status (agree/cancel)
   */
  async updateStatus(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { status, ...data } = req.body;

    const negotiation = await negotiationService.updateStatus(
      id,
      req.user!.id,
      status,
      data
    );

    res.json({
      success: true,
      message: status === 'AGREED' ? 'Negotiation agreed' : 'Negotiation cancelled',
      data: negotiation,
    });
  },
};
