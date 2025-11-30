import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

type ValidateTarget = 'body' | 'query' | 'params';

/**
 * Validation middleware factory
 */
export function validate<T>(schema: ZodSchema<T>, target: ValidateTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const data = req[target];
    const result = schema.safeParse(data);

    if (!result.success) {
      // Pass the Zod error to the error handler
      next(result.error);
      return;
    }

    // Replace the validated data
    req[target] = result.data as typeof req[typeof target];
    next();
  };
}

/**
 * Validate body
 */
export const validateBody = <T>(schema: ZodSchema<T>) => validate(schema, 'body');

/**
 * Validate query parameters
 */
export const validateQuery = <T>(schema: ZodSchema<T>) => validate(schema, 'query');

/**
 * Validate URL parameters
 */
export const validateParams = <T>(schema: ZodSchema<T>) => validate(schema, 'params');
