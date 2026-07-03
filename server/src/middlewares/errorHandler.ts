import { Request, Response, NextFunction } from 'express';
import AppError from '../utils/AppError';
import logger from '../config/logger';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let errorCode = 'SERVER_001';
  let message = 'Internal Server Error';
  let errors: any[] = [];

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.errorCode;
    message = err.message;
    errors = err.errors;
  } else {
    logger.error('Unhandled Server Error: ', err);
    message = 'An unexpected error occurred';
  }

  if (statusCode >= 500) {
    message = 'An unexpected error occurred';
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorCode,
    errors,
    requestId: (req as Request & { requestId?: string }).requestId,
    timestamp: new Date().toISOString()
  });
};

export default errorHandler;
