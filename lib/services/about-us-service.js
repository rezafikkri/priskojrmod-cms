import 'server-only';

import pjmeDBPrismaClient from '../pjme-prisma-client';
import { mapTranslationsToObject } from '../utils';
import { aboutUsSchema } from '../validators/about-us-validator';
import verifySession from '../verifySession';
import UnknownError from '../errors/UnknownError';
import { Language } from '@/constants/enums';
import UnauthenticatedError from '../errors/UnauthenticatedError';

export async function getAboutUs() {
  try {
    const aboutUs = await pjmeDBPrismaClient.AboutUs.findFirst({
      include: {
        translations: {
          select: {
            id: true,
            language: true,
            content: true,
          },
        },
      },
    });
    if (aboutUs) {
      aboutUs.translations = mapTranslationsToObject(aboutUs.translations);
    }
    return aboutUs;
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function createAboutUs({ content }) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedData = aboutUsSchema.parse({ content });
    const result = await pjmeDBPrismaClient.AboutUs.create({
      data: {
        translations: {
          create: [
            { language: Language.ID, content: parsedData.content.id },
            { language: Language.EN, content: parsedData.content.en },
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
    return result;
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function updateAboutUs({
  id,
  translationId,
  content,
}) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedData = aboutUsSchema.parse({
      id,
      translationId,
      content,
    });
    return await pjmeDBPrismaClient.$transaction([
      pjmeDBPrismaClient.AboutUsTranslation.update({
        where: { id: parsedData.translationId.id, about_us_id: parsedData.id },
        data: { content: parsedData.content.id },
        select: { id: true },
      }),
      pjmeDBPrismaClient.AboutUsTranslation.update({
        where: { id: parsedData.translationId.en, about_us_id: parsedData.id },
        data: { content: parsedData.content.en },
        select: { id: true },
      }),
    ]);
  } catch (err) {
    console.error(err);
    throw new UnknownError();   
  }
}
