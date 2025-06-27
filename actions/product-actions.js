'use server';

import {
  createProduct,
  updateProductPinnedStatus,
  updateProductPublishedStatus,
} from '@/lib/services/product-service';

export async function addProduct(data) {
  try {
    await createProduct(data);
    return { status: 'success' };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}

export async function editProductPinnedStatus({ id, is_pinned }) {
  try {
    const updatedData = await updateProductPinnedStatus({ id, is_pinned });
    return { status: 'success', data: updatedData };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}

export async function editProductPublishedStatus({ id, is_published }) {
  try {
    const updatedData = await updateProductPublishedStatus({ id, is_published });
    return { status: 'success', data: updatedData };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}
