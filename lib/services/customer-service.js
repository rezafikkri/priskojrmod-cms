import 'server-only';

import verifySession from '../verifySession';
import UnknownError from '../errors/UnknownError';
import NotFoundError from '../errors/NotFoundError';
import {
  createCustomerSchema,
  customerIdSchema,
  editCustomerSchema,
  filtersSchema,
  updateCustomerBanStatusSchema,
} from '../validators/customer-validator';
import DuplicateError from '../errors/DuplicateError';
import { searchKeySchema } from '../validators/base-validator';
import NotAllowedError from '../errors/NotAllowedError';
import { generateNameIdentifierLabel, getUnixTimestamp } from '../utils';
import prisma from '../prisma';
import { TransactionStatus } from '@/constants/enums';

// Select object for get and search customers for data-table
const DEFAULT_SELECT = {
  id: true,
  googleUserId: true,
  isBanned: true,
  firstName: true,
  lastName: true,
  picture: true,
  email: true,
  phoneNumber: true,
  lastActive: true,
  createdAt: true,
  updatedAt: true,
};

export async function createCustomer({
  firstName,
  lastName,
  email,
  picture,
}) {
  await verifySession();

  try {
    const parsedData = createCustomerSchema.parse({
      firstName,
      lastName,
      email,
      picture,
    });
    const currentTime = getUnixTimestamp();
    let createData = {
      firstName,
      lastName,
      email,
      createdAt: currentTime,
      updatedAt: currentTime,
    };
    if (parsedData.picture) {
      createData.picture = parsedData.picture;
    }

    return await prisma.customer.create({
      data: createData,
      select: { id: true },
    });
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2002') {
      throw new DuplicateError('Customer cannot be created because the email address is already in use.');
    }

    console.error(err);
    throw new UnknownError();
  }
}

function buildFilterWhereClause(filters) {
  const parsedFilters = filtersSchema.parse(filters);
  let where = { isBanned: parsedFilters.showBanned };

  if (parsedFilters.searchKey) {
    where.email = {
      startsWith: parsedFilters.searchKey,
      mode: 'insensitive',
    };
  }

  return where;
}

export async function getCustomers({ pageIndex, pageSize, filters }) {
  await verifySession();

  try {
    const customers = await prisma.customer.findMany({
      select: DEFAULT_SELECT,
      orderBy: { updatedAt: 'desc' },
      take: pageSize,
      skip: pageSize * pageIndex,
      where: buildFilterWhereClause(filters),
    });
    return customers.map(({ firstName, lastName, ...rest }) => ({
      name: `${firstName} ${lastName}`,
      ...rest,
    }));
  } catch (err) {
    console.error(err);
    throw new UnknownError();   
  }
}

export const countCustomers = async (filters) => {
  try {
    return await prisma.customer.count({
      where: buildFilterWhereClause(filters),
    });
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function getCustomer(id) {
  await verifySession();

  const idResult = customerIdSchema.safeParse(id);
  if (!idResult.success) return null;
  const parsedId = idResult.data;

  try {
    return await prisma.customer.findFirst({
      where: { id: parsedId },
      select: {
        id: true,
        isBanned: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        picture: true,
      },
    });
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function updateCustomer({
  id,
  firstName,
  lastName,
  email,
  picture,
}) {
  await verifySession();

  try {
    const parsedData = editCustomerSchema.parse({
      id,
      firstName,
      lastName,
      email,
      picture,
    });
    let updateData = {
      firstName: parsedData.firstName,
      lastName: parsedData.lastName,
      picture: parsedData.picture || null,
      updatedAt: getUnixTimestamp(),
    };

    // check if update email or not, throw error or not
    const customerStatus = await prisma.customer.findUnique({
      where: { id: parsedData.id },
      select: { isBanned: true },
    });
    if (customerStatus) {
      if (customerStatus.isBanned && parsedData.email) {
        updateData.email = parsedData.email;
      } else if (!customerStatus.isBanned && parsedData.email) {
        // throw NotAllowedError
        throw new NotAllowedError('Customer cannot be updated because the email address can only be changed while the customer is banned.');
      }
    }

    return await prisma.customer.update({
      where: { id: parsedData.id },
      data: updateData,
      select: { id: true },
    });
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('Failed to update the customer because it was not found.');
    } else if (err.name === 'NotAllowedError') {
      throw err;
    }

    console.error(err);
    throw new UnknownError();
  }
}

export async function updateCustomerBanStatus(id, isBanned) {
  await verifySession();

  try {
    const parsedData = updateCustomerBanStatusSchema.parse({
      id,
      isBanned,
    });
    return await prisma.customer.update({
      where: { id: parsedData.id },
      data: {
        isBanned: parsedData.isBanned,
        updatedAt: getUnixTimestamp(),
      },
      select: { id: true },
    });
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      const actionLabel = isBanned ? 'ban' : 'unban';
      throw new NotFoundError(`Failed to ${actionLabel} the customer because it was not found. Please refresh the table and try again.`);
    }

    console.error(err);
    throw new UnknownError();
  }
}

// Get customer suggestions for combobox/autocomplete based on search query
export async function getCustomerSuggestions(key, limit = 10) {
  await verifySession();

  try {
    const parsedKey = searchKeySchema.parse(key);
    const customers = await prisma.customer.findMany({
      where: {
        email: {
          startsWith: parsedKey,
          mode: 'insensitive',
        },
        isBanned: false,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
      take: limit,
    });
    return customers.map(({ firstName, lastName, email, ...rest }) => ({
      ...rest,
      displayLabel: generateNameIdentifierLabel(firstName, lastName, email),
    }));
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function deleteCustomer(id) {
  await verifySession();

  try {
    const parsedId = customerIdSchema.parse(id);

    // check there is or not pending transaction associated with this customer
    const hasPendingTransaction = await prisma.transaction.count({
      where: {
        customerId: parsedId,
        status: TransactionStatus.PENDING,
      },
    });

    if (hasPendingTransaction > 0) {
      throw new NotAllowedError('Customer cannot be deleted because it still has pending transactions. Please resolve them first.');
    }

    const customer = await prisma.customer.findUnique({
      where: { id: parsedId },
      select: {
        isBanned: true,
        googleUserId: true,
        lastActive: true,
      },
    });
    const licenseKeyCount = await prisma.licenseKey.count({
      where: { customerId: parsedId },
    });

    const currentTime = getUnixTimestamp();
    let isRecentlyActive = false;

    if (customer.lastActive) {
      const ninetyDaysAfterLastActive = customer.lastActive + (60 * 60 * 24 * 90);
      isRecentlyActive = currentTime <= ninetyDaysAfterLastActive;
    }

    if (!customer.isBanned) {
      if (isRecentlyActive) {
        throw new NotAllowedError('Customer cannot be deleted because it has been active within the last 90 days');
      }

      if (licenseKeyCount > 0) {
        throw new NotAllowedError('Customer cannot be deleted because it has associated license keys');
      }
    }

    // delete customer and cascade delete related license-key
    return await prisma.customer.delete({
      where: { id: parsedId },
      select: { id: true },
    });
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('Failed to delete the customer because it was not found. Please refresh the table and try again.');
    }

    if (err instanceof NotAllowedError) {
      throw err;
    }

    console.error(err);
    throw new UnknownError();
  }
}
