'use server';

import { createCategory, deleteCategory, updateCategory } from '@/lib/services/category-service';

export async function addCategory(data) {
  try {
    await createCategory(data);
    return { status: 'success' };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}

export async function removeCategory(id) {
  try {
    await deleteCategory(id);
    return { status: 'success' };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}

export async function editCategory(data) {
  try {
    await updateCategory(data);
    return { status: 'success' };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}
