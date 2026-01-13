import { z } from 'zod';
import parsePhoneNumber from 'libphonenumber-js';

export const contentCustomSchema = z.intersection(
  z.string().min(1, { message: 'Can\'t be empty' }),
  z.custom((val) => {
    if (!/<p>(&nbsp;)*\s*<\/p>/.test(val)) return true;
    return false
  }, {
    message: 'Can\'t be empty',
  }),
);

export const searchKeySchema = z.string().trim().min(1).max(100);

export const passwordSchema = z.string()
  .min(12, { message: 'Must contain at least 12 characters' })
  .max(100, { message: 'Must contain at most 100 characters' })
  .regex(
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()\-_+=?])[A-Za-z\d!@#$%^&*()\-_+=?]{12,}$/,
    { message: 'Must be at least 12 characters long and include an uppercase letter, a lowercase letter, a number, and a symbol.' },
  );

export const emailSchema = z.string()
  .min(1, { message: 'Can\'t be empty' })
  .max(254, { message: 'Must contain at most 254 characters' })
  .email({ message: 'Please enter a valid format' });

export const firstNameSchema = z.string()
  .min(2, { message: 'Must contain at least 2 characters' })
  .max(100, { message: 'Must contain at most 100 characters' });

export const lastNameSchema = z.string()
  .min(2, { message: 'Must contain at least 2 characters' })
  .max(100, { message: 'Must contain at most 100 characters' })

export const pictureSchema = z.string()
  .url({ message: 'Must be a valid URL' })
  .max(255, { message: 'Must contain at most 255 characters' })

const supportedSocialDomains = [
  'x.com',
  'instagram.com',
  'youtube.com',
  'facebook.com',
  'linkedin.com',
  'github.com',
];

export const smProfileURLSchema = z.string()
  .url({ message: 'Must be a valid URL' })
  .max(255, { message: 'Must contain at most 100 characters' })
  .refine((data) => {
    try {
      const url = new URL(data);
      const hostname = url.hostname;

      for (const socialDomain of supportedSocialDomains) {
        if (hostname.endsWith(socialDomain)) return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  }, {
    message: 'Social media URL is not supported. Please use one of the following: x.com, instagram.com, youtube.com, facebook.com, linkedin.com, github.com.',
  });

export const whatsappSchema = z.object({
    countryIso: z
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
    const { countryIso, number } = data;

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
        path: ['countryIso'],
      });
    }
  });
