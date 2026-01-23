import 'server-only';

import { mapTranslationsToObject } from '../utils';
import UnknownError from '../errors/UnknownError';
import verifySession from '../verifySession';
import { termsOfServiceSchema } from '../validators/terms-of-service-validator';
import { Language } from '@/constants/enums';
import { revalidatePath } from 'next/cache';
import prisma from '../prisma';

export async function getTermsOfService() {
  try {
    const termsOfService = await prisma.termsOfService.findFirst({
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
    if (termsOfService) {
      termsOfService.translations = mapTranslationsToObject(termsOfService.translations);
    }
    return termsOfService;
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function createTermsOfService({ content }) {
  await verifySession();

  try {
    const parsedData = termsOfServiceSchema.parse({ content });
    const currentTime = Math.floor(new Date().getTime() / 1000);
    const result = await prisma.termsOfService.create({
      data: {
        createdAt: currentTime,
        updatedAt: currentTime,
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
    result.createdAt = currentTime;
    result.updatedAt = currentTime;

    // revalidate Router cache, Data cache and Full Route cache
    revalidatePath('/terms-of-service');

    return result;
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function updateTermsOfService({
  id,
  translationId,
  content,
}) {
  await verifySession();

  try {
    const parsedData = termsOfServiceSchema.parse({
      id,
      translationId,
      content,
    });
    const updatedAt = Math.floor(new Date().getTime() / 1000);
    const result = await prisma.termsOfService.update({
      where: { id: parsedData.id, },
      data: {
        updatedAt: updatedAt,
        translations: {
          update: [
            {
              data: { content: parsedData.content.id },
              where: { id: parsedData.translationId.id },
            },
            {
              data: { content: parsedData.content.en },
              where: { id: parsedData.translationId.en },
            },
          ],
        },
      },
      select: { id: true },
    });
    result.updatedAt = updatedAt;

    // revalidate Router cache, Data cache and Full Route cache
    revalidatePath('/terms-of-service');

    return result;
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}
