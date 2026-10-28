'use server';

import {
  deleteDonationLink,
  createOwner,
  deleteOwner,
  updateOwner,
} from '@/lib/services/owner-service';

export async function addOwner(data) {
  try {
    await createOwner(data);
    return { status: 'success' };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}

export async function removeOwner(id) {
  try {
    await deleteOwner(id);
    return { status: 'success' };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}

export async function editOwner(data) {
  try {
    const updatedData = await updateOwner(data);
    return { status: 'success', data: updatedData };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}

export async function removeDonationLink(id, adminId) {
  try {
    await deleteDonationLink(id, adminId);
    return { status: 'success' };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}
