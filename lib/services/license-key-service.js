import 'server-only';

import {
  editLicenseKeySchema,
  createLicenseKeySchema,
  licenseKeyIdSchema,
  filtersSchema,
  licenseKeyIdsSchema,
  updateLicenseKeyRevokeStatusSchema,
} from '../validators/license-key-validator';
import verifySession from '../verifySession';
import UnknownError from '../errors/UnknownError';
import jwt from 'jsonwebtoken';
import NotFoundError from '../errors/NotFoundError';
import DuplicateError from '../errors/DuplicateError';
import NotAllowedError from '../errors/NotAllowedError';
import { v7 as uuidv7 } from 'uuid';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/id';
import 'dayjs/locale/en';
import prisma from '../prisma';
import { generateNameIdentifierLabel, getUnixTimestamp } from '../utils';

dayjs.extend(utc);
dayjs.extend(timezone);

const dayJsLocale = process.env.NEXT_PUBLIC_LOCALE.split('-')[0];

dayjs.locale(dayJsLocale);

// Select object for get and search license-keys for data-table
const DEFAULT_SELECT = {
  id: true,
  deviceId: true,
  code: true,
  isRevoked: true,
  createdAt: true,
  updatedAt: true,
  lastUsedAt: true,
  regeneratedAt: true,
  secretKey: {
    select: {
      product: {
        select: { name: true },
      },
    },
  },
  customer: {
    select: { email: true, firstName: true, lastName: true },
  },
};

/**
 * Generate a new license key code (JWT).
 */
export function generateLicenseKeyCode({
  payload: {
    licenseKeyId,
    name,
    email,
    exp,
  },
  secretKey,
}) {
  return jwt.sign({ licenseKeyId, name, email, exp }, secretKey);
}

export async function createLicenseKey({
  secretKeyId,
  customerId,
}) {
  await verifySession();

  try {
    const parsedData = createLicenseKeySchema.parse({ secretKeyId, customerId });
    const currentTime = getUnixTimestamp();

    // get name and email from customers table
    const customer = await prisma.customer.findFirst({
      select: { firstName: true, lastName: true, email: true },
      where: {
        id: parsedData.customerId,
        isBanned: false,
      },
    });
    // customer not exist most likely because isBanned = true
    if (!customer) {
      throw new NotAllowedError('License key cannot be created because the customer account is banned or no longer exists.');
    }

    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    const exp = Math.floor(expiresAt.getTime() / 1000);

    const licenseKeyId = uuidv7();
    const { key: secretKey } = await prisma.secretKey.findUnique({
      where: { id: parsedData.secretKeyId },
      select: { key: true },
    });
    const code = generateLicenseKeyCode({
      payload: {
        licenseKeyId: licenseKeyId,
        name: `${customer.firstName} ${customer.lastName}`,
        email: customer.email,
        exp,
      },
      secretKey,
    });

    // insert into db
    return await prisma.licenseKey.create({
      data: {
        id: licenseKeyId,
        secretKeyId: parsedData.secretKeyId,
        customerId: parsedData.customerId,
        code,
        createdAt: currentTime,
        updatedAt: currentTime,
      },
      select: { id: true },
    });
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2002') {
      throw new DuplicateError('License key cannot be created because the customer already has one for this application.');
    } else if (err.name === 'NotAllowedError') {
      throw err;
    }

    console.error(err);
    throw new UnknownError();
  }
}

function buildFilterWhereClause(filters) {
  const parsedFilters = filtersSchema.parse(filters);
  let where = { isRevoked: parsedFilters.showRevoked };

  if (parsedFilters.secretKeyId) where.secretKeyId = parsedFilters.secretKeyId;
  if (parsedFilters.canRegenerate !== undefined) {
    where.canRegenerate = parsedFilters.canRegenerate;
  }
  if (parsedFilters.searchKey) {
    where.customer = {
      email: {
        startsWith: parsedFilters.searchKey,
        mode: 'insensitive',
      },
    };
  }

  return where;
}

