import { z } from 'zod';

export const secretKeyKeySchema = z.string().min(64, {
    message: 'Must contain at least 64 characters',
  }).max(100, {
    message: 'Must contain at most 100 characters'
  });

export const createSecretKeySchema = z.object({
  product_id: z.string().uuid({
    message: 'Please select an option',
  }),
  key: secretKeyKeySchema,
});

export const secretKeyIdSchema = z.coerce.number().int();

export const regenerateSecretKeySchema = z.object({
  id: secretKeyIdSchema,
  key: secretKeyKeySchema,
});
