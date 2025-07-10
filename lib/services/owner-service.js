import 'server-only';

import pjmeDBPrismaClient from '../pjme-prisma-client';
import verifySession from '../verifySession';
import UnknownError from '../errors/UnknownError';
import NotFoundError from '../errors/NotFoundError';
import { createOwnerSchema, editOwnerSchema, ownerIdSchema } from '../validators/owner-validator';

export async function getOwners(
  select = {
    id: true,
    first_name: true,
    sm_username: true,
    created_at: true,
    updated_at: true,
  },
) {
  try {
    const owners = await pjmeDBPrismaClient.Owner.findMany({
      select,
      orderBy: { updated_at: 'desc' },
    });
    return owners.map(owner => {
      let newOwner = { ...owner };
      if (owner.created_at) {
        newOwner.created_at = owner.created_at.toString();
      }
      if (owner.updated_at) {
        newOwner.updated_at = owner.updated_at.toString();
      }
      return newOwner;
    });
  } catch (err) {
    console.error(err);
    throw new UnknownError();   
  }
}

export async function createOwner({
  first_name,
  last_name,
  sm_username,
  picture,
}) {
  const session = await verifySession();
  if (!session) throw new Error('Unauthenticated');

  try {
    const parsedData = createOwnerSchema.parse({
      first_name,
      last_name,
      sm_username,
      picture,
    });
    const currentTime = BigInt(Math.floor(new Date().getTime() / 1000));
    return await pjmeDBPrismaClient.Owner.create({
      data: {
        first_name: parsedData.first_name,
        last_name: parsedData.last_name,
        sm_username: parsedData.sm_username,
        picture: parsedData.picture,
        created_at: currentTime,
        updated_at: currentTime,
      },
      select: { id: true },
    });
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function deleteOwner(id) {
  const session = await verifySession();
  if (!session) throw new Error('Unauthenticated');

  try {
    const parsedId = ownerIdSchema.parse(id);
    return await pjmeDBPrismaClient.Owner.delete({
      where: { id: parsedId },
      select: { id: true },
    });
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('Owner not found, please reload the page and try again.');
    }

    console.error(err);
    throw new UnknownError();
  }
}

export async function getOwner(id) {
  const idResult = ownerIdSchema.safeParse(id);
  if(!idResult.success) return null;
  const parsedId = idResult.data;

  try {
    return await pjmeDBPrismaClient.Owner.findUnique({
      where: { id: parsedId },
      select: {
        id: true, 
        first_name: true,
        last_name: true,
        sm_username: true,
        picture: true,
      },
    });
  } catch (err) {
    console.error(err);
    throw new UnknownError();   
  }
}

export async function updateOwner({
  id,
  first_name,
  last_name,
  sm_username,
  picture,
}) {
  const session = await verifySession();
  if (!session) throw new Error('Unauthenticated');

  try {
    const parsedData = editOwnerSchema.parse({
      id,
      first_name,
      last_name,
      sm_username,
      picture,
    });
    return await pjmeDBPrismaClient.Owner.update({
      where: { id: parsedData.id },
      data: {
        first_name: parsedData.first_name,
        last_name: parsedData.last_name,
        sm_username: parsedData.sm_username,
        picture: parsedData.picture,
        updated_at: BigInt(Math.floor(new Date().getTime() / 1000)),
      },
      select: { id: true },
    });
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('Owner not found.');
    }   

    console.error(err);
    throw new UnknownError();   
  }
}
