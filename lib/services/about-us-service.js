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
            office_hours: true,
          },
        },
      },
    });
    if (aboutUs) {
      aboutUs.translations = mapTranslationsToObject(aboutUs.translations);

      // mapping support whatsapp
      const countryIso = parsePhoneNumber(aboutUs.support_whatsapp, { extract: false }).country;
      aboutUs.support_whatsapp = {
        country_iso: countryIso,
        number: aboutUs.support_whatsapp,
      };
    }
    return aboutUs;
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function createAboutUs({
  support_email,
  support_whatsapp,
  office_hours,
  content,
}) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedData = aboutUsSchema.parse({
      support_email,
      support_whatsapp,
      office_hours,
      content,
    });

    const countryIso = parsedData.support_whatsapp.country_iso;
    const number = parsedData.support_whatsapp.number;
    const numberE164 = getPhoneNumberE164(countryIso, number);

    const result = await prisma.aboutUs.create({
      data: {
        support_email: parsedData.support_email,
        support_whatsapp: numberE164,
        translations: {
          create: [
            {
              language: Language.ID,
              content: parsedData.content.id,
              office_hours: parsedData.office_hours.id,
            },
            {
              language: Language.EN,
              content: parsedData.content.en,
              office_hours: parsedData.office_hours.en,
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
  support_email,
  support_whatsapp,
  office_hours,
  content,
}) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedData = aboutUsSchema.parse({
      id,
      translationId,
      support_email,
      support_whatsapp,
      office_hours,
      content,
    });

    const countryIso = parsedData.support_whatsapp.country_iso;
    const number = parsedData.support_whatsapp.number;
    const numberE164 = getPhoneNumberE164(countryIso, number);

    const result = prisma.aboutUs.update({
      where: { id: parsedData.id },
      data: {
        support_email: parsedData.support_email,
        support_whatsapp: numberE164,
        translations: {
          update: [
            {
              data: {
                content: parsedData.content.id,
                office_hours: parsedData.office_hours.id,
              },
              where: { id: parsedData.translationId.id },
            },
            {
              data: {
                content: parsedData.content.en,
                office_hours: parsedData.office_hours.en,
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
