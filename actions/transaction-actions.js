'use server';

import {
    correctTransactionStatus,
  generateConfirmationMessage,
  updateTransactionStatus,
} from '@/lib/services/transaction-service';

export async function editTransactionStatus(data) {
  try {
    const { message, ...rest } = await updateTransactionStatus(data);
    return { status: 'success', data: rest, message };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}

export async function prepareConfirmationMessage(id) {
  try {
    const message = await generateConfirmationMessage(id);
    return { status: 'success', data: { message } };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}

export async function fixTransactionStatus(data) {
  try {
    const { message, ...rest } = await correctTransactionStatus(data);
    return { status: 'success', data: rest, message };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}
