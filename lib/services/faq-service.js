import 'server-only';

import { editFaqSchema, createFaqSchema, faqIdSchema } from '../validators/faq-validator';
import verifySession from '../verifySession';
import UnknownError from '../errors/UnknownError';
import NotFoundError from '../errors/NotFoundError';
import { mapTranslationsToObject } from '../utils';
import { Language } from '@/constants/enums';
import UnauthenticatedError from '../errors/UnauthenticatedError';
import { revalidatePath } from 'next/cache';
import prisma from '../prisma';

export async function createFaq({
  title,
  content,
}) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedData = createFaqSchema.parse({ title, content });
    const currentTime = Math.floor(new Date().getTime() / 1000);
    // insert into db
    const result = await prisma.faq.create({
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

    // revalidate Router cache, Data cache and Full Route cache
    revalidatePath('/faq');

    return result;
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

// faqs get data not need to verifySession
export async function getFaqs() {
  try {
    const faqs = await prisma.faq.findMany({
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
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedId = faqIdSchema.parse(id);
    const result = await prisma.faq.delete({
      where: { id: parsedId },
      select: { id: true },
    });

    // revalidate Router cache, Data cache and Full Route cache
    revalidatePath('/faq');

    return result;
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('FAQ not found. Please reload the page and try again.');
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
    const faq = await prisma.faq.findUnique({
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
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedData = editFaqSchema.parse({
      id,
      translationId,
      title,
      content,
    });
    const result = await prisma.faq.update({
      where: { id: parsedData.id },
      data: {
        updated_at: Math.floor(new Date().getTime() / 1000),
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

    // revalidate Router cache, Data cache and Full Route cache
    revalidatePath('/faq');

    return result;
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('FAQ not found');
    }

    console.error(err);
    throw new UnknownError();
  }
}
