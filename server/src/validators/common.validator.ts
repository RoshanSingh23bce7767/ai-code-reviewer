import { z } from 'zod';

/** Rejects unexpected query parameters on read-only endpoints. */
export const emptyQuerySchema = z.object({
  query: z.object({}).strict()
});

/** Rejects unexpected body fields on endpoints with no request body. */
export const emptyBodySchema = z.object({
  body: z.object({}).strict()
});
