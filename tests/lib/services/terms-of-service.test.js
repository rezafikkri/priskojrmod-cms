import {
  describe,
  it,
  expect,
  vi,
  afterEach,
  beforeAll,
} from 'vitest';
import { createTermsOfService, updateTermsOfService } from '@/lib/services/terms-of-service-service';
import { Language } from '@/constants/enums';
import UnauthenticatedError from '@/lib/errors/UnauthenticatedError';

beforeAll(() => {
  vi.mock('server-only', () => ({}));

  vi.mock('@/lib/verifySession', () => ({
    default: vi.fn(),
  }));

  vi.mock('@/lib/prisma', () => ({
    default: {
      termsOfService: {
        create: vi.fn(),
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

describe('createTermsOfService function', () => {
  it('Should call verifySession function, not call prisma.termsOfService.create function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(() =>
      createTermsOfService({
        content: {
          id: 'syarat ketentuan id',
          en: 'terms en',
        },
      })
    ).rejects.toThrowError(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.termsOfService.create).not.toHaveBeenCalled();
  });
  
  it('Should call prisma.termsOfService.create function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853503149);

    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ userId: 1 });

    const prismaResult = {
      id: 1,
      translations: [
        { id: 1, language: Language.ID },
        { id: 2, language: Language.EN },
      ],
    };
    prisma.termsOfService.create.mockResolvedValue({
      ...prismaResult,
    });

    const inputContent = {
      id: 'Konten Indonesia',
      en: 'English Content',
    };

    await createTermsOfService({
      content: inputContent,
    });

    expect(prisma.termsOfService.create).toHaveBeenCalledWith({
      data: {
        createdAt: Math.floor(new Date().getTime() / 1000),
        updatedAt: Math.floor(new Date().getTime() / 1000),
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

describe('updateTermsOfService function', () => {
  it('Should call verifySession function, not call prisma.termsOfService.update function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(() =>
      updateTermsOfService({
        id: 1,
        translationId: { id: 1, en: 2 },
        content: { id: 'konten', en: 'content' },
      })
    ).rejects.toThrowError(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.termsOfService.update).not.toHaveBeenCalled();
  });

  it('Should call prisma.termsOfService.update function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853503149);

    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ userId: 1 });

    const prismaResult = { id: 1 };
    prisma.termsOfService.update.mockResolvedValue({ ...prismaResult });

    const input = {
      id: 1,
      translationId: { id: 10, en: 20 },
      content: { id: 'Konten ID', en: 'Content EN' },
    };

    await updateTermsOfService(input);

    expect(prisma.termsOfService.update).toHaveBeenCalledWith({
      where: { id: input.id },
      data: {
        updatedAt: Math.floor(new Date().getTime() / 1000),
        translations: {
          update: [
            {
              data: { content: input.content.id },
              where: { id: input.translationId.id },
            },
            {
              data: { content: input.content.en },
              where: { id: input.translationId.en },
            },
          ],
        },
      },
      select: { id: true },
    });
  });
});
