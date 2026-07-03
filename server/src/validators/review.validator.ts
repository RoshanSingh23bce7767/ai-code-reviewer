import { z } from 'zod';

export const supportedLanguages = [
  'JavaScript',
  'TypeScript',
  'Python',
  'Java',
  'C',
  'C++',
  'C#',
  'Go',
  'Rust',
  'PHP',
  'Ruby',
  'Swift',
  'Kotlin',
  'Scala',
  'SQL',
  'Shell'
] as const;

const objectIdSchema = z
  .string({ required_error: 'Review ID is required' })
  .regex(/^[0-9a-fA-F]{24}$/, 'Review ID must be a valid ObjectId');

export const createReviewSchema = z.object({
  body: z.object({
    language: z.string({ required_error: 'Language is required' }).refine(
      (val) => supportedLanguages.includes(val as (typeof supportedLanguages)[number]),
      { message: `Language must be one of: ${supportedLanguages.join(', ')}` }
    ),
    sourceCode: z
      .string({ required_error: 'Source code is required' })
      .min(1, 'Source code cannot be empty')
      .max(750_000, 'Source code exceeds the configured review limit')
  }).strict()
});

export const reviewIdParamSchema = z.object({
  params: z.object({
    reviewId: objectIdSchema
  }).strict()
});

export const updateReviewTitleSchema = z.object({
  params: z.object({
    reviewId: objectIdSchema
  }).strict(),
  body: z.object({
    title: z.string({ required_error: 'Title is required' }).min(1, 'Title cannot be empty').max(120).trim()
  }).strict()
});

export const listReviewsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    language: z.enum(supportedLanguages).optional(),
    sort: z.enum(['createdAt', 'lastViewed', 'title', 'language']).default('createdAt'),
    order: z.enum(['asc', 'desc']).default('desc'),
    q: z.string().trim().max(100).optional()
  }).strict()
});
