import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { isProduction } from '../config/env';

const isCsrfEnabled = (): boolean => {
  return process.env.NODE_ENV === 'production' || process.env.CSRF_ENABLED === 'true';
};

interface CsrfRequest extends Request {
  csrfToken?: string;
}

const TOKEN_NAME = 'x-csrf-token';

const hashToken = (value: string): Buffer => {
  return crypto.createHash('sha256').update(value).digest();
};

const tokensMatch = (expected: string, provided: string): boolean => {
  const expectedHash = hashToken(expected);
  const providedHash = hashToken(provided);

  if (expectedHash.length !== providedHash.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedHash, providedHash);
};

/** Double-submit cookie CSRF protection for cookie-authenticated requests. */
export const csrfProtection = (req: CsrfRequest, res: Response, next: NextFunction): void => {
  if (!isCsrfEnabled()) {
    return next();
  }

  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const tokenFromHeader = req.get(TOKEN_NAME);
  const tokenFromBody = req.body?.csrfToken;
  const tokenFromQuery = req.query?.csrfToken;

  const providedToken = tokenFromHeader || tokenFromBody || tokenFromQuery;
  const expectedToken = req.cookies?.csrfToken;

  if (!expectedToken || !providedToken || !tokensMatch(expectedToken, String(providedToken))) {
    res.status(403).json({
      success: false,
      message: 'CSRF token validation failed',
      errorCode: 'CSRF_001'
    });
    return;
  }

  next();
};

export const setCsrfToken = (req: CsrfRequest, res: Response, next: NextFunction): void => {
  if (!isCsrfEnabled()) {
    return next();
  }

  const token = req.cookies?.csrfToken || crypto.randomBytes(32).toString('hex');
  res.cookie('csrfToken', token, {
    httpOnly: false,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/'
  });
  res.setHeader('X-CSRF-Token', token);

  req.csrfToken = token;
  req.cookies = {
    ...(req.cookies || {}),
    csrfToken: token
  };
  next();
};
