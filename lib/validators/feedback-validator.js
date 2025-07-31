import { z } from 'zod';

export const filtersSchema = z.object({
  is_read: z.boolean().optional(),
}).optional();
