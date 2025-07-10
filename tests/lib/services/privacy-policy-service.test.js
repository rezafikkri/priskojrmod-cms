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

beforeAll(() => {
  vi.mock('server-only', () => ({}));

  vi.mock('@/lib/verifySession', () => ({
    default: vi.fn(),
  }));

  vi.mock('@/lib/pjme-prisma-client', () => ({
    default: {
      PrivacyPolicy: {
        create: vi.fn(),
        update: vi.fn(),
      },
    },
  }));
});

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe('createPrivacyPolicy function', () => {
  it('Should call verifySession function, not call pjmeDBPrismaClient.PrivacyPolicy.create function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(() =>
      createPrivacyPolicy({
        content: {
          id: 'kebijakan id',
          en: 'policy en',
        },
      })
    ).rejects.toThrowError('Unauthenticated');

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.PrivacyPolicy.create).not.toHaveBeenCalled();
  })

  it('Should call pjmeDBPrismaClient.PrivacyPolicy.create function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853503149);

    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 'user-id' });

    const prismaResult = {
      id: 1,
      translations: [
        { id: 1, language: Language.ID },
        { id: 2, language: Language.EN },
      ],
    };
    pjmeDBPrismaClient.PrivacyPolicy.create.mockResolvedValue({
      ...prismaResult,
    });

    const inputContent = {
      id: 'Konten Indonesia',
      en: 'English Content',
    };

    await createPrivacyPolicy({
      content: inputContent,
    });

    expect(pjmeDBPrismaClient.PrivacyPolicy.create).toHaveBeenCalledWith({
      data: {
        created_at: BigInt(Math.floor(new Date().getTime() / 1000)),
        updated_at: BigInt(Math.floor(new Date().getTime() / 1000)),
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
  it('Should call verifySession function, not call pjmeDBPrismaClient.PrivacyPolicy.update function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

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
    ).rejects.toThrowError('Unauthenticated');

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.PrivacyPolicy.update).not.toHaveBeenCalled();
  });

  it('Should call pjmeDBPrismaClient.PrivacyPolicy.update function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853503149); // Fixed time

    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 'user-id' });

    pjmeDBPrismaClient.PrivacyPolicy.update.mockResolvedValue({ id: 1 });

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

    expect(pjmeDBPrismaClient.PrivacyPolicy.update).toHaveBeenCalledWith({
      where: { id: input.id },
      data: {
        updated_at: BigInt(Math.floor(new Date().getTime() / 1000)),
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
