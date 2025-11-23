import 'server-only';

import pjmeDBPrismaClient from '../pjme-prisma-client';
import verifySession from '../verifySession';
import UnknownError from '../errors/UnknownError';
import UnauthenticatedError from '../errors/UnauthenticatedError';
import NotAllowedError from '../errors/NotAllowedError';
import DuplicateError from '../errors/DuplicateError';
import NotFoundError from '../errors/NotFoundError';
import { isOwnerAdmin } from '../utils';
import parsePhoneNumber from 'libphonenumber-js';
import { createAdminSchema, adminIdSchema, editAdminSchema } from '../validators/admin-validator';
import { donationLinkIdSchema } from '../validators/admin-validator';
import { AdminRole } from '@/constants/enums';
import { revalidatePath } from 'next/cache';

export async function getAdmins() {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  const isOwner = isOwnerAdmin(session.userRole);
  if (!isOwner) throw new NotAllowedError();

  try {
    const admins = await pjmeDBPrismaClient.Admin.findMany({
      where: { id: { not: session.userId } },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        picture: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { updated_at: 'desc' },
    });

    return admins.map(admin => ({
      ...admin,
      name: `${admin.first_name} ${admin.last_name}`,
    }));
  } catch (error) {
    console.error(error);
    throw new UnknownError();
  }
}

export function getPhoneNumberE164(countryIso, number) {
  // get phone number E.164 format
  const parsedNumber = parsePhoneNumber(
    number,
    countryIso === 'OTHER' ? undefined : countryIso,
    { extract: false },
  );
  return parsedNumber.number;
}

export async function createAdmin({
  first_name,
  last_name,
  email,
  whatsapp_phone_number,
  picture,
  donation_links,
}) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  const isOwner = isOwnerAdmin(session.userRole);
  if (!isOwner) throw new NotAllowedError();

  try {
    const parsedData = createAdminSchema.parse({
      first_name,
      last_name,
      email,
      whatsapp_phone_number,
      picture,
      donation_links,
    });

    const countryIso = parsedData.whatsapp_phone_number.country_iso;
    const number = parsedData.whatsapp_phone_number.number;
    const numberE164 = getPhoneNumberE164(countryIso, number);

    const currentTime = Math.floor(new Date().getTime() / 1000);
    const createData = {
      role: 'staff',
      first_name: parsedData.first_name,
      last_name: parsedData.last_name,
      email: parsedData.email,
      whatsapp_phone_number: numberE164,
      picture: parsedData.picture,
      created_at: currentTime,
      updated_at: currentTime,
    };

    // nested donation links (only if link !== '')
    if (parsedData.donation_links[0].link !== '') {
      createData.donation_links = {
        create: [
          {
            currency_code: parsedData.donation_links[0].currency_code,
            link: parsedData.donation_links[0].link,
          },
        ],
      };
    }
    if (parsedData.donation_links[1].link !== '') {
      createData.donation_links = {
        create: [
          ...(createData.donation_links?.create ?? []),
          {
            currency_code: parsedData.donation_links[1].currency_code,
            link: parsedData.donation_links[1].link,
          },
        ],
      };
    }

    // revalidate Router cache, Data cache and Full Route cache
    revalidatePath('/admin');

    return await pjmeDBPrismaClient.Admin.create({
      data: createData,
      select: { id: true },
    });
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2002') {
      throw new DuplicateError('Email address is already associated with another admin.');
    }

    console.error(err);
    throw new UnknownError();
  }
}

