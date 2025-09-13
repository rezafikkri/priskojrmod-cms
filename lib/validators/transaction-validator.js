import { TransactionStatus } from '@/constants/enums';
import { z } from 'zod';

export const filtersSchema = z.object({
  status: z.enum([Object.values(TransactionStatus)]).optional(),
}).optional();
