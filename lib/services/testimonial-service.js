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
        sm_profile_url: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { updated_at: 'desc' },
    });
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function createTestimonial({
  name,
  sm_profile_url,
  picture,
  message,
}) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedData = createTestimonialSchema.parse({
      name,
      sm_profile_url,
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
        sm_profile_url: parsedData.sm_profile_url,
        picture: parsedData.picture,
        created_at: currentTime,
        updated_at: currentTime,
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
        sm_profile_url: true,
        created_at: true,
        updated_at: true,
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
  sm_profile_url,
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
      sm_profile_url,
      picture,
      translationId,
      message,
    });

    const result = await prisma.testimonial.update({
      where: { id: parsedData.id },
      data: {
        name: parsedData.name,
        sm_profile_url: parsedData.sm_profile_url,
        picture: parsedData.picture,
        updated_at: Math.floor(new Date().getTime() / 1000),
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
