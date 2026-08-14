import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

// Интерфейс для валидированного запроса
interface ValidatedRequest extends Request {
  validatedBody: Record<string, unknown>;
  validatedQuery: Record<string, unknown>;
}

// Middleware для валидации body через zod
export const validateBody = <T extends ZodSchema>(schema: T) => {
  return (req: ValidatedRequest, res: Response, next: NextFunction): void => {
    try {
      const result = schema.parse(req.body);
      req.validatedBody = result as Record<string, unknown>;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: 'Validation error',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
};

// Middleware для валидации query params через zod
export const validateQuery = <T extends ZodSchema>(schema: T) => {
  return (req: ValidatedRequest, res: Response, next: NextFunction): void => {
    try {
      const result = schema.parse(req.query);
      req.validatedQuery = result as Record<string, unknown>;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: 'Query validation error',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
};

// Middleware для валидации params через zod
export const validateParams = <T extends ZodSchema>(schema: T) => {
  return (req: ValidatedRequest, res: Response, next: NextFunction): void => {
    try {
      const result = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: 'Params validation error',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
};
