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
import { searchKeySchema } from '../validators/base-validator';
import DuplicateError from '../errors/DuplicateError';
import NotAllowedError from '../errors/NotAllowedError';
import { v7 as uuidv7 } from 'uuid';
import UnauthenticatedError from '../errors/UnauthenticatedError';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/id';
import 'dayjs/locale/en';
import prisma from '../prisma';
import { generateNameIdentifierLabel } from '../utils';

dayjs.extend(utc);
dayjs.extend(timezone);

const dayJsLocale = process.env.NEXT_PUBLIC_LOCALE.split('-')[0];

dayjs.locale(dayJsLocale);

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
  secret_key_id,
  customer_id,
}) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedData = createLicenseKeySchema.parse({ secret_key_id, customer_id });
    const currentTime = Math.floor(new Date().getTime() / 1000);

    // get name and email from customers table
    const customer = await prisma.customer.findFirst({
      select: { firstName: true, lastName: true, email: true },
      where: {
        id: parsedData.customer_id,
        isBanned: false,
      },
    });
    // customer not exist most likely because isBanned = true
    if (!customer) {
      throw new NotAllowedError('Cannot assign a license key to a banned customer.');
    }

    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    const exp = Math.floor(expiresAt.getTime() / 1000);

    const licenseKeyId = uuidv7();
    const { key: secretKey } = await prisma.secretKey.findUnique({
      where: { id: parsedData.secret_key_id },
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
        secret_key_id: parsedData.secret_key_id,
        customer_id: parsedData.customer_id,
        code,
        created_at: currentTime,
        updated_at: currentTime,
      },
      select: { id: true },
    });
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2002') {
      throw new DuplicateError('This customer already has a license key for the selected secret key');
    } else if (err.name === 'NotAllowedError') {
      throw err;
    }

    console.error(err);
    throw new UnknownError();
  }
}

export async function getLicenseKeys({ pageIndex, pageSize, filters }) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedFilters = filtersSchema.parse(filters);
    const licenseKeys = await prisma.licenseKey.findMany({
      select: {
        id: true,
        device_id: true,
        code: true,
        is_revoked: true,
        created_at: true,
        updated_at: true,
        regenerated_at: true,
        secretKey: {
          select: {
            product: {
              select: { name: true },
            },
          },
        },
        customer: {
          select: { email: true },
        },
      },
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
      expired_at: jwt.decode(lk.code).exp,
    }));
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function searchLicenseKeys({ key, limit, filters }) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedFilters = filtersSchema.parse(filters);
    const parsedKey = searchKeySchema.parse(key);
    const licenseKeys = await prisma.licenseKey.findMany({
      select: {
        id: true,
        device_id: true,
        code: true,
        is_revoked: true,
        created_at: true,
        updated_at: true,
        regenerated_at: true,
        secretKey: {
          select: {
            product: {
              select: { name: true },
            },
          },
        },
        customer: {
          select: { email: true },
        },
      },
      where: {
        customer: {
          email: {
            startsWith: parsedKey,
            mode: 'insensitive',
          },
        },
        ...parsedFilters,
      },
      take: limit + 1,
    });
    return licenseKeys.map(lk => ({
      ...lk,
      expired_at: jwt.decode(lk.code).exp,
    }));
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export const countLicenseKeys = async (filters) => {
  try {
    const parsedFilters = filtersSchema.parse(filters);
    return await prisma.licenseKey.count({
      where: parsedFilters,
    });
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function deleteLicenseKey(id) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedId = licenseKeyIdSchema.parse(id);
    return await prisma.licenseKey.delete({
      where: { id: parsedId },
      select: { id: true },
    });
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('License key not found. Please refresh and try again.');
    }

    console.error(err);
    throw new UnknownError();
  }
}

export async function getLicenseKey(id) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

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
        reset_count: true,
        last_reset_period: true,
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
      if (currentPeriod !== licenseKey.last_reset_period) {
        licenseKey.resetCount = 0;
        licenseKey.resetPeriod = dayjs.utc(currentPeriod).tz(timezone).format('MMM YYYY');
      } else {
        licenseKey.resetCount = licenseKey.reset_count;
        licenseKey.resetPeriod = dayjs.utc(licenseKey.last_reset_period).tz(timezone).format('MMM YYYY');
      }

      delete licenseKey.reset_count;
      delete licenseKey.last_reset_period;
    }
    return licenseKey;
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

function verifyOrDecodeExpiredToken(token, secretKey) {
  try {
    return jwt.verify(token, secretKey);
  } catch (err) {
    if (err.name !== 'TokenExpiredError') {
      throw err;
    }
    return jwt.decode(token);
  }
}

function getRegeneratedLicenseKeyCodeIfNeeded({
  parsedOldCode,
  parsedData,
  oldSecretKey,
}) {
  if (parsedData.change_expiration_date) {
    const currentTime = Math.floor(new Date().getTime() / 1000);
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
  change_expiration_date,
}) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedData = editLicenseKeySchema.parse({
      id,
      change_expiration_date,
    });

    let updateData = {
      updated_at: Math.floor(new Date().getTime() / 1000),
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
      const parsedOldCode = verifyOrDecodeExpiredToken(licenseKey.code, licenseKey.secretKey.key);
      newCode = getRegeneratedLicenseKeyCodeIfNeeded({
        parsedOldCode,
        parsedData,
        oldSecretKey: licenseKey.secretKey.key,
      });
      if (newCode) {
        updateData.code = newCode.code;
        updateData.can_regenerate = false;
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
      throw new NotFoundError('License key not found');
    }

    console.error(err);
    throw new UnknownError();
  }
}

// Technically, there's no security issue if a revoked license is regenerated
// (it only replaces the secret key, not the expiry), but it doesn't make sense
// from a business perspective. Therefore, the `is_revoked` check is performed
// when the customer actually triggers the regenerate action, not when
// regeneration is merely allowed (e.g. `can_regenerate = true`).
export async function setCanRegenerateLicenseKeys(ids) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedIds = licenseKeyIdsSchema.parse(ids);
    return await prisma.licenseKey.updateMany({
      where: {
        id: { in: parsedIds },
      },
      data: {
        can_regenerate: true,
        updated_at: Math.floor(new Date().getTime() / 1000),
      },
    });
  } catch (err) {
    console.error(err);
    throw new UnknownError();   
  }
}

export async function updateLicenseKeyRevokeStatus(id, is_revoked) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedData = updateLicenseKeyRevokeStatusSchema.parse({
      id,
      is_revoked,
    });
    return await prisma.licenseKey.update({
      where: { id: parsedData.id },
      data: {
        is_revoked: parsedData.is_revoked,
        updated_at: Math.floor(new Date().getTime() / 1000),
      },
      select: { id: true },
    });
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('License key not found. Please refresh and try again');
    }

    console.error(err);
    throw new UnknownError();
  }
}

export async function resetDevice(id) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedId = licenseKeyIdSchema.parse(id);
    return await prisma.licenseKey.update({
      where: { id: parsedId },
      data: {
        device_id: null,
        updated_at: Math.floor(new Date().getTime() / 1000),
      },
      select: {
        updated_at: true,
      },
    });
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('License key not found. Please refresh and try again');
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
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

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
// Security Note: `ids` and `is_revoked` must only come from internal system logic,
// never directly from user input or in client side in generally. No schema validation is applied here.
export async function updateLicenseKeysRevokeStatus({
  ids,
  isRevoked,
  rollback,
  silent = false,
}) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    return await prisma.licenseKey.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        is_revoked: isRevoked,
        updated_at: Math.floor(new Date().getTime() / 1000),
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
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

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
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

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
