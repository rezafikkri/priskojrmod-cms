'use server';

import {
  createProduct,
  updateProductPinnedStatus,
  updateProductPublishedStatus,
  deleteProduct,
  deleteProductDiscount,
  deleteProductCoupon,
  deleteProductVariant,
  deleteProductImage,
  updateProduct,
  getDriveFileInfo,
} from '@/lib/services/product-service';

export async function addProduct(data) {
  try {
    await createProduct(data);
    return { status: 'success' };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}

export async function editProductPinnedStatus(id, isPinned) {
  try {
    const updatedData = await updateProductPinnedStatus(id, isPinned);
    return { status: 'success', data: updatedData };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}

export async function editProductPublishedStatus(id, isPublished) {
  try {
    const updatedData = await updateProductPublishedStatus(id, isPublished);
    return { status: 'success', data: updatedData };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}

export async function removeProduct(id) {
  try {
    await deleteProduct(id);
    return { status: 'success' };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}

export async function removeProductDiscount(id, productId) {
  try {
    await deleteProductDiscount(id, productId);
    return { status: 'success' };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}

export async function removeProductCoupon(id, productId) {
  try {
    await deleteProductCoupon(id, productId);
    return { status: 'success' };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}

export async function removeProductVariant(id, productId) {
  try {
    await deleteProductVariant(id, productId);
    return { status: 'success' };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}

export async function removeProductImage(id, productId) {
  try {
    await deleteProductImage(id, productId);
    return { status: 'success' };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}

export async function editProduct(data) {
  try {
    const updatedData = await updateProduct(data);
    return { status: 'success', data: updatedData };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}

export async function fetchDriveFileInfo(fileId) {
  try {
    const fileInfo = await getDriveFileInfo(fileId);
    return { status: 'success', data: fileInfo };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}
