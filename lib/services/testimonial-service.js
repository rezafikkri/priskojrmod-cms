import 'server-only';

import pjmeDBPrismaClient from '../pjme-prisma-client';
import UnknownError from '../errors/UnknownError';
import { createTestimonialSchema } from '../validators/testimonial-validator';
import verifySession from '../verifySession';
import NotFoundError from '../errors/NotFoundError';
import { Language } from '@/constants/enums';
import NotAllowedError from '../errors/NotAllowedError';

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

    const currentTime = BigInt(Math.floor(Date.now() / 1000));

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
