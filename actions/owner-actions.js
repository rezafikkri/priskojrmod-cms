'use server';

import { createOwner, deleteOwner, updateOwner } from '@/lib/services/owner-service';

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
    await updateOwner(data);
    return { status: 'success' };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}
