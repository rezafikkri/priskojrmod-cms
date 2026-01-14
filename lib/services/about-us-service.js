import 'server-only';

import { mapTranslationsToObject } from '../utils';
import { aboutUsSchema } from '../validators/about-us-validator';
import verifySession from '../verifySession';
import UnknownError from '../errors/UnknownError';
import { Language } from '@/constants/enums';
import UnauthenticatedError from '../errors/UnauthenticatedError';
import { revalidatePath } from 'next/cache';
import { getPhoneNumberE164 } from '../utils';
import parsePhoneNumber from 'libphonenumber-js';
import prisma from '../prisma';

export async function getAboutUs() {
  try {
    const aboutUs = await prisma.aboutUs.findFirst({
      include: {
        translations: {
          select: {
            id: true,
            language: true,
            content: true,
            officeHours: true,
          },
        },
      },
    });
    if (aboutUs) {
      aboutUs.translations = mapTranslationsToObject(aboutUs.translations);

      // mapping support whatsapp
      const countryIso = parsePhoneNumber(aboutUs.supportWhatsapp, { extract: false }).country;
      aboutUs.supportWhatsapp = {
        countryIso: countryIso,
        number: aboutUs.supportWhatsapp,
      };
    }
    return aboutUs;
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function createAboutUs({
  supportEmail,
  supportWhatsapp,
  officeHours,
  content,
}) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedData = aboutUsSchema.parse({
      supportEmail,
      supportWhatsapp,
      officeHours,
      content,
    });

    const countryIso = parsedData.supportWhatsapp.countryIso;
    const number = parsedData.supportWhatsapp.number;
    const numberE164 = getPhoneNumberE164(countryIso, number);

    const result = await prisma.aboutUs.create({
      data: {
        supportEmail: parsedData.supportEmail,
        supportWhatsapp: numberE164,
        translations: {
          create: [
            {
              language: Language.ID,
              content: parsedData.content.id,
              officeHours: parsedData.officeHours.id,
            },
            {
              language: Language.EN,
              content: parsedData.content.en,
              officeHours: parsedData.officeHours.en,
            },
          ],
        },
      },
      select: {
        id: true,
        translations: {
          select: {
            id: true,
            language: true,
          },
        },
      },
    });
    result.translations = mapTranslationsToObject(result.translations);

    // revalidate Router cache, Data cache and Full Route cache
    revalidatePath('/about-us');

    return result;
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function updateAboutUs({
  id,
  translationId,
  supportEmail,
  supportWhatsapp,
  officeHours,
  content,
}) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedData = aboutUsSchema.parse({
      id,
      translationId,
      supportEmail,
      supportWhatsapp,
      officeHours,
      content,
    });

    const countryIso = parsedData.supportWhatsapp.countryIso;
    const number = parsedData.supportWhatsapp.number;
    const numberE164 = getPhoneNumberE164(countryIso, number);

    const result = prisma.aboutUs.update({
      where: { id: parsedData.id },
      data: {
        supportEmail: parsedData.supportEmail,
        supportWhatsapp: numberE164,
        translations: {
          update: [
            {
              data: {
                content: parsedData.content.id,
                officeHours: parsedData.officeHours.id,
              },
              where: { id: parsedData.translationId.id },
            },
            {
              data: {
                content: parsedData.content.en,
                officeHours: parsedData.officeHours.en,
              },
              where: { id: parsedData.translationId.en },
            },
          ],
        },
      },
      select: { id: true },
    });

    // revalidate Router cache, Data cache and Full Route cache
    revalidatePath('/about-us');

    return result;
  } catch (err) {
    console.error(err);
    throw new UnknownError();   
  }
}
