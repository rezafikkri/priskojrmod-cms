import { z } from 'zod';

export const createCustomerSchema = z.object({
  first_name: z.string()
    .min(4, { message: 'Must contain at least 4 characters.' })
    .max(100, { message: 'Must contain at most 100 characters.' }),
  last_name: z.string()
    .min(2, { message: 'Must contain at least 2 characters.' })
    .max(100, { message: 'Must contain at most 100 characters.' }),
  email: z.string()
    .min(1, { message: 'Can\'t be empty.' })
    .max(100, { message: 'Must contain at most 100 characters.' })
    .email({ message: 'Please enter a valid format.' }),
  picture: z.union([
    z.literal(''),
    z.string()
      .url({ message: 'Must be a valid URL.' })
      .max(255, { message: 'Must contain at most 255 characters.' }),
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
    email: z.string()
      .min(1, { message: 'Can\'t be empty.' })
      .max(100, { message: 'Must contain at most 100 characters.' })
      .email({ message: 'Please enter a valid format.' })
      .optional(),
  });
