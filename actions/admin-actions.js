'use server';

import { createAdmin, updateAdmin } from '@/lib/services/admin-service';

export async function addAdmin(data) {
  try {
    await createAdmin(data);
    return { status: 'success' };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}

export async function editAdmin(data) {
  try {
    const updatedData = await updateAdmin(data);
    return { status: 'success', data: updatedData };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}
