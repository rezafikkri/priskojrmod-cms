import { z } from 'zod';
import { contentCustomSchema } from './base-validator';

export const createFaqSchema = z.object({
  title: z.object({
    id: z.string().min(4, {
      message: 'Must contain at least 4 characters.',
    }).max(150, {
      message: 'Must contain at most 150 characters.',
    }),
    en: z.string().min(4, {
      message: 'Must contain at least 4 characters.',
    }).max(150, {
      message: 'Must contain at most 150 characters.',
    }),
  }),
  content: z.object({
    id: contentCustomSchema,
    en: contentCustomSchema,
  }),
});

export const faqIdSchema = z.coerce.number().int();

export const editFaqSchema = createFaqSchema.extend({
  id: faqIdSchema,
  translationId: z.object({
    id: z.number().int(),
    en: z.number().int(),
  }),
});
