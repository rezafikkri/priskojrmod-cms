import { z } from 'zod';
import { contentCustomSchema } from './base-validator';

export const createTestimonialSchema = z.object({
  name: z
    .string()
    .min(4, { message: 'Must contain at least 4 characters.' })
    .max(100, { message: 'Must contain at most 100 characters.' }),
  sm_username: z
    .string()
    .min(2, { message: 'Must contain at least 2 characters.' })
    .max(100, { message: 'Must contain at most 100 characters.' }),
  picture: z.string().url({ message: 'Must be a valid URL.' }),
  message: z.object({
    id: contentCustomSchema,
    en: contentCustomSchema,
  }),
});

export const testimonialIdSchema = z.coerce.number().int();

export const editTestimonialSchema = createTestimonialSchema.extend({
  id: testimonialIdSchema,
  translationId: z.object({
    id: z.number().int(),
    en: z.number().int(),
  }),
});
