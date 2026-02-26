import 'server-only';

import {
  secretKeyIdSchema,
  createSecretKeySchema,
  regenerateSecretKeySchema,
} from '../validators/secret-key-validator';
import NotFoundError from '../errors/NotFoundError';
import verifySession from '../verifySession';
import UnknownError from '../errors/UnknownError';
import DuplicateError from '../errors/DuplicateError';
import { revalidatePath } from 'next/cache';
import NotAllowedError from '../errors/NotAllowedError';
import prisma from '../prisma';

export async function createSecretKey({
  productId,
  key,
}) {
  await verifySession();

  try {
    const parsedData = createSecretKeySchema.parse({ productId, key });
    const product = await prisma.product.findUnique({
      where: { id: parsedData.productId },
      select: { id: true },
    });
    if (!product) {
      throw new NotFoundError('Failed to create the secret key because the selected application was not found. Please reload the page and try again.');
    }

    const result = await prisma.secretKey.create({
      data: {
        productId: parsedData.productId,
        key: parsedData.key,
        createdAt: Math.floor(new Date().getTime() / 1000),
      },
      select: { id: true },
    });

    // revalidate Router cache, Data cache and Full Route cache
    revalidatePath('/secret-key');
    revalidatePath('/license-key/new');

    return result;
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2002') {
      throw new DuplicateError('Secret key cannot be created because a secret key for this application already exists.');
    } else if (err.name === 'NotFoundError') {
      throw err;
    }

    console.error(err);
    throw new UnknownError();
  }
}

/*
 * Get all secret keys for list, like table
 */
export async function getSecretKeys() {
  await verifySession();

  try {
    return await prisma.secretKey.findMany({
      select: {
        id: true,
        key: true,
        createdAt: true,
        regeneratedAt: true,
        product: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

/*
 * Get all secret keys for selectable, like select input
 */
export async function getSelectableSecretKeys() {
  await verifySession();

  try {
    return await prisma.secretKey.findMany({
      select: {
        id: true,
        product: {
          select: { name: true },
        },
      },
      orderBy: {
        product: { name: 'asc' },
      },
    });
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

/**
 * Get secret key by id, like for edit form
 */
export async function getSecretKey(id) {
  await verifySession();

  const idResult = secretKeyIdSchema.safeParse(id);
  if (!idResult.success) return null;
  const parsedId = idResult.data;

  try {
    return await prisma.secretKey.findUnique({
      where: { id: parsedId },
      select: {
        id: true,
        key: true,
        product: {
          select: { name: true },
        },
      },
    });
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function saveRegeneratedSecretKey({
  id,
  key,
}) {
  await verifySession();

  try {
    const parsedData = regenerateSecretKeySchema.parse({
      id,
      key,
    });
    const result = await prisma.secretKey.update({
      where: { id: parsedData.id },
      data: {
        key: parsedData.key,
        regeneratedAt: Math.floor(new Date().getTime() / 1000),
      },
      select: { key: true },
    });

    // revalidate Router cache, Data cache and Full Route cache
    revalidatePath('/secret-key');

    return result;
  } catch (err) {
     if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('Failed to update the secret key because it was not found.');
    }

    console.error(err);
    throw new UnknownError();   
  }
}

export async function deleteSecretKey(id) {
  await verifySession();

  try {
    const parsedId = secretKeyIdSchema.parse(id);

    const licenseKeys = await prisma.licenseKey.findMany({
      where: { secretKeyId: parsedId },
      select: { id: true },
    });

    if (licenseKeys.length > 0) {
      throw new NotAllowedError('Secret key cannot be deleted because there are still license keys using this secret key');
    }

    const result = await prisma.secretKey.delete({
      where: { id: parsedId },
      select: { id: true },
    });

    // revalidate Router cache, Data cache and Full Route cache
    revalidatePath('/secret-key');
    revalidatePath('/license-key/new');

    return result;
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError') {
      if (err.code === 'P2025') {
        throw new NotFoundError('Failed to delete the secret key because it was not found. Please reload the page and try again.');
      }
    }

    if (err.name === 'NotAllowedError') {
      throw err;
    }

    console.error(err);
    throw new UnknownError();
  }
}
