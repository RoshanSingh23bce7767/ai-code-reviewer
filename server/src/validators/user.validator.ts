import { z } from 'zod';

const objectIdSchema = z
  .string({ required_error: 'Notification ID is required' })
  .regex(/^[0-9a-fA-F]{24}$/, 'Notification ID must be a valid ObjectId');

export const updateProfileSchema = z.object({
  body: z
    .object({
      name: z.string().min(2, 'Name must be at least 2 characters').max(80).trim().optional(),
      avatar: z.string().url('Avatar must be a valid URL').max(2048).or(z.literal('')).optional()
    })
    .strict()
    .refine((data) => data.name !== undefined || data.avatar !== undefined, {
      message: 'At least one profile field is required'
    })
});

export const notificationIdParamSchema = z.object({
  params: z.object({
    notificationId: objectIdSchema
  }).strict()
});

export const listNotificationsSchema = z.object({
  query: z.object({}).strict()
});

export const deleteAccountSchema = z.object({
  body: z.object({}).strict()
});
