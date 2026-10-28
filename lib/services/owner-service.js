import 'server-only';

import verifySession from '../verifySession';
import UnknownError from '../errors/UnknownError';
import NotFoundError from '../errors/NotFoundError';
import NotAllowedError from '../errors/NotAllowedError';
import {
  createOwnerSchema,
  donationLinkIdSchema,
  editOwnerSchema,
  ownerIdSchema,
} from '../validators/owner-validator';
import { revalidatePath } from 'next/cache';
import { extractSmIdentifier, generateNameIdentifierLabel, getUnixTimestamp } from '../utils';
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
      const smIdentifier = extractSmIdentifier(smProfileUrl);
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
  donationLinks,
}) {
  await verifySession();

  try {
    const parsedData = createOwnerSchema.parse({
      firstName,
      lastName,
      smProfileUrl,
      picture,
      donationLinks,
    });
    const currentTime = getUnixTimestamp();
    let createData = {
      firstName: parsedData.firstName,
      lastName: parsedData.lastName,
      smProfileUrl: parsedData.smProfileUrl,
      picture: parsedData.picture,
      createdAt: currentTime,
      updatedAt: currentTime,
      donationLinks: { create: [] },
    };

    parsedData.donationLinks.forEach(dl => {
      if (dl.url) {
        createData.donationLinks.create.push({
          currencyCode: dl.currencyCode,
          url: dl.url,
        });
      }
    });

    const result = await prisma.owner.create({
      data: createData,
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
        throw new NotFoundError('Failed to delete the owner because it was not found. Please reload the page and try again.');
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
    let owner = await prisma.owner.findUnique({
      where: { id: parsedId },
      select: {
        id: true, 
        firstName: true,
        lastName: true,
        smProfileUrl: true,
        picture: true,
        donationLinks: {
          select: {
            id: true,
            currencyCode: true,
            url: true,
          },
        },
      },
    });

    if (owner) {
      owner.donationLinks = owner.donationLinks.map(({ id, ...rest }) => ({
        dbId: id,
        ...rest,
      }));
    }

    return owner;
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
  donationLinks,
}) {
  await verifySession();

  try {
    const parsedData = editOwnerSchema.parse({
      id,
      firstName,
      lastName,
      smProfileUrl,
      picture,
      donationLinks,
    });
    let updateData = {
      firstName: parsedData.firstName,
      lastName: parsedData.lastName,
      smProfileUrl: parsedData.smProfileUrl,
      picture: parsedData.picture,
      updatedAt: getUnixTimestamp(),
      donationLinks: { upsert: [] },
    };

    parsedData.donationLinks.forEach(dl => {
      if (dl.dbId || dl.url) {
        const donationLinkFields = {
          currencyCode: dl.currencyCode,
          url: dl.url,
        };

        updateData.donationLinks.upsert.push({
          create: donationLinkFields,
          update: donationLinkFields,
          where: { id: dl.dbId ?? 0 },
        });
      }
    });

    const selectFields = { id: true };
    if (updateData.donationLinks.upsert.length > 0) {
      selectFields.donationLinks = {
        select: {
          id: true,
          currencyCode: true,
          url: true,
        },
      };
    }

    let result = await prisma.owner.update({
      where: { id: parsedData.id },
      data: updateData,
      select: selectFields,
    });

    if (result.donationLinks) {
      result.donationLinks = result.donationLinks.map(({ id, ...rest }) => ({
        dbId: id,
        ...rest,
      }));
    }

    // revalidate Router cache, Data cache and Full Route cache
    revalidatePath('/owner');
    revalidatePath('/product/new');

    return result;
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('Failed to update the owner because it was not found.');
    }   

    console.error(err);
    throw new UnknownError();   
  }
}

export async function deleteDonationLink(id, ownerId) {
  await verifySession();

  try {
    const parsedDonationLinkId = donationLinkIdSchema.parse(id);
    const parsedOwnerId = ownerIdSchema.parse(ownerId);

    // delete donation link
    const results = await prisma.$transaction([
      prisma.donationLink.delete({
        where: { id: parsedDonationLinkId, ownerId: parsedOwnerId },
        select: { id: true },
      }),
      prisma.owner.update({
        where: { id: parsedOwnerId },
        data: {
          updatedAt: getUnixTimestamp(),
        },
        select: { id: true },
      }),
    ]);

    // revalidate Router cache, Data cache and Full Route cache
    revalidatePath('/admin');

    return results[0];
  } catch (err) {
    // handle not found error
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('Failed to delete the donation link because it was not found. Please reload the page and try again.');
    }

    console.error(err);
    throw new UnknownError();
  }
}
