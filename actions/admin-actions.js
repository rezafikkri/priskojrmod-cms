'use server';

import {
  createAdmin,
  updateAdmin,
  deleteAdmin,
} from '@/lib/services/admin-service';

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
    await updateAdmin(data);
    return { status: 'success' };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}

export async function removeAdmin(id) {
  try {
    await deleteAdmin(id);
    return { status: 'success' };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}
