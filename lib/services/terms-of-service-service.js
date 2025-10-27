import 'server-only';

import pjmeDBPrismaClient from '../pjme-prisma-client';
import { mapTranslationsToObject } from '../utils';
import UnknownError from '../errors/UnknownError';
import verifySession from '../verifySession';
import { termsOfServiceSchema } from '../validators/terms-of-service-validator';
import { Language } from '@/constants/enums';
import UnauthenticatedError from '../errors/UnauthenticatedError';

export async function getTermsOfService() {
  try {
    const termsOfService = await pjmeDBPrismaClient.TermsOfService.findFirst({
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
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedData = termsOfServiceSchema.parse({ content });
    const currentTime = Math.floor(new Date().getTime() / 1000);
    const result = await pjmeDBPrismaClient.TermsOfService.create({
      data: {
        created_at: currentTime,
        updated_at: currentTime,
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
    result.created_at = currentTime;
    result.updated_at = currentTime;
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
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedData = termsOfServiceSchema.parse({
      id,
      translationId,
      content,
    });
    const updatedAt = Math.floor(new Date().getTime() / 1000);
    const result = await pjmeDBPrismaClient.TermsOfService.update({
      where: { id: parsedData.id, },
      data: {
        updated_at: updatedAt,
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
    result.updated_at = updatedAt;
    return result;
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}
