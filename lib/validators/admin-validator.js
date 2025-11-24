import { z } from 'zod';
import {
  emailSchema,
  firstNameSchema,
  lastNameSchema,
  pictureSchema,
} from './base-validator';
import parsePhoneNumber from 'libphonenumber-js';
import { CurrencyCode } from '@/constants/enums';

export const donationLinkIdSchema = z.coerce.number().int();

export const donationLinksSchema = z.object({
  dbId: donationLinkIdSchema.optional(),
  currency_code: z.enum(Object.values(CurrencyCode)),
  link: z.union([z.string().url({
    message: 'Must be a valid URL.',
  }), z.string().length(0)]),
});

export const createAdminSchema = z.object({
  email: emailSchema,
  first_name: firstNameSchema,
  last_name: lastNameSchema,
  whatsapp_phone_number: z.object({
    country_iso: z
      .union([
        z.string().length(2, { message: 'Please select an option' }),
        z.literal('OTHER', { message: 'Please select an option' })
      ]),
    number: z
      .string()
      .min(7, { message: 'Must contain at least 7 digits' })
      .regex(/^[\d\s\-\+\(\)\.]+$/, { message: 'Must contain only numbers and characters (+, -, space, (), .)' }),
  })
  .superRefine((data, ctx) => {
    const { country_iso: countryIso, number } = data;

    const parsedNumber = parsePhoneNumber(
      number,
      countryIso === 'OTHER' ? undefined : countryIso,
      { extract: false },
    );

    if (!parsedNumber?.isValid()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please enter a valid format',
        path: ['number'],
      });     
    } else if (countryIso !== 'OTHER' && parsedNumber.country !== countryIso) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selected country does not match the number',
        path: ['country_iso'],
      });
    }
  }),
  picture: pictureSchema,
  donation_links: z
    .array(donationLinksSchema).length(2),
});

export const adminIdSchema = z.coerce.number().int();

export const editAdminSchema = createAdminSchema
  .omit({ email: true })
  .extend({
    id: adminIdSchema,
  });
