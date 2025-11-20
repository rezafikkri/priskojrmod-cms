'use server';

import {
  createAdmin,
  updateAdmin,
  deleteAdmin,
  deleteDonationLink,
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
    const updatedData = await updateAdmin(data);
    return { status: 'success', data: updatedData };
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

export async function removeDonationLink(id) {
  try {
    await deleteDonationLink(id);
    return { status: 'success' };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}
