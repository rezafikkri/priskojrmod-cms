import 'server-only';

import pjmaDBPrismaClient from '../pjma-prisma-client';
import {
  secretKeyIdSchema,
  createSecretKeySchema,
  regenerateSecretKeySchema,
} from '../validators/secret-key-validator';
import NotFoundError from '../errors/NotFoundError';
import verifySession from '../verifySession';
import UnknownError from '../errors/UnknownError';
import pjmeDBPrismaClient from '../pjme-prisma-client';
import { productIdSchema, productNameSchema } from '../validators/product-validator';
import DuplicateError from '../errors/DuplicateError';
import UnauthenticatedError from '../errors/UnauthenticatedError';

export async function createSecretKey({
  product_id,
  key,
}) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedData = createSecretKeySchema.parse({ product_id, key });
    const productName = await pjmeDBPrismaClient.Product.findUnique({
      where: { id: parsedData.product_id },
      select: { name: true },
    });
    if (!productName) {
      throw new NotFoundError('Product not found. Please reload the page and try again.');
    }

    const result = await pjmaDBPrismaClient.SecretKeyLicense.create({
      data: {
        product_id: parsedData.product_id,
        app_name: productName.name,
        key: parsedData.key,
        created_at: BigInt(Math.floor(new Date().getTime() / 1000)),
      },
      select: { id: true },
    });
    result.id = result.id.toString();
    return result;
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2002') {
      throw new DuplicateError('A secret key already exists for this application.');
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
    return await pjmaDBPrismaClient.SecretKeyLicense.updateMany({
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
    const secretKeys = await pjmaDBPrismaClient.SecretKeyLicense.findMany({
      select,
      orderBy: { created_at: 'desc' },
    });
    return secretKeys.map(sk => {
      let newSK = {
        ...sk,
        id: sk.id.toString(),
      };
      if (sk.created_at) {
        newSK.created_at = sk.created_at.toString();
      }
      if (sk.regenerated_at) {
        newSK.regenerated_at = sk.regenerated_at.toString();
      }
      return newSK;
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
    const secretKey = await pjmaDBPrismaClient.SecretKeyLicense.findUnique({
      where: { id: BigInt(id) },
      select,
    });
    if (secretKey.id) {
      secretKey.id = secretKey.id.toString();
    }
    return secretKey;
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
    const secretKey = await pjmaDBPrismaClient.SecretKeyLicense.findUnique({
      where: { id: parsedId },
      select: {
        id: true,
        app_name: true,
        key: true,
      },
    });
    if (secretKey) {
      secretKey.id.toString();
    }
    return secretKey;
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
    return await pjmaDBPrismaClient.SecretKeyLicense.update({
      where: { id: parsedData.id },
      data: {
        key: parsedData.key,
        regenerated_at: BigInt(Math.floor(new Date().getTime() / 1000)),
      },
      select: { key: true },
    });
  } catch (err) {
     if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('Secret key not found.');
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
    const result = await pjmaDBPrismaClient.SecretKeyLicense.delete({
      where: { id: parsedId },
      select: { id: true },
    });
    result.id = result.id.toString();
    return result;
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('Secret Key not found, please reload the page and try again.');
    }

    console.error(err);
    throw new UnknownError();
  }
}
