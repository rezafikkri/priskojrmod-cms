'use server';

import { createLicenseKey, deleteLicenseKey, setCanRegenerateLicenseKeys, updateLicenseKey } from '@/lib/services/license-key-service';

export async function addLicenseKey(data) {
  try {
    await createLicenseKey(data);
    return { status: 'success' };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}

export async function removeLicenseKey(id) {
  try {
    await deleteLicenseKey(id);
    return { status: 'success' };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}

export async function editLicenseKey(data) {
  try {
    const updatedData = await updateLicenseKey(data);
    return { status: 'success', data: updatedData };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}

export async function setCanRegenerateKeys(ids) {
  try {
    const updateResult = await setCanRegenerateLicenseKeys(ids);
    return { status: 'success', data: updateResult };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}
