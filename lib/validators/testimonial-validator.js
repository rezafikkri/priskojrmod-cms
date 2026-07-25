import { z } from 'zod';
import {
  contentCustomSchema,
  pictureSchema,
  smProfileUrlSchema,
} from './base-validator';

export const createTestimonialSchema = z.object({
  name: z
    .string().trim()
    .min(4, { message: 'Must contain at least 4 characters' })
    .max(100, { message: 'Must contain at most 100 characters' }),
  smProfileUrl: smProfileUrlSchema,
  picture: pictureSchema,
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
