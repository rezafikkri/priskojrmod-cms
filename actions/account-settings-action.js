'use server';

import { updateAccount } from '@/lib/services/account-settings-service';

export async function editAccount(data) {
  try {
    const updatedData = await updateAccount(data);
    return { status: 'success', data: updatedData };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}
