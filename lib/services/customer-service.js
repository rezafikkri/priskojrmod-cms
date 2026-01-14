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
import UnauthenticatedError from '../errors/UnauthenticatedError';
import { generateNameIdentifierLabel } from '../utils';
import prisma from '../prisma';

export async function createCustomer({
  firstName,
  lastName,
  email,
  picture,
}) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

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

export async function getCustomers({ select, pageIndex, pageSize, filters }) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedFilters = filtersSchema.parse(filters);
    const customers = await prisma.customer.findMany({
      select,
      orderBy: { updatedAt: 'desc' },
      take: pageSize,
      skip: pageSize * pageIndex,
      where: parsedFilters,
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
    const parsedFilters = filtersSchema.parse(filters);
    return await prisma.customer.count({
      where: parsedFilters,
    });
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function searchCustomers({ key, select, limit, filters }) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedFilters = filtersSchema.parse(filters);
    const parsedKey = searchKeySchema.parse(key);
    const customers = await prisma.customer.findMany({
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

export async function getCustomer({
  id,
  select = {
    id: true,
    isBanned: true,
    firstName: true,
    lastName: true,
    email: true,
    phoneNumber: true,
    picture: true,
  },
  where = {},
}) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  const idResult = customerIdSchema.safeParse(id);
  if (!idResult.success) return null;
  const parsedId = idResult.data;

  try {
    return await prisma.customer.findFirst({
      where: { id: parsedId, ...where },
      select,
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
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

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
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

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

// get customer data for combobox autocomplete
export async function getCustomersForAutocomplete(key, limit = 10) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

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
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

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
      where: { customer_id: parsedId },
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
      where: { customer_id: parsedId },
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
