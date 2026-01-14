import {
  describe,
  it,
  expect,
  vi,
  afterEach,
  beforeAll,
} from 'vitest';
import { createAboutUs, updateAboutUs } from '@/lib/services/about-us-service';
import { Language } from '@/constants/enums';
import UnauthenticatedError from '@/lib/errors/UnauthenticatedError';

beforeAll(() => {
  vi.mock('server-only', () => ({}));

  vi.mock('@/lib/verifySession', () => ({
    default: vi.fn(),
  }));

  vi.mock('@/lib/prisma', () => ({
    default: {
      aboutUs: {
        create: vi.fn(),
      },
      $transaction: vi.fn(),
      aboutUsTranslation: {
        update: vi.fn(),
      },
    },
  }));
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('createAboutUs function', () => {
  it('Should call verifySession function, not call prisma.aboutUs.create function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(() =>
      createAboutUs({
        content: {
          id: 'Konten Indonesia',
          en: 'English Content',
        },
      })
    ).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.aboutUs.create).not.toHaveBeenCalled();
  });

  it('Should call prisma.aboutUs.create function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ isAuth: true });

    const inputContent = {
      id: 'Tentang Kami ID',
      en: 'About Us EN',
    };

    const prismaResult = {
      id: 1,
      translations: [
        { id: 1, language: Language.ID },
        { id: 2, language: Language.EN },
      ],
    };

    prisma.aboutUs.create.mockResolvedValue({ ...prismaResult });

    await createAboutUs({ content: inputContent });

    expect(prisma.aboutUs.create).toHaveBeenCalledWith({
      data: {
        translations: {
          create: [
            { language: Language.ID, content: inputContent.id },
            { language: Language.EN, content: inputContent.en },
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
  });
});

describe('updateAboutUs function', () => {
  it('Should call verifySession function, not call prisma.$transaction and prisma.aboutUs.update function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(() =>
      updateAboutUs({
        id: 1,
        translationId: {
          id: 1,
          en: 2,
        },
        content: {
          id: 'Konten Indonesia',
          en: 'English Content',
        },
      })
    ).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.aboutUsTranslation.update).not.toHaveBeenCalled();
  });

  it('Should call prisma.$transaction function and call prisma.aboutUs.update function twice correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ isAuth: true });

    const input = {
      id: 1,
      translationId: {
        id: 1,
        en: 2,
      },
      content: {
        id: 'Konten Indonesia',
        en: 'English Content',
      },
    };

    await updateAboutUs(input);

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.aboutUsTranslation.update).toBeCalledTimes(2);
    expect(prisma.aboutUsTranslation.update).toHaveBeenCalledWith({
      data: { content: input.content.id },
      select: { id: true },
      where: { id: input.translationId.id, aboutUsId: input.id },
    });
    expect(prisma.aboutUsTranslation.update).toHaveBeenCalledWith({
      data: { content: input.content.en },
      select: { id: true },
      where: { id: input.translationId.en, aboutUsId: input.id },
    });
  });
});
