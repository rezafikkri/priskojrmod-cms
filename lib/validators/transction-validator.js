import { z } from 'zod';

export const transactionIdSchema = z.string().uuid();
