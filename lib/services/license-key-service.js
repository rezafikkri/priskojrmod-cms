import 'server-only';

import pjmaDBPrismaClient from '../pjma-prisma-client';
import {
  editLicenseKeySchema,
  createLicenseKeySchema,
  licenseKeyIdSchema,
  filtersSchema,
  licenseKeyIdsSchema,
} from '../validators/license-key-validator';
import verifySession from '../verifySession';
import UnknownError from '../errors/UnknownError';
import jwt from 'jsonwebtoken';
import { getSpecificSecretKey } from './secret-key-service';
import NotFoundError from '../errors/NotFoundError';
import { searchKeySchema } from '../validators/base-validator';
import DuplicateError from '../errors/DuplicateError';
import { getCustomer } from './customer-service';
import NotAllowedError from '../errors/NotAllowedError';

export async function createLicenseKey({
  secret_key_id,
  customer_id,
  type,
}) {
  const session = await verifySession();
  if (!session) throw new Error('Unauthenticated');

  try {
    const parsedData = createLicenseKeySchema.parse({ secret_key_id, customer_id, type });
    const currentTime = BigInt(Math.floor(new Date().getTime() / 1000));

    // get name and email from customers table
    const customer = await getCustomer(
      parsedData.customer_id,
      { first_name: true, last_name: true, email: true },
      { is_banned: false },
    );
    // customer not exist most likely because is_banned = true
    if (!customer) {
      throw new NotAllowedError('Cannot assign a license key to a banned customer.');
    }

    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    const exp = Math.floor(expiresAt.getTime() / 1000);

    const { key: secretKey } = await getSpecificSecretKey(parsedData.secret_key_id, { key: true });
    const licenseKey = jwt.sign({
      name: `${customer.first_name} ${customer.last_name}`,
      email: customer.email,
      type: parsedData.type,
      exp,
    }, secretKey);

    // insert into db
    return await pjmaDBPrismaClient.LicenseKey.create({
      data: {
        secret_key_id: parsedData.secret_key_id,
        customer_id: parsedData.customer_id,
        email: customer.email,
        key: licenseKey,
        created_at: currentTime,
        updated_at: currentTime,
      },
      select: { id: true },
    });
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2002') {
      throw new DuplicateError('This customer already has a license key for the selected secret key.');
    } else if (err.name === 'NotAllowedError') {
      throw err;
    }

    console.error(err);
    throw new UnknownError();
  }
}

