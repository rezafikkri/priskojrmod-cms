import 'server-only';

import pjmeDBPrismaClient from '../pjme-prisma-client';
import UnknownError from '../errors/UnknownError';
import verifySession from '../verifySession';
import { accountSettingsSchema } from '../validators/account-settings-validator';
import { donationLinkIdSchema } from '../validators/admin-validator';
import UnauthenticatedError from '../errors/UnauthenticatedError';
import parsePhoneNumber from 'libphonenumber-js';
import { getPhoneNumberE164 } from './admin-service';

export async function getAccount(
  select = {
    role: true,
    last_name: true,
    whatsapp_phone_number: true,
    donation_links: {
      select: {
        id: true,
        currency_code: true,
        link: true,
      },
    },
  },
) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const account = await pjmeDBPrismaClient.Admin.findUnique({
      where: { id: session.userId },
      select,
    });
    account.first_name = session.userName;
    account.email = session.userEmail;
    account.picture = session.userPicture;

    if (account.donation_links) {
      account.donation_links = account.donation_links.map(({ id, ...rest }) => ({
        dbId: id,
        ...rest,
      }));
    }

    if (account.whatsapp_phone_number) {
      // mapping whatsapp phone number
      const countryIso = parsePhoneNumber(account.whatsapp_phone_number, { extract: false }).country;
      account.whatsapp_phone_number = {
        country_iso: countryIso,
        number: account.whatsapp_phone_number,
      };
    }

    return account;
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function updateAccount({
  first_name,
  last_name,
  whatsapp_phone_number,
  picture,
  donation_links,
}) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedData = accountSettingsSchema.parse({
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

    // update account and upsert donation links if exist
    let selectFields = { id: true };
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
        ? [pjmeDBPrismaClient.DonationLink.deleteMany({
          where: { id: { in: toDeleteIds }, admin_id: session.userId },
        })]
        : []),
      pjmeDBPrismaClient.Admin.update({
        where: { id: session.userId },
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

    return result;
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function deleteDonationLink(id) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedId = donationLinkIdSchema.parse(id);

    const results = await pjmeDBPrismaClient.$transaction([
      pjmeDBPrismaClient.DonationLink.delete({
        where: { id: parsedId },
        select: { id: true },
      }),
      pjmeDBPrismaClient.Admin.update({
        where: { id: session.userId },
        data: {
          updated_at: Math.floor(new Date().getTime() / 1000),
        },
        select: { id: true },
      }),
    ]);

    return results[0];
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}
