import 'server-only';

import pjmeDBPrismaClient from '../pjme-prisma-client';
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
import pjmaDBPrismaClient from '../pjma-prisma-client';

export async function createCustomer({
  first_name,
  last_name,
  email,
  picture,
}) {
  const session = await verifySession();
  if (!session) throw new Error('Unauthenticated');

  try {
    const parsedData = createCustomerSchema.parse({
      first_name,
      last_name,
      email,
      picture,
    });
    const currentTime = BigInt(Math.floor(new Date().getTime() / 1000));
    let createData = {
      first_name,
      last_name,
      email,
      created_at: currentTime,
      updated_at: currentTime,
    };
    if (parsedData.picture) {
      createData.picture = parsedData.picture;
    }

    return await pjmeDBPrismaClient.Customer.create({
      data: createData,
      select: { id: true },
    });
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2002') {
      throw new DuplicateError('Email address is already associated with another customer.');
    }

    console.error(err);
    throw new UnknownError();
  }
}

export async function getCustomers({ select, pageIndex, pageSize, filters }) {
  const session = await verifySession();
  if (!session) throw new Error('Unauthenticated');

  try {
    const parsedFilters = filtersSchema.parse(filters);
    const customers = await pjmeDBPrismaClient.Customer.findMany({
      select,
      orderBy: { updated_at: 'desc' },
      take: pageSize,
      skip: pageSize * pageIndex,
      where: parsedFilters,
    });
    return customers.map(({ first_name: name, ...rest }) => {
      let newCustomer = { name, ...rest };
      if (rest.created_at) {
        newCustomer.created_at = rest.created_at.toString();
      }
      if (rest.updated_at) {
        newCustomer.updated_at = rest.updated_at.toString();
      }
      if (rest.last_active) {
        newCustomer.last_active = rest.last_active.toString();
      }
      return newCustomer;
    });
  } catch (err) {
    console.error(err);
    throw new UnknownError();   
  }
}