export async function getLicenseKeys({ select, pageIndex, pageSize, filters }) {
  const session = await verifySession();
  if (!session) throw new Error('Unauthenticated');

  try {
    const parsedFilters = filtersSchema.parse(filters);
    const licenseKeys = await pjmaDBPrismaClient.LicenseKey.findMany({
      select,
      orderBy: {
        updated_at: 'desc',
      },
      take: pageSize,
      skip: pageSize * pageIndex,
      where: parsedFilters,
    });
    return licenseKeys.map(lk => ({
      ...lk,
      expired_at: jwt.decode(lk.key).exp,
      created_at: lk.created_at.toString(),
      updated_at: lk.updated_at.toString(),
      regenerated_at: lk.regenerated_at && lk.regenerated_at.toString(),
    }));
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function searchLicenseKeys({ key, select, limit, filters }) {
  const session = await verifySession();
  if (!session) throw new Error('Unauthenticated');

  try {
    const parsedFilters = filtersSchema.parse(filters);
    const parsedKey = searchKeySchema.parse(key);
    const licenseKeys = await pjmaDBPrismaClient.LicenseKey.findMany({
      select,
      where: {
        email: {
          startsWith: parsedKey,
          mode: 'insensitive',
        },
        ...parsedFilters,
      },
      take: limit + 1,
    });
    return licenseKeys.map(lk => ({
      ...lk,
      expired_at: jwt.decode(lk.key).exp,
      created_at: lk.created_at.toString(),
      updated_at: lk.updated_at.toString(),
      regenerated_at: lk.regenerated_at && lk.regenerated_at.toString(),
    }));
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export const countLicenseKeys = async (filters) => {
  try {
    const parsedFilters = filtersSchema.parse(filters);
    return await pjmaDBPrismaClient.LicenseKey.count({
      where: parsedFilters,
    });
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function deleteLicenseKey(id) {
  const session = await verifySession();
  if (!session) throw new Error('Unauthenticated');

  try {
    const parsedId = licenseKeyIdSchema.parse(id);
    return await pjmaDBPrismaClient.LicenseKey.delete({
      where: { id: parsedId },
      select: { id: true },
    });
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('License Key not found, please reload the page and try again.');
    }

    console.error(err);
    throw new UnknownError();
  }
}

export async function getLicenseKey(id) {
  const session = await verifySession();
  if (!session) throw new Error('Unauthenticated');

  const idResult = licenseKeyIdSchema.safeParse(id);
  if (!idResult.success) return null;
  const parsedId = idResult.data;

  try {
    const licenseKey = await pjmaDBPrismaClient.LicenseKey.findUnique({
      where: {
        id: parsedId,
      },
      select: {
        id: true,
        secret_key_id: true,
        email: true,
        key: true,
        used_for_activate: true,
        used_for_download: true,
      },
    });
    if (licenseKey) {
      // conver bigint to string
      licenseKey.secret_key_id = licenseKey.secret_key_id.toString();
    }
    return licenseKey;
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

function verifyOrDecodeExpiredToken(key, secretKey) {
  try {
    return jwt.verify(key, secretKey);
  } catch (err) {
    if (err.name !== 'TokenExpiredError') {
      throw err;
    }
    return jwt.decode(key);
  }
}

async function generateNewKey({
  parsedOldKey,
  parsedData,
  oldSecretKey,
  oldSecretKeyId,
}) {
  let secretKey = oldSecretKey;
  if (oldSecretKeyId !== parsedData.secret_key_id) {
    ({ key: secretKey } = await getSpecificSecretKey(parsedData.secret_key_id, { key: true }));
  }

  if (
    (parsedOldKey.name !== parsedData.name || parsedOldKey.type !== parsedData.type)
      && !parsedData.change_expiration_date
  ) {
    return {
      key: jwt.sign(
        {
          name: parsedData.name,
          email: parsedOldKey.email,
          type: parsedData.type,
          exp: parsedOldKey.exp,
        },
        secretKey
      ),
    };
  }

  if (parsedData.change_expiration_date) {
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    const exp = Math.floor(expiresAt.getTime() / 1000);
    const key = jwt.sign(
      {
        name: parsedData.name,
        email: parsedOldKey.email,
        type: parsedData.type,
        exp,
      },
      secretKey,
    );
    return { key, exp };
  }

  if (oldSecretKeyId !== parsedData.secret_key_id) {
    return {
      key: jwt.sign(
        {
          name: parsedData.name,
          email: parsedOldKey.email,
          type: parsedData.type,
          exp: parsedOldKey.exp,
        },
        secretKey,
      ),
    };
  }

  return null;
}

export async function updateLicenseKey({
  id,
  old_key,
  old_secret_key_id,
  secret_key_id,
  name,
  type,
  used_for_activate,
  used_for_download,
  change_expiration_date,
}) {
  const session = await verifySession();
  if (!session) throw new Error('Unauthenticated');

  try {
    const parsedData = editLicenseKeySchema.parse({
      id,
      old_key,
      old_secret_key_id,
      secret_key_id,
      name,
      type,
      used_for_activate,
      used_for_download,
      change_expiration_date,
    });

    let updateData = {
      secret_key_id: parsedData.secret_key_id,
      used_for_activate: parsedData.used_for_activate,
      used_for_download: parsedData.used_for_download,
      updated_at: BigInt(Math.floor(new Date().getTime() / 1000)),
    };

    // check if key need to change or not
    const { key: oldSecretKey } = await getSpecificSecretKey(parsedData.old_secret_key_id, { key: true });
    const parsedOldKey = verifyOrDecodeExpiredToken(parsedData.old_key, oldSecretKey);
    const newKey = await generateNewKey({
      parsedOldKey,
      parsedData,
      oldSecretKey,
      oldSecretKeyId: parsedData.old_secret_key_id,
    });
    if (newKey) {
      updateData.key = newKey.key;
    }

    // update license key from db
    const result = await pjmaDBPrismaClient.LicenseKey.update({
      where: {
        id: parsedData.id,
      },
      select: {
        key: true,
        secret_key_id: true,
      },
      data: updateData,
    });
    result.secret_key_id = result.secret_key_id.toString();
    if (newKey?.exp) {
      result.exp = newKey.exp;
    }
    return result;
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('License Key not found.');
    }

    console.error(err);
    throw new UnknownError();
  }
}

export async function setCanRegenerateLicenseKeys(ids) {
  const session = await verifySession();
  if (!session) throw new Error('Unauthenticated');

  try {
    const parsedIds = licenseKeyIdsSchema.parse(ids);
    return await pjmaDBPrismaClient.LicenseKey.updateMany({
      where: {
        id: { in: parsedIds },
      },
      data: {
        can_regenerate: true,
        updated_at: BigInt(Math.floor(new Date().getTime() / 1000)),
      },
    });
  } catch (err) {
    console.error(err);
    throw new UnknownError();   
  }
}
