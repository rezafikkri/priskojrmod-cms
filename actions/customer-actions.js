'use server';

import { createCustomer, updateCustomer, updateCustomerBanStatus } from '@/lib/services/customer-service';

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

export async function editCustomerBanStatus(id, is_banned) {
  try {
    await updateCustomerBanStatus(id, is_banned);
    return { status: 'success' };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}
