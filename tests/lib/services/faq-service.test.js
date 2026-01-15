import {
  describe,
  it,
  expect,
  vi,
  afterEach,
  beforeAll,
} from 'vitest';
import {
  createFaq,
  deleteFaq,
  updateFaq,
} from '@/lib/services/faq-service';
import { Language } from '@/constants/enums';
import UnauthenticatedError from '@/lib/errors/UnauthenticatedError';

beforeAll(() => {
  vi.mock('server-only', () => ({}));

  vi.mock('@/lib/verifySession', () => ({
    default: vi.fn(),
  }));

  vi.mock('@/lib/prisma', () => ({
    default: {
      faq: {
        create: vi.fn(),
        delete: vi.fn(),
        update: vi.fn(),
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

describe('createFaq function', () => {
  it('Should call verifySession function, not call prisma.faq.create function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(createFaq({
      title: {
        id: 'judul',
        en: 'title',
      },
      content: {
        id: 'konten',
        en: 'content',
      },
    })).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.faq.create).not.toHaveBeenCalled();
  });

  it('Should call prisma.faq.create function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853503149);

    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ userId: 1 });

    await createFaq({
      title: {
        id: 'Judul ID',
        en: 'Title EN',
      },
      content: {
        id: 'Konten ID',
        en: 'Content EN',
      },
    });

    expect(prisma.faq.create).toHaveBeenCalledWith({
      data: {
        createdAt: Math.floor(new Date().getTime() / 1000),
        updatedAt: Math.floor(new Date().getTime() / 1000),
        translations: {
          create: [
            { language: Language.ID, title: 'Judul ID', content: 'Konten ID' },
            { language: Language.EN, title: 'Title EN', content: 'Content EN' },
          ],
        },
      },
      select: {
        id: true,
      },
    });
  });
});

describe('deleteFaq function', () => {
  it('Should call verifySession function, not call prisma.faq.delete function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(deleteFaq(1)).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.faq.delete).not.toHaveBeenCalled();
  });

  it('Should call prisma.faq.delete function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ userId: 1 });

    await deleteFaq(1);

    expect(prisma.faq.delete).toHaveBeenCalledWith({
      where: { id: 1 },
      select: { id: true },
    });
  });
});

describe('updateFaq function', () => {
  it('Should call verifySession function, not call prisma.faq.update function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(updateFaq({})).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.faq.update).not.toHaveBeenCalled();
  });

  it('Should call prisma.faq.update function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853503149);

    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ userId: 1 });

    await updateFaq({
      id: 123,
      translationId: {
        id: 1,
        en: 2,
      },
      title: {
        id: 'Judul ID',
        en: 'Title EN',
      },
      content: {
        id: 'Konten ID',
        en: 'Content EN',
      },
    });

    expect(prisma.faq.update).toHaveBeenCalledWith({
      where: { id: 123 },
      data: {
        updatedAt: Math.floor(new Date().getTime() / 1000),
        translations: {
          update: [
            {
              where: { id: 1 },
              data: {
                title: 'Judul ID',
                content: 'Konten ID',
              },
            },
            {
              where: { id: 2 },
              data: {
                title: 'Title EN',
                content: 'Content EN',
              },
            },
          ],
        },
      },
      select: { id: true },
    });
  });
});
