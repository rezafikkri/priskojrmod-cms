import { z } from 'zod';

export const filtersSchema = z.object({
  isRead: z.boolean().optional(),
}).optional();

export const feedbackIdSchema = z.string().uuid();

export const feedbackIdsSchema = z.array(feedbackIdSchema).min(1);

export const updateFeedbackReadStatusSchema = z.object({
  id: feedbackIdSchema,
  isRead: z.boolean(),
});
