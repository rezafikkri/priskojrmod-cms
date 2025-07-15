'use server';

import { createCustomer, updateCustomer } from '@/lib/services/customer-service';

export async function addCustomer(data) {
  try {
    await createCustomer(data);
    return { status: 'success' };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}

export async function editCustomer(data) {
  try {
    await updateCustomer(data);
    return { status: 'success' };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}
