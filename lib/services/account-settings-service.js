import 'server-only';

import UnknownError from '../errors/UnknownError';
import verifySession from '../verifySession';
import { accountSettingsSchema } from '../validators/account-settings-validator';
import { donationLinkIdSchema } from '../validators/admin-validator';
import parsePhoneNumber from 'libphonenumber-js';
import { getPhoneNumberE164, getUnixTimestamp } from '../utils';
import { revalidatePath } from 'next/cache';
import prisma from '../prisma';

export async function getAccount() {
  const session = await verifySession();

  try {
    const account = await prisma.admin.findUnique({
      where: { id: session.userId },
      select: {
        role: true,
        whatsappPhoneNumber: true,
        donationLinks: {
          select: {
            id: true,
            currencyCode: true,
            url: true,
          },
        },
      },
    });
    account.firstName = session.userFirstName;
    account.lastName = session.userLastName;
    account.email = session.userEmail;
    account.picture = session.userPicture;

    if (account.donationLinks) {
      account.donationLinks = account.donationLinks.map(({ id, ...rest }) => ({
        dbId: id,
        ...rest,
      }));
    }

    if (account.whatsappPhoneNumber) {
      // mapping whatsapp phone number
      const countryIso = parsePhoneNumber(account.whatsappPhoneNumber, { extract: false }).country;
      account.whatsappPhoneNumber = {
        countryIso: countryIso,
        number: account.whatsappPhoneNumber,
      };
    }

    return account;
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function updateAccount({
  firstName,
  lastName,
  whatsappPhoneNumber,
  picture,
  donationLinks,
}) {
  const session = await verifySession();

  try {
    const parsedData = accountSettingsSchema.parse({
      firstName,
      lastName,
      whatsappPhoneNumber,
      picture,
      donationLinks,
    });

    const countryIso = parsedData.whatsappPhoneNumber.countryIso;
    const number = parsedData.whatsappPhoneNumber.number;
    const numberE164 = getPhoneNumberE164(countryIso, number);

    const currentTime = getUnixTimestamp();

    // get items that have db id but empty url
    const toDeleteIds = parsedData.donationLinks
      .filter(dl => dl.dbId && dl.url === '')
      .map(dl => dl.dbId);

    // build nested writes for update/create
    const updateData = {
      firstName: parsedData.firstName,
      lastName: parsedData.lastName,
      whatsappPhoneNumber: numberE164,
      picture: parsedData.picture,
      updatedAt: currentTime,
    };

    const createDonationLinks = [];
    const updateDonationLinks = [];
    parsedData.donationLinks.forEach(dl => {
      // if empty url is empty, then skip
      if (dl.url === '') return;

      if (dl.dbId) {
        // update existing donation link
        updateDonationLinks.push({
          where: { id: dl.dbId },
          data: {
            currencyCode: dl.currencyCode,
            url: dl.url,
          },
        });
      } else {
        // create new donation link
        createDonationLinks.push({
          currencyCode: dl.currencyCode,
          url: dl.url,
        });
      }
    });

    if (createDonationLinks.length > 0) updateData.donationLinks = { create: createDonationLinks };
    if (updateDonationLinks.length > 0) updateData.donationLinks = {
      ...(updateData.donationLinks ?? {}),
      update: updateDonationLinks,
    };

    // update account and upsert donation links if exist
    let selectFields = { id: true };
    if (updateData.donationLinks) {
      selectFields.donationLinks = {
        select: {
          id: true,
          currencyCode: true,
          url: true,
        },
      };
    }

    const results = await prisma.$transaction([
      ...(toDeleteIds.length > 0
        ? [prisma.donationLink.deleteMany({
          where: { id: { in: toDeleteIds }, adminId: session.userId },
        })]
        : []),
      prisma.admin.update({
        where: { id: session.userId },
        data: updateData,
        select: selectFields,
      }),
    ]);
    const result = results[1] ?? results[0];

    if (result.donationLinks) {
      result.donationLinks = result.donationLinks.map(({ id, ...rest }) => ({
        dbId: id,
        ...rest,
      }));
    }

    // revalidate Router cache, Data cache and Full Route cache
    revalidatePath('/account-settings');

    return result;
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function deleteDonationLink(id) {
  const session = await verifySession();

  try {
    const parsedId = donationLinkIdSchema.parse(id);

    const results = await prisma.$transaction([
      prisma.donationLink.delete({
        where: { id: parsedId },
        select: { id: true },
      }),
      prisma.admin.update({
        where: { id: session.userId },
        data: {
          updatedAt: getUnixTimestamp(),
        },
        select: { id: true },
      }),
    ]);

    // revalidate Router cache, Data cache and Full Route cache
    revalidatePath('/account-settings');

    return results[0];
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}
