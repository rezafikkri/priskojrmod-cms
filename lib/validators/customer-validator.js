import { z } from 'zod';
import { emailSchema, firstNameSchema, lastNameSchema, pictureSchema } from './base-validator';

export const createCustomerSchema = z.object({
  first_name: firstNameSchema,
  last_name: lastNameSchema,
  email: emailSchema,
  picture: z.union([
    z.literal(''),
    pictureSchema,
  ]),
});

export const filtersSchema = z.object({
  is_banned: z.boolean(),
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
  is_banned: z.boolean(),
});
