'use server';

import { createCustomer } from '@/lib/services/customer-service';

export async function addCustomer(data) {
  try {
    await createCustomer(data);
    return { status: 'success' };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}
