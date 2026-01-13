import { z } from 'zod';
import {
  emailSchema,
  firstNameSchema,
  lastNameSchema,
  pictureSchema,
  whatsappSchema,
} from './base-validator';
import { CurrencyCode } from '@/constants/enums';

export const donationLinkIdSchema = z.coerce.number().int();

export const donationLinksSchema = z.object({
  dbId: donationLinkIdSchema.optional(),
  currencyCode: z.enum(Object.values(CurrencyCode)),
  url: z.union([z.string().url({
    message: 'Must be a valid URL',
  }), z.string().length(0)]),
});

export const createAdminSchema = z.object({
  email: emailSchema,
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  whatsappPhoneNumber: whatsappSchema,
  picture: pictureSchema,
  donationLinks: z
    .array(donationLinksSchema).length(2),
});

export const adminIdSchema = z.coerce.number().int();

export const editAdminSchema = createAdminSchema
  .omit({ email: true })
  .extend({
    id: adminIdSchema,
  });
