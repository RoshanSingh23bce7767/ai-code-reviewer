import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import AppError from '../utils/AppError';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });

      const parsedRequest = parsed as {
        body?: unknown;
        query?: unknown;
        params?: unknown;
      };

      if (parsedRequest.body !== undefined) {
        req.body = parsedRequest.body;
      }
      if (parsedRequest.query !== undefined) {
        (req as any).query = parsedRequest.query;
      }
      if (parsedRequest.params !== undefined) {
        req.params = parsedRequest.params as Record<string, string>;
      }

      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map((err) => ({
          field: err.path.join('.').replace('body.', '').replace('query.', '').replace('params.', ''),
          message: err.message
        }));

        return next(
          new AppError('Validation failed', 400, 'VALIDATION_001', validationErrors)
        );
      }
      return next(error);
    }
  };
};

export default validate;
