import {
  describe,
  it,
  expect,
  vi,
  afterEach,
  beforeAll,
} from 'vitest';
import {
  createTestimonial,
  updateTestimonial,
} from '@/lib/services/testimonial-service';
import { Language } from '@/constants/enums';
import UnauthenticatedError from '@/lib/errors/UnauthenticatedError';

beforeAll(() => {
  vi.mock('server-only', () => ({}));

  vi.mock('@/lib/verifySession', () => ({
    default: vi.fn(),
  }));

  vi.mock('@/lib/prisma', () => ({
    default: {
      testimonial: {
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
    },
  }));

  vi.mock('@/config/cms', () => ({}));
  vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
  }));
});

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe('createTestimonial function', () => {
  it('Should call verifySession function, not call prisma.testimonial.create function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(createTestimonial({
      name: 'Reza',
      smProfileUrl: 'https://x.com/FikkriReza',
      picture: 'https://translat/img.jpg',
      message: {
        id: 'Pesan ID',
        en: 'Message EN',
      },
    })).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.testimonial.create).not.toHaveBeenCalled();
  });

  it('Should call prisma.testimonial.create function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853503149);

    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ userId: 1 });
    prisma.testimonial.count.mockResolvedValue(2);

    await createTestimonial({
      name: 'Reza',
      smProfileUrl: 'https://x.com/FikkriReza',
      picture: 'https://translat/img.jpg',
      message: {
        id: 'Pesan ID',
        en: 'Message EN',
      },
    });

    const currentTime = Math.floor(new Date().getTime() / 1000);
    expect(prisma.testimonial.create).toHaveBeenCalledWith({
      data: {
        name: 'Reza',
        smProfileUrl: 'https://x.com/FikkriReza',
        picture: 'https://translat/img.jpg',
        createdAt: currentTime,
        updatedAt: currentTime,
        translations: {
          create: [
            {
              language: Language.ID,
              message: 'Pesan ID',
            },
            {
              language: Language.EN,
              message: 'Message EN',
            },
          ],
        },
      },
      select: { id: true },
    });
  });
});

describe('updateTestimonial function', () => {
  it('Should call verifySession function, not call prisma.testimonial.update function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(updateTestimonial({
      id: 1,
      name: 'Reza',
      smProfileUrl: 'https://x.com/FikkriReza',
      picture: 'https://translat/img.jpg',
      translationId: {
        id: 100,
        en: 200,
      },
      message: {
        id: 'Pesan ID',
        en: 'Message EN',
      },
    })).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.testimonial.update).not.toHaveBeenCalled();
  });

  it('Should call prisma.testimonial.update function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853503149);

    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ userId: 1 });

    await updateTestimonial({
      id: 1,
      name: 'Reza',
      smProfileUrl: 'https://x.com/FikkriReza',
      picture: 'https://translat/img.jpg',
      translationId: {
        id: 100,
        en: 200,
      },
      message: {
        id: 'Pesan ID',
        en: 'Message EN',
      },
    });

    expect(prisma.testimonial.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        name: 'Reza',
        smProfileUrl: 'https://x.com/FikkriReza',
        picture: 'https://translat/img.jpg',
        updatedAt: Math.floor(new Date().getTime() / 1000),
        translations: {
          update: [
            {
              where: { id: 100 },
              data: { message: 'Pesan ID' },
            },
            {
              where: { id: 200 },
              data: { message: 'Message EN' },
            },
          ],
        },
      },
      select: { id: true },
    });
  });
});