export async function getLicenseKeys({ pageIndex, pageSize, filters }) {
  await verifySession();

  try {
    const licenseKeys = await prisma.licenseKey.findMany({
      select: DEFAULT_SELECT,
      orderBy: [
        { updatedAt: 'desc' },
        { id: 'desc' },
      ],
      take: pageSize,
      skip: pageSize * pageIndex,
      where: buildFilterWhereClause(filters),
    });
    return licenseKeys.map(({ customer: { email, firstName, lastName }, ...lk }) => ({
      ...lk,
      expiredAt: jwt.decode(lk.code).exp,
      customerEmail: email,
      customerName: `${firstName} ${lastName}`,
    }));
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export const countLicenseKeys = async (filters) => {
  try {
    return await prisma.licenseKey.count({
      where: buildFilterWhereClause(filters),
    });
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function deleteLicenseKey(id) {
  await verifySession();

  try {
    const parsedId = licenseKeyIdSchema.parse(id);
    return await prisma.licenseKey.delete({
      where: { id: parsedId },
      select: { id: true },
    });
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('Failed to delete the license key because it was not found. Please refresh the table and try again.');
    }

    console.error(err);
    throw new UnknownError();
  }
}

export async function getLicenseKey(id) {
  await verifySession();

  const idResult = licenseKeyIdSchema.safeParse(id);
  if (!idResult.success) return null;
  const parsedId = idResult.data;

  try {
    const licenseKey = await prisma.licenseKey.findUnique({
      where: { id: parsedId },
      select: {
        id: true,
        code: true,
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        resetCount: true,
        lastResetPeriod: true,
        secretKey: {
          select: {
            product: {
              select: { name: true },
            },
          },
        },
      },
    });
    if (licenseKey) {
      licenseKey.customer = generateNameIdentifierLabel(
        licenseKey.customer.firstName,
        licenseKey.customer.lastName,
        licenseKey.customer.email,
      );
      licenseKey.parsedKey = jwt.decode(licenseKey.code);

      const currentPeriod = dayjs.utc().format('YYYY-MM');
      const timezone = process.env.NEXT_PUBLIC_TIMEZONE;
      if (currentPeriod !== licenseKey.lastResetPeriod) {
        licenseKey.resetCount = 0;
        licenseKey.lastResetPeriod = dayjs.utc(currentPeriod).tz(timezone).format('MMM YYYY');
      } else {
        licenseKey.resetCount = licenseKey.resetCount;
        licenseKey.lastResetPeriod = dayjs.utc(licenseKey.lastResetPeriod).tz(timezone).format('MMM YYYY');
      }
    }
    return licenseKey;
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

function verifyOrDecodeExpiredLicenseKey(code, secretKey) {
  try {
    return jwt.verify(code, secretKey);
  } catch (err) {
    if (err.name !== 'TokenExpiredError') {
      throw err;
    }
    return jwt.decode(code);
  }
}

export function isLicenseKeyExpired(code, secretKey) {
  try {
    jwt.verify(code, secretKey);
    return false;
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return true;
    }

    throw err;
  }
}

function getRegeneratedLicenseKeyCodeIfNeeded({
  parsedOldCode,
  parsedData,
  oldSecretKey,
}) {
  if (parsedData.changeExpirationDate) {
    const currentTime = getUnixTimestamp();
    const baseTime = parsedOldCode.exp > currentTime ? parsedOldCode.exp : currentTime;

    const expiresAt = new Date(baseTime * 1000);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    const exp = Math.floor(expiresAt.getTime() / 1000);
    const code = generateLicenseKeyCode({
      payload: {
        licenseKeyId: parsedOldCode.licenseKeyId,
        name: parsedOldCode.name,
        email: parsedOldCode.email,
        exp,
      },
      secretKey: oldSecretKey,
    });
    return { code, exp };
  }

  return null;
}

export async function updateLicenseKey({
  id,
  changeExpirationDate,
}) {
  await verifySession();

  try {
    const parsedData = editLicenseKeySchema.parse({
      id,
      changeExpirationDate,
    });

    let updateData = {
      updatedAt: getUnixTimestamp(),
    };

    // check if code need to change or not
    const licenseKey = await prisma.licenseKey.findUnique({
      where: { id: parsedData.id },
      select: {
        code: true,
        secretKey: {
          select: {
            key: true,
          },
        },
      },
    });
    // check if licenseKey exist, because the licenseKey maybe has been deleted
    let newCode;
    if (licenseKey) {
      const parsedOldCode = verifyOrDecodeExpiredLicenseKey(licenseKey.code, licenseKey.secretKey.key);
      newCode = getRegeneratedLicenseKeyCodeIfNeeded({
        parsedOldCode,
        parsedData,
        oldSecretKey: licenseKey.secretKey.key,
      });
      if (newCode) {
        updateData.code = newCode.code;
        updateData.canRegenerate = false;
      }
    }

    // update license key from db
    const result = await prisma.licenseKey.update({
      where: { id: parsedData.id },
      select: { id: true },
      data: updateData,
    });
    if (newCode?.exp) {
      result.exp = newCode.exp;
    }
    return result;
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('Failed to update the license key because it was not found.');
    }

    console.error(err);
    throw new UnknownError();
  }
}

// Why not check isRevoked? Because technically, there's no security
// issue if a revoked license is regenerated (it only replaces
// the secret key, not the expiry), but it doesn't make sense
// from a business perspective. Therefore, the `isRevoked` check is performed
// when the customer actually triggers the regenerate action, not when
// regeneration is merely allowed (e.g. `canRegenerate = true`).
export async function setCanRegenerateLicenseKeys(ids) {
  await verifySession();

  try {
    const parsedIds = licenseKeyIdsSchema.parse(ids);
    return await prisma.licenseKey.updateMany({
      where: {
        id: { in: parsedIds },
      },
      data: {
        canRegenerate: true,
        updatedAt: getUnixTimestamp(),
      },
    });
  } catch (err) {
    console.error(err);
    throw new UnknownError();   
  }
}

export async function updateLicenseKeyRevokeStatus(id, isRevoked) {
  await verifySession();

  try {
    const parsedData = updateLicenseKeyRevokeStatusSchema.parse({
      id,
      isRevoked,
    });
    return await prisma.licenseKey.update({
      where: { id: parsedData.id },
      data: {
        isRevoked: parsedData.isRevoked,
        updatedAt: getUnixTimestamp(),
      },
      select: { id: true },
    });
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      const actionLabel = isRevoked ? 'revoke' : 'unrevoke';
      throw new NotFoundError(`Failed to ${actionLabel} the license key because it was not found. Please refresh the table and try again.`);
    }

    console.error(err);
    throw new UnknownError();
  }
}

export async function resetDevice(id) {
  await verifySession();

  try {
    const parsedId = licenseKeyIdSchema.parse(id);
    return await prisma.licenseKey.update({
      where: { id: parsedId },
      data: {
        deviceId: null,
        updatedAt: getUnixTimestamp(),
      },
      select: {
        updatedAt: true,
      },
    });
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('Failed to reset the device because the license key was not found. Please refresh the table and try again.');
    }

    console.error(err);
    throw new UnknownError();
  }
}

// Silent parameter is use when this function used as rollback function.
// Make sure to check that customer.isBanned === false before using this function.
// Security Note: `codes` must only come from internal system logic,
// never directly from user input or in client side in generally. No schema validation is applied here.
export async function createLicenseKeys({
  codes,
  rollback,
  silent = false,
}) {
  await verifySession();

  try {
    return await prisma.licenseKey.createMany({
      data: codes,
      skipDuplicates: true,
    });
  } catch (err) {  
    if (rollback) {
      try { await rollback() } catch (rErr) {}
    }

    if (!silent) {
      console.error(err);
      throw new UnknownError();
    }
  }
}

// Silent parameter is use when this function used as rollback function.
// Security Note: `ids` and `isRevoked` must only come from internal system logic,
// never directly from user input or in client side in generally. No schema validation is applied here.
export async function updateLicenseKeysRevokeStatus({
  ids,
  isRevoked,
  rollback,
  silent = false,
}) {
  await verifySession();

  try {
    return await prisma.licenseKey.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        isRevoked: isRevoked,
        updatedAt: getUnixTimestamp(),
      },
    });
  } catch (err) {
    if (rollback) {
      try { await rollback() } catch (rErr) {}
    }

    if (!silent) {
      console.error(err);
      throw new UnknownError();   
    }
  }
}

// This function is used for rollback, because of this, there is slient parameter.
// Security Note: `ids` must only come from internal system logic,
// never directly from user input or in client side in generally. No schema validation is applied here.
export async function deleteLicenseKeys({ ids, silent = true }) {
  await verifySession();

  try {
    return await prisma.licenseKey.deleteMany({
      where: {
        id: { in: ids },
      },
    });
  } catch (err) {
    if (!silent) {
      console.error(err);
      throw new UnknownError();   
    }
  }
}

// Silent parameter is use when this function used as rollback function.
// This function is intended for internal system usage only.
// Security Note: `codes` must only come from trusted internal logic,
// never from client-side or user input under any circumstances.
// No schema validation is applied here, ensure data integrity before calling this function.
export async function updateLicenseKeys({
  codes,
  rollback,
  silent = false,
}) {
  await verifySession();

  try {
    return await prisma.$transaction(
      codes.map(({ id, ...rest }) => prisma.licenseKey.update({
        where: { id },
        data: rest,
        select: { id: true },
      })),
    );
  } catch (err) {
    if (rollback) {
      try { await rollback() } catch (rErr) {}
    }

    if (!silent) {
      console.error(err);
      throw new UnknownError();   
    }   
  }
}
