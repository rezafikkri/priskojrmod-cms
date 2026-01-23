import 'server-only';

import verifySession from '../verifySession';
import UnknownError from '../errors/UnknownError';
import NotFoundError from '../errors/NotFoundError';
import NotAllowedError from '../errors/NotAllowedError';
import { createOwnerSchema, editOwnerSchema, ownerIdSchema } from '../validators/owner-validator';
import { revalidatePath } from 'next/cache';
import { extractSMIdentifier, generateNameIdentifierLabel } from '../utils';
import prisma from '../prisma';

export async function getOwners() {
  try {
    const owners = await prisma.owner.findMany({
      select: {
        id: true,
        picture: true,
        firstName: true,
        lastName: true,
        smProfileUrl: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
    return owners.map(({ firstName, lastName, smProfileUrl, ...rest }) => {
      rest.name = `${firstName} ${lastName}`;
      rest.smProfileUrl = smProfileUrl;
      return rest;
    });
  } catch (err) {
    console.error(err);
    throw new UnknownError();   
  }
}

export async function getSelectableOwners() {
  try {
    const owners = await prisma.owner.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        smProfileUrl: true,
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' },
      ]
    });
    return owners.map(({ firstName, lastName, smProfileUrl, ...rest }) => {
      const smIdentifier = extractSMIdentifier(smProfileUrl);
      rest.displayLabel = generateNameIdentifierLabel(firstName, lastName, smIdentifier);
      return rest;
    });
  } catch (err) {
    console.error(err);
    throw new UnknownError();   
  }
}

export async function createOwner({
  firstName,
  lastName,
  smProfileUrl,
  picture,
}) {
  await verifySession();

  try {
    const parsedData = createOwnerSchema.parse({
      firstName,
      lastName,
      smProfileUrl,
      picture,
    });
    const currentTime = Math.floor(new Date().getTime() / 1000);
    const result = await prisma.owner.create({
      data: {
        firstName: parsedData.firstName,
        lastName: parsedData.lastName,
        smProfileUrl: parsedData.smProfileUrl,
        picture: parsedData.picture,
        createdAt: currentTime,
        updatedAt: currentTime,
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
  await verifySession();

  try {
    const parsedId = ownerIdSchema.parse(id);
    const result = await prisma.owner.delete({
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
        throw new NotFoundError('Owner not found. Please reload the page and try again.');
      }

      if (err.code === 'P2003') {
        throw new NotAllowedError('Owner cannot be deleted because there are still products owned by this owner');
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
    return await prisma.owner.findUnique({
      where: { id: parsedId },
      select: {
        id: true, 
        firstName: true,
        lastName: true,
        smProfileUrl: true,
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
  firstName,
  lastName,
  smProfileUrl,
  picture,
}) {
  await verifySession();

  try {
    const parsedData = editOwnerSchema.parse({
      id,
      firstName,
      lastName,
      smProfileUrl,
      picture,
    });
    const result = await prisma.owner.update({
      where: { id: parsedData.id },
      data: {
        firstName: parsedData.firstName,
        lastName: parsedData.lastName,
        smProfileUrl: parsedData.smProfileUrl,
        picture: parsedData.picture,
        updatedAt: Math.floor(new Date().getTime() / 1000),
      },
      select: { id: true },
    });

    // revalidate Router cache, Data cache and Full Route cache
    revalidatePath('/owner');
    revalidatePath('/product/new');

    return result;
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('Owner not found');
    }   

    console.error(err);
    throw new UnknownError();   
  }
}
