import { z } from 'zod';
import { emailSchema, firstNameSchema, lastNameSchema, pictureSchema } from './base-validator';

export const createCustomerSchema = z.object({
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  email: emailSchema,
  picture: z.union([
    z.literal(''),
    pictureSchema,
  ]),
});

export const filtersSchema = z.object({
  showBanned: z.enum(['true', 'false']).transform((value) => value === 'true'),
});

export const customerIdSchema = z.string().uuid();

export const editCustomerSchema = createCustomerSchema
  .omit({ email: true })
  .extend({
    id: customerIdSchema,
    email: emailSchema.optional(),
  });

export const updateCustomerBanStatusSchema = z.object({
  id: customerIdSchema,
  isBanned: z.boolean(),
});
