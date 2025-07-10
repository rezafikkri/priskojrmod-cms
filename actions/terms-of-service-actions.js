'use server';

import { createTermsOfService, updateTermsOfService } from '@/lib/services/terms-of-service-service';

export async function addTermsOfService(data) {
  try {
    const createdData = await createTermsOfService(data);
    return { status: 'success', data: createdData };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}

export async function editTermsOfService(data) {
  try {
    const updatedData = await updateTermsOfService(data);
    return { status: 'success', data: updatedData };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}
