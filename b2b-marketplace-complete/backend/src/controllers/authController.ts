import { Request, Response } from 'express';
import { authService } from '../services/authService.js';
import { logger } from '../utils/logger.js';

export const authController = {
  /**
   * Register a new user
   */
  async register(req: Request, res: Response): Promise<void> {
    const result = await authService.register(
      req.body,
      req.get('user-agent'),
      req.ip
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email.',
      data: result,
    });
  },

  /**
   * Login
   */
  async login(req: Request, res: Response): Promise<void> {
    const result = await authService.login(
      req.body,
      req.get('user-agent'),
      req.ip
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  },

  /**
   * Refresh tokens
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body;

    const tokens = await authService.refreshTokens(
      refreshToken,
      req.get('user-agent'),
      req.ip
    );

    res.json({
      success: true,
      data: tokens,
    });
  },

  /**
   * Logout
   */
  async logout(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body;

    await authService.logout(refreshToken);

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  },

  /**
   * Logout from all devices
   */
  async logoutAll(req: Request, res: Response): Promise<void> {
    await authService.logoutAll(req.user!.id);

    res.json({
      success: true,
      message: 'Logged out from all devices',
    });
  },

  /**
   * Verify email
   */
  async verifyEmail(req: Request, res: Response): Promise<void> {
    const { token } = req.body;

    await authService.verifyEmail(token);

    res.json({
      success: true,
      message: 'Email verified successfully',
    });
  },

  /**
   * Request password reset
   */
  async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body;

    await authService.forgotPassword(email);

    // Always return success to prevent email enumeration
    res.json({
      success: true,
      message: 'If your email is registered, you will receive a password reset link',
    });
  },

  /**
   * Reset password
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    const { token, password } = req.body;

    await authService.resetPassword(token, password);

    res.json({
      success: true,
      message: 'Password reset successful. Please login with your new password.',
    });
  },

  /**
   * Change password (authenticated)
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    const { currentPassword, newPassword } = req.body;

    await authService.changePassword(req.user!.id, currentPassword, newPassword);

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  },

  /**
   * Resend verification email
   */
  async resendVerification(req: Request, res: Response): Promise<void> {
    await authService.resendVerificationEmail(req.user!.id);

    res.json({
      success: true,
      message: 'Verification email sent',
    });
  },

  /**
   * Get current user
   */
  async me(req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      data: {
        id: req.user!.id,
        email: req.user!.email,
        role: req.user!.role,
        emailVerified: req.user!.emailVerified,
      },
    });
  },
};
