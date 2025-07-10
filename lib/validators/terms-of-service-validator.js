import { z } from 'zod';
import { contentCustomSchema } from './base-validator';

export const termsOfServiceSchema = z.object({
  id: z.number().int().optional(),
  translationId: z.object({
    id: z.number().int(),
    en: z.number().int(),
  }).optional(),
  content: z.object({
    id: contentCustomSchema,
    en: contentCustomSchema,
  }),
});
