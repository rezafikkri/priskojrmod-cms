import 'server-only';

import { mapTranslationsToObject } from '../utils';
import UnknownError from '../errors/UnknownError';
import verifySession from '../verifySession';
import { privacyPolicySchema } from '../validators/privacy-policy-validator';
import { Language } from '@/constants/enums';
import { revalidatePath } from 'next/cache';
import prisma from '../prisma';

export async function getPrivacyPolicy() {
  try {
    const privacyPolicy = await prisma.privacyPolicy.findFirst({
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
  await verifySession();

  try {
    const parsedData = privacyPolicySchema.parse({ content });
    const currentTime = Math.floor(new Date().getTime() / 1000);
    const result = await prisma.privacyPolicy.create({
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
    revalidatePath('/privacy-policy');

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
  await verifySession();

  try {
    const parsedData = privacyPolicySchema.parse({
      id,
      translationId,
      content,
    });
    const updatedAt = Math.floor(new Date().getTime() / 1000);
    const result = await prisma.privacyPolicy.update({
      where: { id: parsedData.id },
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
    revalidatePath('/privacy-policy');

    return result;
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}
