import { z } from 'zod';

const passwordSchema = z
  .string({ required_error: 'Password is required' })
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[a-z]/, 'Password must include a lowercase letter')
  .regex(/[A-Z]/, 'Password must include an uppercase letter')
  .regex(/[0-9]/, 'Password must include a number')
  .regex(/[^A-Za-z0-9]/, 'Password must include a symbol');

const tokenSchema = z
  .string({ required_error: 'Token is required' })
  .min(32, 'Token is invalid')
  .max(256, 'Token is invalid')
  .regex(/^[a-f0-9]+$/i, 'Token is invalid');

export const registerSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }).min(2, 'Name must be at least 2 characters').max(80).trim(),
    email: z.string({ required_error: 'Email is required' }).email('Invalid email address').trim().toLowerCase(),
    password: passwordSchema
  }).strict()
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required' }).email('Invalid email address').trim().toLowerCase(),
    password: z.string({ required_error: 'Password is required' }).min(1, 'Password cannot be empty')
  }).strict()
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: tokenSchema.optional()
  }).strict().default({})
});

export const verifyEmailSchema = z.object({
  body: z.object({
    token: tokenSchema
  }).strict()
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required' }).email('Invalid email address').trim().toLowerCase()
  }).strict()
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: tokenSchema,
    password: passwordSchema
  }).strict()
});
