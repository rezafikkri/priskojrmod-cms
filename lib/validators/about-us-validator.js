import { z } from 'zod';
import { contentCustomSchema, emailSchema, whatsappSchema } from './base-validator';

const officeHoursSchema = z
  .string().trim()
  .min(3, { message: 'Must contain at least 3 characters' })
  .max(255, { message: 'Must contain at most 255 characters' });

export const aboutUsSchema = z.object({
  id: z.number().int().optional(),
  supportEmail: emailSchema,
  supportWhatsapp: whatsappSchema,
  translationId: z.object({
    id: z.number().int(),
    en: z.number().int(),
  }).optional(),
  content: z.object({
    id: contentCustomSchema,
    en: contentCustomSchema,
  }),
  officeHours: z.object({
    id: officeHoursSchema,
    en: officeHoursSchema,
  }),
});
