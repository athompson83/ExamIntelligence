import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

/**
 * Middleware factory for validating request body with Zod schemas
 * Uses safeParse to handle validation errors gracefully
 */
export function validateBody<T extends ZodSchema>(schema: T) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation error',
        details: result.error.flatten().fieldErrors,
      });
    }
    
    // Replace body with validated data
    req.body = result.data;
    next();
  };
}

/**
 * Middleware factory for validating request params with Zod schemas
 */
export function validateParams<T extends ZodSchema>(schema: T) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    
    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid parameters',
        details: result.error.flatten().fieldErrors,
      });
    }
    
    req.params = result.data;
    next();
  };
}

/**
 * Middleware factory for validating request query with Zod schemas
 */
export function validateQuery<T extends ZodSchema>(schema: T) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    
    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: result.error.flatten().fieldErrors,
      });
    }
    
    req.query = result.data;
    next();
  };
}

// Common validation schemas
export const paginationSchema = z.object({
  page: z.string().optional().transform(val => parseInt(val || '1')),
  limit: z.string().optional().transform(val => parseInt(val || '50')),
});

export const idParamSchema = z.object({
  id: z.string().uuid().optional(),
});

export const userIdParamSchema = z.object({
  userId: z.string().optional(),
});