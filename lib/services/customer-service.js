import 'server-only';

import pjmeDBPrismaClient from '../pjme-prisma-client';
import verifySession from '../verifySession';
import UnknownError from '../errors/UnknownError';
import NotFoundError from '../errors/NotFoundError';
import { createCustomerSchema } from '../validators/customer-validator';
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
