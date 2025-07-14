import 'server-only';

import pjmeDBPrismaClient from '../pjme-prisma-client';
import verifySession from '../verifySession';
import UnknownError from '../errors/UnknownError';
import NotFoundError from '../errors/NotFoundError';
import { createCustomerSchema, filtersSchema } from '../validators/customer-validator';
import DuplicateError from '../errors/DuplicateError';

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

export async function getCustomers({ pageIndex, pageSize, filters }) {
  try {
    const parsedFilters = filtersSchema.parse(filters);
    const customers = await pjmeDBPrismaClient.Customer.findMany({
      select: {
        id: true,
        oauth_id: true,
        is_banned: true,
        first_name: true,
        email: true,
        last_active: true,
        created_at: true,
        updated_at: true,
      },
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
