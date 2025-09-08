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

  vi.mock('@/lib/pjme-prisma-client', () => ({
    default: {
      AboutUs: {
        create: vi.fn(),
      },
      $transaction: vi.fn(),
      AboutUsTranslation: {
        update: vi.fn(),
      },
    },
  }));
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('createAboutUs function', () => {
  it('Should call verifySession function, not call pjmeDBPrismaClient.AboutUs.create function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

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
    expect(pjmeDBPrismaClient.AboutUs.create).not.toHaveBeenCalled();
  });

  it('Should call pjmeDBPrismaClient.AboutUs.create function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

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

    pjmeDBPrismaClient.AboutUs.create.mockResolvedValue({ ...prismaResult });

    await createAboutUs({ content: inputContent });

    expect(pjmeDBPrismaClient.AboutUs.create).toHaveBeenCalledWith({
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
  it('Should call verifySession function, not call pjmeDBPrismaClient.$transaction and pjmeDBPrismaClient.AboutUs.update function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

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
    expect(pjmeDBPrismaClient.$transaction).not.toHaveBeenCalled();
    expect(pjmeDBPrismaClient.AboutUsTranslation.update).not.toHaveBeenCalled();
  });

  it('Should call pjmeDBPrismaClient.$transaction function and call pjmeDBPrismaClient.AboutUs.update function twice correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

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

    expect(pjmeDBPrismaClient.$transaction).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.AboutUsTranslation.update).toBeCalledTimes(2);
    expect(pjmeDBPrismaClient.AboutUsTranslation.update).toHaveBeenCalledWith({
      data: { content: input.content.id },
      select: { id: true },
      where: { id: input.translationId.id, about_us_id: input.id },
    });
    expect(pjmeDBPrismaClient.AboutUsTranslation.update).toHaveBeenCalledWith({
      data: { content: input.content.en },
      select: { id: true },
      where: { id: input.translationId.en, about_us_id: input.id },
    });
  });
});
