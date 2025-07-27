import 'server-only';

import pjmeDBPrismaClient from '../pjme-prisma-client';
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

export async function getTestimonials() {
  try {
    const testimonials = await pjmeDBPrismaClient.Testimonial.findMany({
      select: {
        id: true,
        name: true,
        sm_username: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { updated_at: 'desc' },
    });

    return testimonials.map((testimonial) => ({
      ...testimonial,
      created_at: testimonial.created_at?.toString(),
      updated_at: testimonial.updated_at?.toString(),
    }));
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function createTestimonial({
  name,
  sm_username,
  picture,
  message,
}) {
  const session = await verifySession();
  if (!session) throw new Error('Unauthenticated');

  try {
    const parsedData = createTestimonialSchema.parse({
      name,
      sm_username,
      picture,
      message,
    });

    const testimonialCount = await pjmeDBPrismaClient.Testimonial.count();
    if (testimonialCount >= 6) {
      throw new NotAllowedError('Maximum number of testimonials (6) reached.');
    }

    const currentTime = BigInt(Math.floor(new Date().getTime() / 1000));

    return await pjmeDBPrismaClient.Testimonial.create({
      data: {
        name: parsedData.name,
        sm_username: parsedData.sm_username,
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
    const testimonial = await pjmeDBPrismaClient.Testimonial.findUnique({
      where: { id: parsedId },
      select: {
        id: true,
        name: true,
        picture: true,
        sm_username: true,
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
  sm_username,
  picture,
  translationId,
  message,
}) {
  const session = await verifySession();
  if (!session) throw new Error('Unauthenticated');

  try {
    const parsedData = editTestimonialSchema.parse({
      id,
      name,
      sm_username,
      picture,
      translationId,
      message,
    });

    return await pjmeDBPrismaClient.Testimonial.update({
      where: { id: parsedData.id },
      data: {
        name: parsedData.name,
        sm_username: parsedData.sm_username,
        picture: parsedData.picture,
        updated_at: BigInt(Math.floor(new Date().getTime() / 1000)),
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
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}
