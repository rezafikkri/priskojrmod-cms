'use server';

import { createSecretKey, deleteSecretKey, saveRegeneratedSecretKey } from '@/lib/services/secret-key-service';

export async function addSecretKey(data) {
  try {
    await createSecretKey(data);
    return { status: 'success' };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}

export async function removeSecretKey(id) {
  try {
    await deleteSecretKey(id);
    return { status: 'success' };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}

export async function applyRegeneratedSecretKey(data) {
  try {
    const savedData = await saveRegeneratedSecretKey(data);
    return { status: 'success', data: savedData };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}
