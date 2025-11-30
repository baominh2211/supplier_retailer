import { UserRole } from '@prisma/client';
import { prisma } from '../config/database.js';
import { cache, cacheKeys } from '../config/redis.js';
import { hashPassword, comparePassword, generateToken } from '../utils/password.js';
import {
  generateTokenPair,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  TokenPair,
} from '../utils/jwt.js';
import {
  ConflictError,
  InvalidCredentialsError,
  NotFoundError,
  BadRequestError,
  AccountSuspendedError,
} from '../utils/errors.js';
import { RegisterInput, LoginInput } from '../utils/validators.js';
import { emailService } from './emailService.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

export interface AuthResult {
  user: {
    id: string;
    email: string;
    role: UserRole;
    emailVerified: boolean;
  };
  tokens: TokenPair;
}

export const authService = {
  /**
   * Register a new user
   */
  async register(input: RegisterInput, userAgent?: string, ipAddress?: string): Promise<AuthResult> {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // Hash password
    const passwordHash = await hashPassword(input.password);

    // Create user and profile in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: input.email.toLowerCase(),
          passwordHash,
          role: input.role as UserRole,
          accountStatus: 'PENDING_EMAIL_VERIFICATION',
        },
      });

      // Create profile based on role
      if (input.role === 'SUPPLIER' && input.companyName) {
        await tx.supplier.create({
          data: {
            userId: user.id,
            companyName: input.companyName,
            legalName: input.companyName,
            taxId: 'PENDING',
            country: input.country,
          },
        });
      } else if (input.role === 'SHOP' && input.shopName) {
        await tx.shop.create({
          data: {
            userId: user.id,
            shopName: input.shopName,
            country: input.country,
          },
        });
      }

      return user;
    });

    // Generate verification token
    const verificationToken = generateToken(64);
    await cache.set(
      cacheKeys.emailVerification(verificationToken),
      result.id,
      24 * 60 * 60 // 24 hours
    );

    // Send verification email
    await emailService.sendVerificationEmail(result.email, verificationToken);

    // Generate tokens
    const tokens = await generateTokenPair(
      { id: result.id, email: result.email, role: result.role },
      userAgent,
      ipAddress
    );

    logger.info({ userId: result.id, email: result.email }, 'User registered successfully');

    return {
      user: {
        id: result.id,
        email: result.email,
        role: result.role,
        emailVerified: false,
      },
      tokens,
    };
  },

  /**
   * Login user
   */
  async login(input: LoginInput, userAgent?: string, ipAddress?: string): Promise<AuthResult> {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user || user.deletedAt) {
      throw new InvalidCredentialsError();
    }

    // Check account status
    if (user.accountStatus === 'BANNED') {
      throw new AccountSuspendedError();
    }

    if (user.accountStatus === 'SUSPENDED') {
      throw new AccountSuspendedError();
    }

    // Verify password
    const isValidPassword = await comparePassword(input.password, user.passwordHash);

    if (!isValidPassword) {
      // Record failed login attempt
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: { increment: 1 },
          lastFailedLoginAt: new Date(),
        },
      });

      throw new InvalidCredentialsError();
    }

    // Update login stats
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        loginCount: { increment: 1 },
        failedLoginAttempts: 0,
      },
    });

    // Generate tokens
    const tokens = await generateTokenPair(
      { id: user.id, email: user.email, role: user.role },
      userAgent,
      ipAddress
    );

    logger.info({ userId: user.id }, 'User logged in');

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      tokens,
    };
  },

  /**
   * Refresh tokens
   */
  async refreshTokens(refreshToken: string, userAgent?: string, ipAddress?: string): Promise<TokenPair> {
    const { userId } = await verifyRefreshToken(refreshToken);

    // Revoke old refresh token
    await revokeRefreshToken(refreshToken);

    // Fetch user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.deletedAt || user.accountStatus !== 'ACTIVE') {
      throw new InvalidCredentialsError();
    }

    // Generate new tokens
    return generateTokenPair(
      { id: user.id, email: user.email, role: user.role },
      userAgent,
      ipAddress
    );
  },

  /**
   * Logout user
   */
  async logout(refreshToken: string): Promise<void> {
    await revokeRefreshToken(refreshToken);
  },

  /**
   * Logout from all devices
   */
  async logoutAll(userId: string): Promise<void> {
    await revokeAllUserTokens(userId);
  },

  /**
   * Verify email
   */
  async verifyEmail(token: string): Promise<void> {
    const userId = await cache.get<string>(cacheKeys.emailVerification(token));

    if (!userId) {
      throw new BadRequestError('Invalid or expired verification token');
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        accountStatus: 'ACTIVE',
      },
    });

    // Delete token
    await cache.del(cacheKeys.emailVerification(token));

    logger.info({ userId }, 'Email verified');
  },

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user || user.deletedAt) {
      return;
    }

    // Generate reset token
    const resetToken = generateToken(64);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: expiresAt,
      },
    });

    // Send reset email
    await emailService.sendPasswordResetEmail(user.email, resetToken);

    logger.info({ userId: user.id }, 'Password reset requested');
  },

  /**
   * Reset password
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestError('Invalid or expired reset token');
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    // Revoke all refresh tokens
    await revokeAllUserTokens(user.id);

    logger.info({ userId: user.id }, 'Password reset successful');
  },

  /**
   * Change password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isValidPassword = await comparePassword(currentPassword, user.passwordHash);

    if (!isValidPassword) {
      throw new BadRequestError('Current password is incorrect');
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Optionally revoke all other sessions
    await revokeAllUserTokens(userId);

    logger.info({ userId }, 'Password changed');
  },

  /**
   * Resend verification email
   */
  async resendVerificationEmail(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestError('Email already verified');
    }

    // Generate new verification token
    const verificationToken = generateToken(64);
    await cache.set(
      cacheKeys.emailVerification(verificationToken),
      user.id,
      24 * 60 * 60 // 24 hours
    );

    // Send verification email
    await emailService.sendVerificationEmail(user.email, verificationToken);

    logger.info({ userId }, 'Verification email resent');
  },
};
