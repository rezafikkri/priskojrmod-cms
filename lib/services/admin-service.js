import 'server-only';

import pjmeDBPrismaClient from '../pjme-prisma-client';
import verifySession from '../verifySession';
import UnknownError from '../errors/UnknownError';
import UnauthenticatedError from '../errors/UnauthenticatedError';
import NotAllowedError from '../errors/NotAllowedError';
import DuplicateError from '../errors/DuplicateError';
import { isOwnerAdmin } from '../utils';
import { Prisma } from '@/prisma-pjme-db/pjme-db-client';
import parsePhoneNumber from 'libphonenumber-js';
import { createAdminSchema } from '../validators/admin-validator';

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
    // transform phone number to E.164 format
    const parsedNumber = parsePhoneNumber(
      number,
      countryIso === 'OTHER' ? undefined : countryIso,
      { extract: false },
    );
    const numberE164 = parsedNumber.number;

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
