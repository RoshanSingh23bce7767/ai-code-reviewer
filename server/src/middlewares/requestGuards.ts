import { Request, Response, NextFunction } from 'express';
import AppError from '../utils/AppError';

const hasUnsafeKey = (value: unknown, seen = new WeakSet<object>()): boolean => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  if (seen.has(value)) {
    return false;
  }
  seen.add(value);

  if (Array.isArray(value)) {
    return value.some((item) => hasUnsafeKey(item, seen));
  }

  return Object.entries(value as Record<string, unknown>).some(([key, nestedValue]) => {
    return key.startsWith('$') || key.includes('.') || hasUnsafeKey(nestedValue, seen);
  });
};

export const rejectUnsafeRequestKeys = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (hasUnsafeKey(req.body) || hasUnsafeKey(req.query) || hasUnsafeKey(req.params)) {
    return next(new AppError('Request contains unsafe object keys.', 400, 'VALIDATION_001'));
  }

  next();
};
