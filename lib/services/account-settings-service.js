import 'server-only';

import UnknownError from '../errors/UnknownError';
import verifySession from '../verifySession';
import { accountSettingsSchema } from '../validators/account-settings-validator';
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
      },
    });
    account.firstName = session.userFirstName;
    account.lastName = session.userLastName;
    account.email = session.userEmail;
    account.picture = session.userPicture;

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
}) {
  const session = await verifySession();

  try {
    const parsedData = accountSettingsSchema.parse({
      firstName,
      lastName,
      whatsappPhoneNumber,
      picture,
    });

    const countryIso = parsedData.whatsappPhoneNumber.countryIso;
    const number = parsedData.whatsappPhoneNumber.number;
    const numberE164 = getPhoneNumberE164(countryIso, number);

    const currentTime = getUnixTimestamp();

    // build nested writes for update/create
    const updateData = {
      firstName: parsedData.firstName,
      lastName: parsedData.lastName,
      whatsappPhoneNumber: numberE164,
      picture: parsedData.picture,
      updatedAt: currentTime,
    };

    const result = await prisma.admin.update({
      where: { id: session.userId },
      data: updateData,
      select: { id: true },
    });
    
    // revalidate Router cache, Data cache and Full Route cache
    revalidatePath('/account-settings');

    return result;
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}
