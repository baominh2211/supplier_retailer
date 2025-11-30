import { Request, Response, NextFunction } from 'express';
import { UserRole, UserAccountStatus } from '@prisma/client';
import { prisma } from '../config/database.js';
import { verifyAccessToken, TokenPayload } from '../utils/jwt.js';
import {
  UnauthorizedError,
  ForbiddenError,
  AccountSuspendedError,
  EmailNotVerifiedError,
} from '../utils/errors.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        accountStatus: UserAccountStatus;
        emailVerified: boolean;
      };
      tokenPayload?: TokenPayload;
    }
  }
}

/**
 * Authentication middleware - verifies JWT token
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        accountStatus: true,
        emailVerified: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedError('User not found');
    }

    // Check account status
    if (user.accountStatus === 'SUSPENDED') {
      throw new AccountSuspendedError();
    }

    if (user.accountStatus === 'BANNED') {
      throw new ForbiddenError('Account has been banned');
    }

    req.user = user;
    req.tokenPayload = payload;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication - doesn't throw if no token
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        accountStatus: true,
        emailVerified: true,
        deletedAt: true,
      },
    });

    if (user && !user.deletedAt && user.accountStatus === 'ACTIVE') {
      req.user = user;
      req.tokenPayload = payload;
    }

    next();
  } catch {
    // Ignore errors in optional auth
    next();
  }
};

/**
 * Require email verification
 */
export const requireEmailVerified = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    throw new UnauthorizedError();
  }

  if (!req.user.emailVerified) {
    throw new EmailNotVerifiedError();
  }

  next();
};

/**
 * Role-based authorization middleware
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError('You do not have permission to access this resource');
    }

    next();
  };
};

/**
 * Supplier-only middleware
 */
export const supplierOnly = authorize(UserRole.SUPPLIER, UserRole.ADMIN);

/**
 * Shop-only middleware
 */
export const shopOnly = authorize(UserRole.SHOP, UserRole.ADMIN);

/**
 * Admin-only middleware
 */
export const adminOnly = authorize(UserRole.ADMIN);

/**
 * Verified supplier middleware
 */
export const verifiedSupplierOnly = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    if (req.user.role === 'ADMIN') {
      return next();
    }

    if (req.user.role !== 'SUPPLIER') {
      throw new ForbiddenError('Only suppliers can access this resource');
    }

    const supplier = await prisma.supplier.findUnique({
      where: { userId: req.user.id },
      select: { status: true },
    });

    if (!supplier) {
      throw new ForbiddenError('Supplier profile not found');
    }

    if (supplier.status !== 'VERIFIED') {
      throw new ForbiddenError('Your supplier account is not verified yet');
    }

    next();
  } catch (error) {
    next(error);
  }
};
