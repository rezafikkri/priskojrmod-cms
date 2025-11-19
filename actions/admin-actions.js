'use server';

import { createAdmin } from '@/lib/services/admin-service';

export async function addAdmin(data) {
  try {
    await createAdmin(data);
    return { status: 'success' };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}
