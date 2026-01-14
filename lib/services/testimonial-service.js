import 'server-only';

import UnknownError from '../errors/UnknownError';
import verifySession from '../verifySession';
import { Language } from '@/constants/enums';
import NotAllowedError from '../errors/NotAllowedError';
import {
  createTestimonialSchema,
  testimonialIdSchema,
  editTestimonialSchema,
} from '../validators/testimonial-validator';
import { mapTranslationsToObject } from '../utils';
import UnauthenticatedError from '../errors/UnauthenticatedError';
import { revalidatePath } from 'next/cache';
import prisma from '../prisma';

export async function getTestimonials() {
  try {
    return await prisma.testimonial.findMany({
      select: {
        id: true,
        name: true,
        picture: true,
        smProfileUrl: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function createTestimonial({
  name,
  smProfileUrl,
  picture,
  message,
}) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedData = createTestimonialSchema.parse({
      name,
      smProfileUrl,
      picture,
      message,
    });

    const testimonialCount = await prisma.testimonial.count();
    if (testimonialCount >= 6) {
      throw new NotAllowedError('Maximum number of testimonials (6) reached');
    }

    const currentTime = Math.floor(new Date().getTime() / 1000);

    const result = await prisma.testimonial.create({
      data: {
        name: parsedData.name,
        smProfileUrl: parsedData.smProfileUrl,
        picture: parsedData.picture,
        createdAt: currentTime,
        updatedAt: currentTime,
        translations: {
          create: [
            {
              language: Language.ID,
              message: parsedData.message.id,
            },
            {
              language: Language.EN,
              message: parsedData.message.en,
            },
          ],
        },
      },
      select: {
        id: true,
      },
    });

    // revalidate Router cache, Data cache and Full Route cache
    revalidatePath('/testimonial');

    return result;
  } catch (err) {
    if (err.name === 'NotAllowedError') {
      throw err;
    }

    console.error(err);
    throw new UnknownError();
  }
}

export async function getTestimonial(id) {
  const idResult = testimonialIdSchema.safeParse(id);
  if (!idResult.success) return null;
  const parsedId = idResult.data;

  try {
    const testimonial = await prisma.testimonial.findUnique({
      where: { id: parsedId },
      select: {
        id: true,
        name: true,
        picture: true,
        smProfileUrl: true,
        createdAt: true,
        updatedAt: true,
        translations: {
          select: {
            id: true,
            language: true,
            message: true,
          },
        },
      },
    });

    if (testimonial) {
      testimonial.translations = mapTranslationsToObject(testimonial.translations);
    }

    return testimonial;
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function updateTestimonial({
  id,
  name,
  smProfileUrl,
  picture,
  translationId,
  message,
}) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedData = editTestimonialSchema.parse({
      id,
      name,
      smProfileUrl,
      picture,
      translationId,
      message,
    });

    const result = await prisma.testimonial.update({
      where: { id: parsedData.id },
      data: {
        name: parsedData.name,
        smProfileUrl: parsedData.smProfileUrl,
        picture: parsedData.picture,
        updatedAt: Math.floor(new Date().getTime() / 1000),
        translations: {
          update: [
            {
              where: { id: parsedData.translationId.id },
              data: { message: parsedData.message.id },
            },
            {
              where: { id: parsedData.translationId.en },
              data: { message: parsedData.message.en },
            },
          ],
        },
      },
      select: { id: true },
    });

    // revalidate Router cache, Data cache and Full Route cache
    revalidatePath('/testimonial');

    return result;
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}
