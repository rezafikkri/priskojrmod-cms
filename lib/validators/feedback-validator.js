import { z } from 'zod';

export const filtersSchema = z.object({
  is_read: z.boolean().optional(),
}).optional();

export const feedbackIdSchema = z.string().uuid();

export const feedbackIdsSchema = z.array(feedbackIdSchema).min(1);
