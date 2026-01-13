import { z } from 'zod';
import {
  firstNameSchema,
  lastNameSchema,
  pictureSchema,
  smProfileURLSchema,
} from './base-validator';

export const createOwnerSchema = z.object({
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  smProfileUrl: smProfileURLSchema,
  picture: pictureSchema,
});

export const ownerIdSchema = z.coerce.number().int();

export const editOwnerSchema = createOwnerSchema.extend({
  id: ownerIdSchema,
});
