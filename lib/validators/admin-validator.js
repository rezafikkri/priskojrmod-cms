import { z } from 'zod';
import {
  emailSchema,
  firstNameSchema,
  lastNameSchema,
  pictureSchema,
  whatsappSchema,
} from './base-validator';

export const createAdminSchema = z.object({
  email: emailSchema,
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  whatsappPhoneNumber: whatsappSchema,
  picture: pictureSchema,
});

export const adminIdSchema = z.coerce.number().int();

export const editAdminSchema = createAdminSchema
  .omit({ email: true })
  .extend({
    id: adminIdSchema,
  });
