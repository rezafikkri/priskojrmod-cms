import { z } from 'zod';
import { firstNameSchema, lastNameSchema, pictureSchema } from './base-validator';

export const createOwnerSchema = z.object({
  first_name: firstNameSchema,
  last_name: lastNameSchema,
  sm_username: z
    .string()
    .min(2, { message: 'Must contain at least 2 characters.' })
    .max(100, { message: 'Must contain at most 100 characters.' }),
  picture: pictureSchema,
});

export const ownerIdSchema = z.coerce.number().int();

export const editOwnerSchema = createOwnerSchema.extend({
  id: ownerIdSchema,
});
