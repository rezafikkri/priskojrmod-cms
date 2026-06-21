import { TransactionStatus } from '@/constants/enums';
import { z } from 'zod';
import { searchKeySchema } from './base-validator';

export const transactionIdSchema = z.string().uuid();
export const transactionStatusSchema = z.enum(Object.values(TransactionStatus));

export const filtersSchema = z.object({
  status: transactionStatusSchema.optional(),
  searchKey: searchKeySchema.optional(),
}).optional();

export const refundNoteSchema = z.string().min(1, { message: 'Can\'t be empty' });
