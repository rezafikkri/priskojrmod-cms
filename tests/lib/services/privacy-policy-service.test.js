import {
  describe,
  it,
  expect,
  vi,
  afterEach,
  beforeAll,
} from 'vitest';
import { createPrivacyPolicy, updatePrivacyPolicy } from '@/lib/services/privacy-policy-service';
import { Language } from '@/constants/enums';
import UnauthenticatedError from '@/lib/errors/UnauthenticatedError';

beforeAll(() => {
  vi.mock('server-only', () => ({}));

  vi.mock('@/lib/verifySession', () => ({
    default: vi.fn(),
  }));

  vi.mock('@/lib/prisma', () => ({
    default: {
      privacyPolicy: {
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

describe('createPrivacyPolicy function', () => {
  it('Should call verifySession function, not call prisma.privacyPolicy.create function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(() =>
      createPrivacyPolicy({
        content: {
          id: 'kebijakan id',
          en: 'policy en',
        },
      })
    ).rejects.toThrowError(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.privacyPolicy.create).not.toHaveBeenCalled();
  })

  it('Should call prisma.privacyPolicy.create function correctly', async () => {
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
    prisma.privacyPolicy.create.mockResolvedValue({
      ...prismaResult,
    });

    const inputContent = {
      id: 'Konten Indonesia',
      en: 'English Content',
    };

    await createPrivacyPolicy({
      content: inputContent,
    });

    expect(prisma.privacyPolicy.create).toHaveBeenCalledWith({
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

describe('updatePrivacyPolicy function', () => {
  it('Should call verifySession function, not call prisma.privacyPolicy.update function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(() =>
      updatePrivacyPolicy({
        id: 1,
        translationId: {
          id: 11,
          en: 12,
        },
        content: {
          id: 'updated kebijakan id',
          en: 'updated policy en',
        },
      })
    ).rejects.toThrowError(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.privacyPolicy.update).not.toHaveBeenCalled();
  });

  it('Should call prisma.privacyPolicy.update function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853503149); // Fixed time

    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ userId: 1 });

    prisma.privacyPolicy.update.mockResolvedValue({ id: 1 });

    const input = {
      id: 1,
      translationId: {
        id: 11,
        en: 12,
      },
      content: {
        id: 'Updated ID Content',
        en: 'Updated EN Content',
      },
    };

    await updatePrivacyPolicy(input);

    expect(prisma.privacyPolicy.update).toHaveBeenCalledWith({
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
      select: {
        id: true,
      },
    });
  });
});
