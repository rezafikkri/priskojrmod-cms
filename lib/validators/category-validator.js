import { z } from 'zod';

export const categoryIdSchema = z.coerce.number().int();

export const categorySchema = z.object({
  id: categoryIdSchema.optional(),
  name: z.string().min(2, {
    message: 'Must contain at least 2 characters.',
  }).max(100, {
    message: 'Must contain at most 100 characters.',
  }),
});
