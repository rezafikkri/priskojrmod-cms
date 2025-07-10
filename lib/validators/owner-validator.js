import { z } from 'zod';

export const createOwnerSchema = z.object({
  first_name: z.string().min(4, {
    message: 'Must contain at least 4 characters.',
  }).max(100, {
    message: 'Must contain at most 100 characters.',
  }),
  last_name: z.string().min(2, {
    message: 'Must contain at least 2 characters.',
  }).max(100, {
    message: 'Must contain at most 100 characters.',
  }),
  sm_username: z.string().min(2, {
    message: 'Must contain at least 2 characters.',
  }).max(100, {
    message: 'Must contain at most 100 characters.',
  }),
  picture: z.string().url({
    message: 'Must be a valid URL.',
  }),
});

export const ownerIdSchema = z.coerce.number().int();

export const editOwnerSchema = createOwnerSchema.extend({
  id: ownerIdSchema,
});
