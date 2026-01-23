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
import { generateNameIdentifierLabel } from '../utils';
import prisma from '../prisma';

// Select object for get and search customers for data-table
const DEFAULT_SELECT = {
  id: true,
  googleUserId: true,
  isBanned: true,
  firstName: true,
  lastName: true,
  picture: true,
  email: true,
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
    const currentTime = Math.floor(new Date().getTime() / 1000);
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
      throw new DuplicateError('Email address is already associated with another customer');
    }

    console.error(err);
    throw new UnknownError();
  }
}

function buildFilterWhereClause(filters) {
  const parsedFilters = filtersSchema.parse(filters);
  return { isBanned: parsedFilters.showBanned };
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

export async function searchCustomers({ key, limit, filters }) {
  await verifySession();

  try {
    const parsedKey = searchKeySchema.parse(key);
    const customers = await prisma.customer.findMany({
      select: DEFAULT_SELECT,
      where: {
        email: {
          startsWith: parsedKey,
          mode: 'insensitive',
        },
        ...buildFilterWhereClause(filters),
      },
      take: limit + 1,
    });
    return customers.map(({ firstName: name, ...rest }) => {
      let newCustomer = { name, ...rest };
      if (rest.createdAt) {
        newCustomer.createdAt = rest.createdAt.toString();
      }
      if (rest.updatedAt) {
        newCustomer.updatedAt = rest.updatedAt.toString();
      }
      if (rest.lastActive) {
        newCustomer.lastActive = rest.lastActive.toString();
      }
      return newCustomer;
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
      picture: parsedData.picture,
      updatedAt: Math.floor(new Date().getTime() / 1000),
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
        throw new NotAllowedError('Email update is not allowed because customer is no longer banned');
      }
    }

    return await prisma.customer.update({
      where: { id: parsedData.id },
      data: updateData,
      select: { id: true },
    });
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('Customer not found');
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
        updatedAt: Math.floor(new Date().getTime() / 1000),
      },
      select: { id: true },
    });
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('Customer not found. Please reload the page and try again.');
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
    const customer = await getCustomer({
      id: parsedId,
      select: {
        isBanned: true,
        googleUserId: true,
        lastActive: true,
      },
    });
    const licenseKeyCount = await prisma.licenseKey.count({
      where: { customerId: parsedId },
    });

    const currentTime = Math.floor(new Date().getTime() / 1000);
    const thirtyDays = 60 * 60 * 24 * 30;
    const isInactive = !customer.lastActive || currentTime - customer.lastActive > thirtyDays;
    const hasLicenseKey = licenseKeyCount > 0;
    const isEligibleToDelete = ((!customer.googleUserId || isInactive) && !hasLicenseKey) || customer.isBanned;

    if (!isEligibleToDelete) {
      if (licenseKeyCount) {
        throw new NotAllowedError('Customer cannot be deleted because they have related license keys');
      }
      throw new NotAllowedError('Customer is not eligible for deletion');
    }

    // delete customer
    const result = await prisma.customer.delete({
      where: { id: parsedId },
      select: { id: true },
    });

    // delete license key that related to customer
    await prisma.licenseKey.deleteMany({
      where: { customerId: parsedId },
    });
    
    return result;
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('Customer not found. Please reload the page and try again.');
    } else if (err.name === 'NotAllowedError') {
      throw err;
    }

    console.error(err);
    throw new UnknownError();
  }
}
