'use server';

import { updateTransactionStatus } from "@/lib/services/transaction-service";

export async function editTransactionStatus(data) {
  try {
    const { message, ...rest } = await updateTransactionStatus(data);
    return { status: 'success', data: rest, message };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}
