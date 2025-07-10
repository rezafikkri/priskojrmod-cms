import { z } from 'zod';
import { contentCustomSchema } from './base-validator';

export const createLicenseSchema = z.object({
  name: z.object({
    id: z.string().min(4, {
      message: 'Must contain at least 4 characters.',
    }).max(100, {
      message: 'Must contain at most 150 characters.',
    }),
    en: z.string().min(4, {
      message: 'Must contain at least 4 characters.',
    }).max(100, {
      message: 'Must contain at most 150 characters.',
    }),
  }),
  content: z.object({
    id: contentCustomSchema,
    en: contentCustomSchema,
  }),
});

export const licenseIdSchema = z.coerce.number().int();

export const editLicenseSchema = createLicenseSchema.extend({
  id: licenseIdSchema,
  translationId: z.object({
    id: z.number().int(),
    en: z.number().int(),
  }),
});
