import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

export const isProduction = process.env.NODE_ENV === 'production';

const requiredInProduction = ['JWT_SECRET', 'MONGODB_URI'] as const;
const weakJwtSecrets = new Set([
  'changeme',
  'change-me',
  'secret',
  'jwt-secret',
  'replace-with-a-long-random-secret',
  'your-secret',
  'password'
]);

let generatedDevelopmentJwtSecret: string | undefined;

export const validateStartupConfig = (): void => {
  if (!isProduction) {
    return;
  }

  const missing = requiredInProduction.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables in production: ${missing.join(', ')}`);
  }

  const jwtSecret = process.env.JWT_SECRET?.trim() || '';
  if (jwtSecret.length < 32 || weakJwtSecrets.has(jwtSecret.toLowerCase())) {
    throw new Error('JWT_SECRET must be a strong production secret of at least 32 characters');
  }

  if (getAllowedOrigins().includes('*')) {
    throw new Error('CORS_ORIGIN cannot include "*" in production');
  }

  if (!process.env.PORT) {
    process.env.PORT = '5000';
  }
};

export const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET?.trim();
  if (secret) {
    return secret;
  }

  if (isProduction) {
    throw new Error('JWT_SECRET environment variable is required in production');
  }

  if (!generatedDevelopmentJwtSecret) {
    generatedDevelopmentJwtSecret = crypto.randomBytes(32).toString('hex');
  }

  return generatedDevelopmentJwtSecret;
};

export const getAllowedOrigins = (): string[] => {
  const configured = process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173';
  return configured
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

export const getRequestBodyLimit = (): string => process.env.REQUEST_BODY_LIMIT || '1mb';

export const getClientUrl = (): string =>
  process.env.CLIENT_URL?.trim() || 'http://localhost:5173';

export const getCookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
  maxAge,
  path: '/' as const
});

export const getCookieClearOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
  path: '/' as const
});

validateStartupConfig();
