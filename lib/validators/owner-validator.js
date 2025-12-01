import { z } from 'zod';
import {
  firstNameSchema,
  lastNameSchema,
  pictureSchema,
  smProfileURLSchema,
} from './base-validator';

export const createOwnerSchema = z.object({
  first_name: firstNameSchema,
  last_name: lastNameSchema,
  sm_profile_url: smProfileURLSchema,
  picture: pictureSchema,
});

export const ownerIdSchema = z.coerce.number().int();

export const editOwnerSchema = createOwnerSchema.extend({
  id: ownerIdSchema,
});
