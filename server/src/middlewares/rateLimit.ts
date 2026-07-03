import rateLimit from 'express-rate-limit';
import { isProduction } from '../config/env';

const rateLimitMessage = {
  success: false,
  message: 'Too many requests. Please try again later.'
};

const loginRateLimitMessage = {
  success: false,
  message: 'Too many authentication attempts. Please try again later.'
};

const reviewRateLimitMessage = {
  success: false,
  message: 'Too many review requests. Please try again later.'
};

/** Global limit for all /api routes (300 requests per 15 minutes in production). */
export const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 300 : 10000,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage
});

/** Broad limit for auth routes (10 requests per 15 minutes in production). */
export const authRouteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 10 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  message: rateLimitMessage
});

/** Strict limit for login and other credential-sensitive auth actions. */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 5 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: loginRateLimitMessage
});

/** General limit for review API routes (60 requests per 15 minutes in production). */
export const reviewApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 60 : 10000,
  standardHeaders: true,
  legacyHeaders: false,
  message: reviewRateLimitMessage
});

/** Stricter limit for AI-backed review creation (10 requests per hour in production). */
export const reviewCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isProduction ? 10 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Review creation rate limit exceeded. Please try again later.'
  }
});

