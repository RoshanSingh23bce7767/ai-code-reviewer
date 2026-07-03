import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { AuthenticatedRequest, TokenPayload } from '../types';
import AppError from '../utils/AppError';
import { getJwtSecret } from '../config/env';

const isTokenPayload = (decoded: unknown): decoded is TokenPayload => {
  if (!decoded || typeof decoded !== 'object') {
    return false;
  }

  const payload = decoded as TokenPayload;
  return (
    typeof payload.userId === 'string' &&
    Types.ObjectId.isValid(payload.userId) &&
    typeof payload.email === 'string' &&
    (payload.role === 'user' || payload.role === 'admin')
  );
};

export const protect = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.slice(7).trim();
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next(new AppError('Unauthorized: Token is missing.', 401, 'AUTH_002'));
    }

    jwt.verify(
      token,
      getJwtSecret(),
      {
        algorithms: ['HS256'],
        issuer: 'ai-code-review-platform'
      },
      (err, decoded) => {
        if (err) {
          if (err.name === 'TokenExpiredError') {
            return next(new AppError('Unauthorized: Token has expired.', 401, 'AUTH_003'));
          }
          return next(new AppError('Unauthorized: Invalid token.', 401, 'AUTH_002'));
        }

        if (!isTokenPayload(decoded)) {
          return next(new AppError('Unauthorized: Invalid token payload.', 401, 'AUTH_002'));
        }

        req.user = decoded;
        next();
      }
    );
  } catch (error) {
    next(error);
  }
};

export const restrictTo = (...roles: ('user' | 'admin')[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError('Forbidden: You do not have permission.', 403, 'AUTH_002')
      );
    }
    next();
  };
};
