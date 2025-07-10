import 'server-only';

import pjmeDBPrismaClient from '../pjme-prisma-client';
import { mapTranslationsToObject } from '../utils';
import UnknownError from '../errors/UnknownError';
import verifySession from '../verifySession';
import { privacyPolicySchema } from '../validators/privacy-policy-validator';
import { Language } from '@/constants/enums';

export async function getPrivacyPolicy() {
  try {
    const privacyPolicy = await pjmeDBPrismaClient.PrivacyPolicy.findFirst({
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
    if (privacyPolicy) {
      privacyPolicy.translations = mapTranslationsToObject(privacyPolicy.translations);
      privacyPolicy.created_at = privacyPolicy.created_at.toString();
      privacyPolicy.updated_at = privacyPolicy.updated_at.toString();
    }
    return privacyPolicy;
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function createPrivacyPolicy({
  content,
}) {
  const session = await verifySession();
  if (!session) throw new Error('Unauthenticated');

  try {
    const parsedData = privacyPolicySchema.parse({ content });
    const currentTime = BigInt(Math.floor(new Date().getTime() / 1000));
    const result = await pjmeDBPrismaClient.PrivacyPolicy.create({
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
    result.created_at = currentTime.toString();
    result.updated_at = currentTime.toString();
    return result;
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function updatePrivacyPolicy({
  id,
  translationId,
  content,
}) {
  const session = await verifySession();
  if (!session) throw new Error('Unauthenticated');

  try {
    const parsedData = privacyPolicySchema.parse({
      id,
      translationId,
      content,
    });
    const updatedAt = BigInt(Math.floor(new Date().getTime() / 1000));
    const result = await pjmeDBPrismaClient.PrivacyPolicy.update({
      where: { id: parsedData.id },
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
    result.updated_at = updatedAt.toString();
    return result;
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}
