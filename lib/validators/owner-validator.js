import { z } from 'zod';
import {
  firstNameSchema,
  lastNameSchema,
  pictureSchema,
  smProfileUrlSchema,
} from './base-validator';

export const createOwnerSchema = z.object({
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  smProfileUrl: smProfileUrlSchema,
  picture: pictureSchema,
});

export const ownerIdSchema = z.coerce.number().int();

export const editOwnerSchema = createOwnerSchema.extend({
  id: ownerIdSchema,
});
