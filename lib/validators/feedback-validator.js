import { z } from 'zod';

export const filtersSchema = z.object({
  readStatus: z.enum(['read', 'unread'])
    .transform((value) => value === 'read')
    .optional(),
}).optional();

export const feedbackIdSchema = z.string().uuid();

export const feedbackIdsSchema = z.array(feedbackIdSchema).min(1);

export const updateFeedbackReadStatusSchema = z.object({
  id: feedbackIdSchema,
  isRead: z.boolean(),
});
