import { z } from 'zod';
import {
  currencyCodeSchema,
  firstNameSchema,
  lastNameSchema,
  pictureSchema,
  smProfileUrlSchema,
} from './base-validator';

export const donationLinkIdSchema = z.coerce.number().int();

export const donationLinksSchema = z.object({
  dbId: donationLinkIdSchema.optional(),
  currencyCode: currencyCodeSchema,
  url: z.union([
    z.literal(''),
    z.string().url({
      message: 'Must be a valid URL',
    }),
  ]),
}).superRefine((data, ctx) => {
  if (data.dbId && !data.url) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'This donation link\'s URL can\'t be left empty because it\'s already saved.',
      path: ['url'],
    });
  }
  console.dir(data);
});

export const createOwnerSchema = z.object({
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  smProfileUrl: smProfileUrlSchema,
  picture: pictureSchema,
  donationLinks: z.array(donationLinksSchema).length(2),
});

export const ownerIdSchema = z.coerce.number().int();

export const editOwnerSchema = createOwnerSchema.extend({
  id: ownerIdSchema,
});
