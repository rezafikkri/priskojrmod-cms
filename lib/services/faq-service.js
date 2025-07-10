import 'server-only';

import { editFaqSchema, createFaqSchema, faqIdSchema } from '../validators/faq-validator';
import verifySession from '../verifySession';
import UnknownError from '../errors/UnknownError';
import NotFoundError from '../errors/NotFoundError';
import pjmeDBPrismaClient from '../pjme-prisma-client';
import { mapTranslationsToObject } from '../utils';
import { Language } from '@/constants/enums';

export async function createFaq({
  title,
  content,
}) {
  const session = await verifySession();
  if (!session) throw new Error('Unauthenticated');

  try {
    const parsedData = createFaqSchema.parse({ title, content });
    const currentTime = BigInt(Math.floor(new Date().getTime() / 1000));
    // insert into db
    return await pjmeDBPrismaClient.Faq.create({
      data: {
        created_at: currentTime,
        updated_at: currentTime,
        translations: {
          create: [
            { language: Language.ID, title: parsedData.title.id, content: parsedData.content.id },
            { language: Language.EN, title: parsedData.title.en, content: parsedData.content.en },
          ],
        },
      },
      select: {
        id: true,
      },
    });
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

// faqs get data not need to verifySession
export async function getFaqs() {
  try {
    const faqs = await pjmeDBPrismaClient.Faq.findMany({
      include: {
        translations: {
          select: {
            language: true,
            title: true,
          },
        },
      },
      orderBy: {
        updated_at: 'desc',
      },
    });
    return faqs.map(faq => {
      let newFaq = {
        ...faq,
        created_at: faq.created_at.toString(),
        updated_at: faq.updated_at.toString(),
        translations: mapTranslationsToObject(faq.translations),
      };
      return newFaq;
    });
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function deleteFaq(id) {
  const session = await verifySession();
  if (!session) throw new Error('Unauthenticated');

  try {
    const parsedId = faqIdSchema.parse(id);
    return await pjmeDBPrismaClient.Faq.delete({
      where: { id: parsedId },
      select: { id: true },
    });
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('FAQ not found, please reload the page and try again.');
    }

    console.error(err);
    throw new UnknownError();
  }
}

export async function getFaq(id) {
  const idResult = faqIdSchema.safeParse(id);
  if(!idResult.success) return null;
  const parsedId = idResult.data;

  try {
    const faq = await pjmeDBPrismaClient.Faq.findUnique({
      where: { id: parsedId },
      select: {
        id: true,
        translations: {
          select: {
            id: true,
            language: true,
            title: true,
            content: true,
          },
        },
      },
    });
    // if faq exist
    if (faq) {
      faq.translations = mapTranslationsToObject(faq.translations);
    }
    return faq;
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function updateFaq({
  id,
  translationId,
  title,
  content,
}) {
  const session = await verifySession();
  if (!session) throw new Error('Unauthenticated');

  try {
    const parsedData = editFaqSchema.parse({
      id,
      translationId,
      title,
      content,
    });
    return await pjmeDBPrismaClient.Faq.update({
      where: { id: parsedData.id },
      data: {
        updated_at: BigInt(Math.floor(new Date().getTime() / 1000)),
        translations: {
          update: [
            {
              data: { title: parsedData.title.id, content: parsedData.content.id },
              where: { id: parsedData.translationId.id },
            },
            {
              data: { title: parsedData.title.en, content: parsedData.content.en },
              where: { id: parsedData.translationId.en },
            },
          ],
        },
      },
      select: { id: true },
    });
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('FAQ not found.');
    }

    console.error(err);
    throw new UnknownError();
  }
}
