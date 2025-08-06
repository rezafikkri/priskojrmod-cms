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
import pjmeDBPrismaClient from '../pjme-prisma-client';

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
    const customer = await getCustomer({
      id: parsedData.customer_id,
      select: { first_name: true, last_name: true, email: true },
      where: { is_banned: false },
    });
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
      orderBy: [
        { updated_at: 'desc' },
        { id: 'desc' },
      ],
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
      throw new NotFoundError('License key not found, please reload the page and try again.');
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
      where: { id: parsedId },
      select: {
        id: true,
        customer_id: true,
        key: true,
        used_for_activate: true,
        used_for_download: true,
        secret_key: {
          select: {
            app_name: true,
          },
        },
      },
    });
    if (licenseKey) {
      const customer = await pjmeDBPrismaClient.Customer.findUnique({
        where: { id: licenseKey.customer_id },
        select: {
          first_name: true,
          email: true,
        },
      });
      licenseKey.customer = `${customer.first_name} (${customer.email})`;
      licenseKey.appName = licenseKey.secret_key.app_name;
      licenseKey.parsedKey = jwt.decode(licenseKey.key);
      delete licenseKey.customer_id;
      delete licenseKey.secret_key;
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

function generateNewKey({
  parsedOldKey,
  parsedData,
  oldSecretKey,
}) {
  const payload = {
    name: parsedOldKey.name,
    email: parsedOldKey.email,
    type: parsedData.type,
  };

  if (parsedOldKey.type !== parsedData.type && !parsedData.change_expiration_date) {
    return {
      key: jwt.sign(
        { ...payload, exp: parsedOldKey.exp },
        oldSecretKey,
      ),
    };
  }

  if (parsedData.change_expiration_date) {
    const currentTime = Math.floor(new Date().getTime() / 1000);
    const baseTime = parsedOldKey.exp > currentTime ? parsedOldKey.exp : currentTime;

    const expiresAt = new Date(baseTime * 1000);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    const exp = Math.floor(expiresAt.getTime() / 1000);
    const key = jwt.sign(
      {
        name: parsedOldKey.name,
        email: parsedOldKey.email,
        type: parsedData.type,
        exp,
      },
      oldSecretKey,
    );
    return { key, exp };
  }

  return null;
}

export async function updateLicenseKey({
  id,
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
      type,
      used_for_activate,
      used_for_download,
      change_expiration_date,
    });

    let updateData = {
      used_for_activate: parsedData.used_for_activate,
      used_for_download: parsedData.used_for_download,
      updated_at: BigInt(Math.floor(new Date().getTime() / 1000)),
    };

    // check if key need to change or not
    const licenseKey = await pjmaDBPrismaClient.LicenseKey.findUnique({
      where: { id: parsedData.id },
      select: {
        key: true,
        secret_key: {
          select: {
            key: true,
          },
        },
      },
    });
    // check if licenseKey exist, because the licenseKey maybe has been deleted
    let newKey;
    if (licenseKey) {
      const parsedOldKey = verifyOrDecodeExpiredToken(licenseKey.key, licenseKey.secret_key.key);
      newKey = generateNewKey({
        parsedOldKey,
        parsedData,
        oldSecretKey: licenseKey.secret_key.key,
      });
      if (newKey) {
        updateData.key = newKey.key;
      }
    }

    // update license key from db
    const result = await pjmaDBPrismaClient.LicenseKey.update({
      where: { id: parsedData.id },
      select: { key: true },
      data: updateData,
    });
    if (newKey?.exp) {
      result.exp = newKey.exp;
    }
    return result;
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('License key not found.');
    }

    console.error(err);
    throw new UnknownError();
  }
}

export async function setCanRegenerateLicenseKeys(ids) {
  const session = await verifySession();
  if (!session) throw new Error('Unauthenticated');

  throw new Error('Gagal set can regenerate');

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
