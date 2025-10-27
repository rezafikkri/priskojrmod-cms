import { TransactionStatus } from '@/constants/enums';
import { z } from 'zod';

export const transactionIdSchema = z.string().uuid();
export const transactionStatusSchema = z.enum(Object.values(TransactionStatus));

export const filtersSchema = z.object({
  status: transactionStatusSchema.optional(),
}).optional();
