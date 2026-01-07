import 'server-only';

import {
  secretKeyIdSchema,
  createSecretKeySchema,
  regenerateSecretKeySchema,
} from '../validators/secret-key-validator';
import NotFoundError from '../errors/NotFoundError';
import verifySession from '../verifySession';
import UnknownError from '../errors/UnknownError';
import { productIdSchema, productNameSchema } from '../validators/product-validator';
import DuplicateError from '../errors/DuplicateError';
import UnauthenticatedError from '../errors/UnauthenticatedError';
import { revalidatePath } from 'next/cache';
import NotAllowedError from '../errors/NotAllowedError';
import prisma from '../prisma';

export async function createSecretKey({
  product_id,
  key,
}) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedData = createSecretKeySchema.parse({ product_id, key });
    const productName = await prisma.product.findUnique({
      where: { id: parsedData.product_id },
      select: { name: true },
    });
    if (!productName) {
      throw new NotFoundError('Product not found. Please reload the page and try again.');
    }

    const result = await prisma.secretKeyLicense.create({
      data: {
        product_id: parsedData.product_id,
        app_name: productName.name,
        key: parsedData.key,
        created_at: Math.floor(new Date().getTime() / 1000),
      },
      select: { id: true },
    });

    // revalidate Router cache, Data cache and Full Route cache
    revalidatePath('/secret-key');
    revalidatePath('/license-key/new');

    return result;
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2002') {
      throw new DuplicateError('A secret key already exists for this application');
    } else if (err.name === 'NotFoundError') {
      throw err;
    }

    console.error(err);
    throw new UnknownError();
  }
}

export async function updateAppName({
  product_id,
  name,
}) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedName = productNameSchema.parse(name);
    const parsedProductId = productIdSchema.parse(product_id);
    return await prisma.secretKeyLicense.updateMany({
      where: { product_id: parsedProductId },
      data: {
        app_name: parsedName,
      },
    });
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function getSecretKeys(select) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    return await prisma.secretKeyLicense.findMany({
      select,
      orderBy: { created_at: 'desc' },
    });
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

/**
 * Used internally by services. Assumes `id` has already been validated.
 */
export async function getSpecificSecretKey(id, select) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    return await prisma.secretKeyLicense.findUnique({
      where: { id },
      select,
    });
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

/**
 * Public usage. Validates `id` using Zod schema before querying.
 */
export async function getSecretKey(id) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  const idResult = secretKeyIdSchema.safeParse(id);
  if (!idResult.success) return null;
  const parsedId = idResult.data;

  try {
    return await prisma.secretKeyLicense.findUnique({
      where: { id: parsedId },
      select: {
        id: true,
        app_name: true,
        key: true,
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
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedData = regenerateSecretKeySchema.parse({
      id,
      key,
    });
    const result = await prisma.secretKeyLicense.update({
      where: { id: parsedData.id },
      data: {
        key: parsedData.key,
        regenerated_at: Math.floor(new Date().getTime() / 1000),
      },
      select: { key: true },
    });

    // revalidate Router cache, Data cache and Full Route cache
    revalidatePath('/secret-key');

    return result;
  } catch (err) {
     if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('Secret key not found');
    }

    console.error(err);
    throw new UnknownError();   
  }
}

export async function deleteSecretKey(id) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedId = secretKeyIdSchema.parse(id);
    const result = await prisma.secretKeyLicense.delete({
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
        throw new NotFoundError('Secret key not found. Please reload the page and try again.');
      }

      if (err.code === 'P2003') {
        throw new NotAllowedError('Secret key cannot be deleted because there are still license keys using this secret key');
      }
    }

    console.error(err);
    throw new UnknownError();
  }
}
