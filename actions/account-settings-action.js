'use server';

import { deleteDonationLink, updateAccount } from '@/lib/services/account-settings-service';

export async function editAccount(data) {
  try {
    const updatedData = await updateAccount(data);
    return { status: 'success', data: updatedData };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}

export async function removeDonationLink(id) {
  try {
    await deleteDonationLink(id);
    return { status: 'success' };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}
