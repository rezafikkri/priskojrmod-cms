import 'server-only';

import pjmeDBPrismaClient from '../pjme-prisma-client';
import verifySession from '../verifySession';
import UnknownError from '../errors/UnknownError';
import NotFoundError from '../errors/NotFoundError';
import NotAllowedError from '../errors/NotAllowedError';
import { createOwnerSchema, editOwnerSchema, ownerIdSchema } from '../validators/owner-validator';
import UnauthenticatedError from '../errors/UnauthenticatedError';
import { revalidatePath } from 'next/cache';
import { extractSMIdentifier } from '../utils';

export async function getOwners({
  select = {
    id: true,
    picture: true,
    first_name: true,
    last_name: true,
    sm_profile_url: true,
    created_at: true,
    updated_at: true,
  },
  withDisplayLabel = false,
} = {}) {
  try {
    const owners = await pjmeDBPrismaClient.Owner.findMany({
      select,
      orderBy: { updated_at: 'desc' },
    });
    return owners.map(({ first_name, last_name, sm_profile_url, ...rest }) => {
      if (withDisplayLabel) {
        const smIdentifier = extractSMIdentifier(sm_profile_url);
        let name = `${first_name} ${last_name}`;

        if ((name.length + smIdentifier.length + 1) > 50) {
          name = `${first_name} ${last_name.charAt(0).toUpperCase()}.`;
        }

        rest.displayLabel = `${name} — ${smIdentifier}`;
      } else {
        rest.name = `${first_name} ${last_name}`;
        rest.sm_profile_url = sm_profile_url;
      }

      return rest;
    });
  } catch (err) {
    console.error(err);
    throw new UnknownError();   
  }
}

export async function createOwner({
  first_name,
  last_name,
  sm_profile_url,
  picture,
}) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedData = createOwnerSchema.parse({
      first_name,
      last_name,
      sm_profile_url,
      picture,
    });
    const currentTime = Math.floor(new Date().getTime() / 1000);
    const result = await pjmeDBPrismaClient.Owner.create({
      data: {
        first_name: parsedData.first_name,
        last_name: parsedData.last_name,
        sm_profile_url: parsedData.sm_profile_url,
        picture: parsedData.picture,
        created_at: currentTime,
        updated_at: currentTime,
      },
      select: { id: true },
    });

    // revalidate Router cache, Data cache and Full Route cache
    revalidatePath('/owner');
    revalidatePath('/product/new');

    return result;
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function deleteOwner(id) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedId = ownerIdSchema.parse(id);
    const result = await pjmeDBPrismaClient.Owner.delete({
      where: { id: parsedId },
      select: { id: true },
    });

    // revalidate Router cache, Data cache and Full Route cache
    revalidatePath('/owner');
    revalidatePath('/product/new');

    return result;
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError') {
      if (err.code === 'P2025') {
        throw new NotFoundError('Owner not found, please reload the page and try again.');
      }

      if (err.code === 'P2003') {
        throw new NotAllowedError('Owner cannot be deleted because there are still products owned by this owner.');
      }
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
        sm_profile_url: true,
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
  sm_profile_url,
  picture,
}) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedData = editOwnerSchema.parse({
      id,
      first_name,
      last_name,
      sm_profile_url,
      picture,
    });
    const result = await pjmeDBPrismaClient.Owner.update({
      where: { id: parsedData.id },
      data: {
        first_name: parsedData.first_name,
        last_name: parsedData.last_name,
        sm_profile_url: parsedData.sm_profile_url,
        picture: parsedData.picture,
        updated_at: Math.floor(new Date().getTime() / 1000),
      },
      select: { id: true },
    });

    // revalidate Router cache, Data cache and Full Route cache
    revalidatePath('/owner');
    revalidatePath('/product/new');

    return result;
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('Owner not found.');
    }   

    console.error(err);
    throw new UnknownError();   
  }
}
