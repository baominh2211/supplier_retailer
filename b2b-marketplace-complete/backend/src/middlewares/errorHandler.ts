import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';
import { AppError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    errors?: Record<string, string[]>;
    stack?: string;
  };
}

/**
 * Format Zod validation errors
 */
function formatZodErrors(error: ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  for (const issue of error.errors) {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(issue.message);
  }

  return errors;
}

/**
 * Handle Prisma errors
 */
function handlePrismaError(error: PrismaClientKnownRequestError): AppError {
  switch (error.code) {
    case 'P2002': {
      // Unique constraint violation
      const field = (error.meta?.target as string[])?.join(', ') || 'field';
      return new AppError(`A record with this ${field} already exists`, 409, true, 'DUPLICATE_ENTRY');
    }
    case 'P2003': {
      // Foreign key constraint violation
      return new AppError('Referenced record not found', 400, true, 'FOREIGN_KEY_VIOLATION');
    }
    case 'P2025': {
      // Record not found
      return new AppError('Record not found', 404, true, 'NOT_FOUND');
    }
    case 'P2014': {
      // Required relation not found
      return new AppError('Required relation violation', 400, true, 'RELATION_VIOLATION');
    }
    default:
      return new AppError('Database error', 500, false, 'DATABASE_ERROR');
  }
}

/**
 * Global error handler middleware
 */
export const errorHandler: ErrorRequestHandler = (
  error: Error,
  req: Request,
  res: Response<ErrorResponse>,
  _next: NextFunction
): void => {
  // Log error
  const logContext = {
    method: req.method,
    path: req.path,
    userId: req.user?.id,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  };

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const formattedErrors = formatZodErrors(error);
    logger.warn({ ...logContext, errors: formattedErrors }, 'Validation error');

    res.status(422).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors: formattedErrors,
      },
    });
    return;
  }

  // Handle custom validation errors
  if (error instanceof ValidationError) {
    logger.warn({ ...logContext, errors: error.errors }, 'Validation error');

    res.status(422).json({
      success: false,
      error: {
        message: error.message,
        code: error.code,
        errors: error.errors,
      },
    });
    return;
  }

  // Handle Prisma errors
  if (error instanceof PrismaClientKnownRequestError) {
    const appError = handlePrismaError(error);
    logger.warn({ ...logContext, prismaCode: error.code }, appError.message);

    res.status(appError.statusCode).json({
      success: false,
      error: {
        message: appError.message,
        code: appError.code,
      },
    });
    return;
  }

  if (error instanceof PrismaClientValidationError) {
    logger.warn({ ...logContext }, 'Prisma validation error');

    res.status(400).json({
      success: false,
      error: {
        message: 'Invalid data provided',
        code: 'PRISMA_VALIDATION_ERROR',
      },
    });
    return;
  }

  // Handle operational errors (expected errors)
  if (error instanceof AppError) {
    if (error.isOperational) {
      logger.warn({ ...logContext, code: error.code }, error.message);
    } else {
      logger.error({ ...logContext, error }, 'Non-operational error');
    }

    res.status(error.statusCode).json({
      success: false,
      error: {
        message: error.message,
        code: error.code,
        ...(config.isDev && { stack: error.stack }),
      },
    });
    return;
  }

  // Handle unexpected errors
  logger.error({ ...logContext, error }, 'Unexpected error');

  res.status(500).json({
    success: false,
    error: {
      message: config.isProd ? 'Internal server error' : error.message,
      code: 'INTERNAL_ERROR',
      ...(config.isDev && { stack: error.stack }),
    },
  });
};

/**
 * Not found handler
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: {
      message: `Cannot ${req.method} ${req.path}`,
      code: 'NOT_FOUND',
    },
  });
};

/**
 * Async handler wrapper to catch errors
 */
export const asyncHandler = <T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