export const countCustomers = async (filters) => {
  try {
    const parsedFilters = filtersSchema.parse(filters);
    return await pjmeDBPrismaClient.Customer.count({
      where: parsedFilters,
    });
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function searchCustomers({ key, select, limit, filters }) {
  const session = await verifySession();
  if (!session) throw new Error('Unauthenticated');

  try {
    const parsedFilters = filtersSchema.parse(filters);
    const parsedKey = searchKeySchema.parse(key);
    const customers = await pjmeDBPrismaClient.Customer.findMany({
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
    return customers.map(({ first_name: name, ...rest }) => {
      let newCustomer = { name, ...rest };
      if (rest.created_at) {
        newCustomer.created_at = rest.created_at.toString();
      }
      if (rest.updated_at) {
        newCustomer.updated_at = rest.updated_at.toString();
      }
      if (rest.last_active) {
        newCustomer.last_active = rest.last_active.toString();
      }
      return newCustomer;
    });
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function getCustomer(
  id,
  select = {
    id: true,
    is_banned: true,
    first_name: true,
    last_name: true,
    email: true,
    phone_number: true,
    picture: true,
  },
  where = {},
) {
  const session = await verifySession();
  if (!session) throw new Error('Unauthenticated');

  const idResult = customerIdSchema.safeParse(id);
  if (!idResult.success) return null;
  const parsedId = idResult.data;

  try {
    return await pjmeDBPrismaClient.Customer.findUnique({
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
  first_name,
  last_name,
  email,
  picture,
}) {
  const session = await verifySession();
  if (!session) throw new Error('Unauthenticated');

  try {
    const parsedData = editCustomerSchema.parse({
      id,
      first_name,
      last_name,
      email,
      picture,
    });
    let updateData = {
      first_name: parsedData.first_name,
      last_name: parsedData.last_name,
      picture: parsedData.picture,
      updated_at: BigInt(Math.floor(new Date().getTime() / 1000)),
    };

    // check if update email or not, throw error or not
    const customerStatus = await pjmeDBPrismaClient.Customer.findUnique({
      where: { id: parsedData.id },
      select: { is_banned: true },
    });
    if (customerStatus) {
      if (customerStatus.is_banned && parsedData.email) {
        updateData.email = parsedData.email;
      } else if (!customerStatus.is_banned && parsedData.email) {
        // throw NotAllowedError
        throw new NotAllowedError('Email update is not allowed because customer is no longer banned.');
      }
    }

    /*
     * Scenario 1: is_banned = false && email = undefined >>> email not found in updateData [selesai]
     * Scenario 2: is_banned in frontend = false && email = undefined && is_banned from db = true >>>
     *             not found in updateData [selesai]
     * Scenario 3: is_banned in frontend = true && email != undefined && is_banned from db = false >>>
     *             throw error [selesai]
     * Scenario 4: is_banned in frontned = true && email != undefined && is_banned from db = true >>>
     *             email found in updateData [selesai]
    */

    const result = await pjmeDBPrismaClient.Customer.update({
      where: { id: parsedData.id },
      data: updateData,
      select: { id: true },
    });

    /*
     * Scenario 1: customer is_banned = false, tidak update email [selesai]
     * Scenario 2: customer is_banned = true, update email, tetapi tidak ada license-key terkait [selesai]
     * Scenario 3: customer is_banned = true, update email dan ada beberapa license-key terkait, email
     *             di license-key terkait terupdate semua [selesai]
    */
    // if email exist in updateData, update email in license-key too, where customer_id
    if (updateData.email) {
      await pjmaDBPrismaClient.LicenseKey.updateMany({
        where: { customer_id: parsedData.id },
        data: { email: updateData.email },
      });
    }
    return result;
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('Customer not found.');
    } else if (err.name === 'NotAllowedError') {
      throw err;
    }

    console.error(err);
    throw new UnknownError();
  }
}

export async function updateCustomerBanStatus(id, is_banned) {
  const session = await verifySession();
  if (!session) throw new Error('Unauthenticated');

  try {
    const parsedData = updateCustomerBanStatusSchema.parse({
      id,
      is_banned,
    });
    return await pjmeDBPrismaClient.Customer.update({
      where: { id: parsedData.id },
      data: {
        is_banned: parsedData.is_banned,
        updated_at: BigInt(Math.floor(new Date().getTime() / 1000)),
      },
      select: { id: true },
    });
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('Customer not found, please reload the page and try again.');
    }

    console.error(err);
    throw new UnknownError();
  }
}

export async function getCustomersForAutocomplete(key, limit = 10) {
  const session = await verifySession();
  if (!session) throw new Error('Unauthenticated');

  try {
    const parsedKey = searchKeySchema.parse(key);
    const customers = await pjmeDBPrismaClient.Customer.findMany({
      where: {
        email: {
          startsWith: parsedKey,
          mode: 'insensitive',
        },
        is_banned: false,
      },
      select: {
        id: true,
        first_name: true,
        email: true,
      },
      take: limit,
    });
    return customers.map(customer => ({
      id: customer.id,
      displayLabel: `${customer.first_name} (${customer.email})`,
    }));
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function deleteCustomer(id) {
  const session = await verifySession();
  if (!session) throw new Error('Unauthenticated');

  try {
    const parsedId = customerIdSchema.parse(id);
    const customer = await getCustomer(
      parsedId,
      {
        is_banned: true,
        oauth_id: true,
        last_active: true,
      },
    );
    const licenseKeyCount = await pjmaDBPrismaClient.LicenseKey.count({
      where: { customer_id: parsedId },
    });

    const currentTime = BigInt(Math.floor(new Date().getTime() / 1000));
    const thirtyDays = BigInt(60 * 60 * 24 * 30);
    const isInactive = !customer.last_active || currentTime - customer.last_active > thirtyDays;
    const hasLicenseKey = licenseKeyCount > 0;
    const isEligibleToDelete = ((!customer.oauth_id || isInactive) && !hasLicenseKey) || customer.is_banned;

    if (!isEligibleToDelete) {
      if (licenseKeyCount) {
        throw new NotAllowedError('Customer cannot be deleted because they have related license keys.');
      }
      throw new NotAllowedError('Customer is not eligible for deletion.');
    }

    // delete customer
    const result = await pjmeDBPrismaClient.Customer.delete({
      where: { id: parsedId },
      select: { id: true },
    });

    // delete license key that related to customer
    await pjmaDBPrismaClient.LicenseKey.deleteMany({
      where: { customer_id: parsedId },
    });
    
    return result;
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('Customer not found, please reload the page and try again.');
    } else if (err.name === 'NotAllowedError') {
      throw err;
    }

    console.error(err);
    throw new UnknownError();
  }
}