export async function getAdmin(id) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  const isOwner = isOwnerAdmin(session.userRole);
  if (!isOwner) throw new NotAllowedError();

  const idResult = adminIdSchema.safeParse(id);
  if (!idResult.success) return null;
  const parsedId = idResult.data;

  try {
    const admin = await pjmeDBPrismaClient.Admin.findUnique({
      where: { id: parsedId },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        whatsapp_phone_number: true,
        picture: true,
        role: true,
        donation_links: {
          select: {
            id: true,
            currency_code: true,
            link: true,
          },
        },
      },
    });

    if (admin) {
      admin.donation_links = admin.donation_links.map(({ id, ...rest }) => ({
        dbId: id,
        ...rest,
      }));
      // mapping whatsapp phone number
      const countryIso = parsePhoneNumber(admin.whatsapp_phone_number, { extract: false }).country;
      admin.whatsapp_phone_number = {
        country_iso: countryIso,
        number: admin.whatsapp_phone_number,
      };
    }

    return admin;
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function updateAdmin({
  id,
  first_name,
  last_name,
  whatsapp_phone_number,
  picture,
  donation_links,
}) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  const isOwner = isOwnerAdmin(session.userRole);
  if (!isOwner) throw new NotAllowedError();

  try {
    const parsedData = editAdminSchema.parse({
      id,
      first_name,
      last_name,
      whatsapp_phone_number,
      picture,
      donation_links,
    });

    const countryIso = parsedData.whatsapp_phone_number.country_iso;
    const number = parsedData.whatsapp_phone_number.number;
    const numberE164 = getPhoneNumberE164(countryIso, number);

    const currentTime = Math.floor(new Date().getTime() / 1000);

    // get items that have db id but empty link
    const toDeleteIds = parsedData.donation_links
      .filter(dl => dl.dbId && dl.link === '')
      .map(dl => dl.dbId);

    // build nested writes for update/create
    const updateData = {
      first_name: parsedData.first_name,
      last_name: parsedData.last_name,
      whatsapp_phone_number: numberE164,
      picture: parsedData.picture,
      updated_at: currentTime,
    };

    const createDonationLinks = [];
    const updateDonationLinks = [];
    parsedData.donation_links.forEach(dl => {
      // if empty links or dbId exist and link is empty, then skip
      if (dl.link === '') return;

      if (dl.dbId) {
        // update existing donation link
        updateDonationLinks.push({
          where: { id: dl.dbId },
          data: {
            currency_code: dl.currency_code,
            link: dl.link,
          },
        });
      } else {
        // create new donation link
        createDonationLinks.push({
          currency_code: dl.currency_code,
          link: dl.link,
        });
      }
    });

    if (createDonationLinks.length > 0) updateData.donation_links = { create: createDonationLinks };
    if (updateDonationLinks.length > 0) updateData.donation_links = {
      ...(updateData.donation_links ?? {}),
      update: updateDonationLinks,
    };

    const selectFields = { id: true };
    if (updateData.donation_links) {
      selectFields.donation_links = {
        select: {
          id: true,
          currency_code: true,
          link: true,
        },
      };
    }

    const results = await pjmeDBPrismaClient.$transaction([
      ...(toDeleteIds.length > 0
        ? [pjmeDBPrismaClient.DonationLink.deleteMany({ where: { id: { in: toDeleteIds } } })]
        : []),
      pjmeDBPrismaClient.Admin.update({
        where: { id: parsedData.id },
        data: updateData,
        select: selectFields,
      }),
    ]);
    const result = results[1] ?? results[0];

    if (result.donation_links) {
      result.donation_links = result.donation_links.map(({ id, ...rest }) => ({
        dbId: id,
        ...rest,
      }));
    }

    // revalidate Router cache, Data cache and Full Route cache
    revalidatePath('/admin');

    return result;
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function deleteAdmin(id) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  const isOwner = isOwnerAdmin(session.userRole);
  if (!isOwner) throw new NotAllowedError();

  try {
    const parsedId = adminIdSchema.parse(id);

    // delete admin but never allow deleting an owner
    const result = await pjmeDBPrismaClient.Admin.delete({
      where: {
        id: parsedId,
        role: { not: AdminRole.OWNER },
      },
      select: { id: true },
    });

    // revalidate Router cache, Data cache and Full Route cache
    revalidatePath('/admin');

    return result;
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('Admin not found, please reload the page and try again.');
    }

    console.error(err);
    throw new UnknownError();
  }
}

export async function deleteDonationLink(id, adminId) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  const isOwner = isOwnerAdmin(session.userRole);
  if (!isOwner) throw new NotAllowedError();

  try {
    const parsedDonationLinkId = donationLinkIdSchema.parse(id);
    const parsedAdminId = adminIdSchema.parse(adminId);

    // delete donation link
    const results = await pjmeDBPrismaClient.$transaction([
      pjmeDBPrismaClient.DonationLink.delete({
        where: { id: parsedDonationLinkId },
        select: { id: true },
      }),
      pjmeDBPrismaClient.Admin.update({
        where: { id: parsedAdminId },
        data: {
          updated_at: Math.floor(new Date().getTime() / 1000),
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
      throw new NotFoundError('Donation link not found, please reload the page and try again.');
    }

    console.error(err);
    throw new UnknownError();
  }
}
