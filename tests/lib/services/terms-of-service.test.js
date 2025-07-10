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

beforeAll(() => {
  vi.mock('server-only', () => ({}));

  vi.mock('@/lib/verifySession', () => ({
    default: vi.fn(),
  }));

  vi.mock('@/lib/pjme-prisma-client', () => ({
    default: {
      TermsOfService: {
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

describe('createTermsOfService function', () => {
  it('Should call verifySession function, not call pjmeDBPrismaClient.TermsOfService.create function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(() =>
      createTermsOfService({
        content: {
          id: 'syarat ketentuan id',
          en: 'terms en',
        },
      })
    ).rejects.toThrowError('Unauthenticated');

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.TermsOfService.create).not.toHaveBeenCalled();
  });
  
  it('Should call pjmeDBPrismaClient.TermsOfService.create function correctly', async () => {
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
    pjmeDBPrismaClient.TermsOfService.create.mockResolvedValue({
      ...prismaResult,
    });

    const inputContent = {
      id: 'Konten Indonesia',
      en: 'English Content',
    };

    await createTermsOfService({
      content: inputContent,
    });

    expect(pjmeDBPrismaClient.TermsOfService.create).toHaveBeenCalledWith({
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

describe('updateTermsOfService function', () => {
  it('Should call verifySession function, not call pjmeDBPrismaClient.TermsOfService.update function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(() =>
      updateTermsOfService({
        id: 1,
        translationId: { id: 1, en: 2 },
        content: { id: 'konten', en: 'content' },
      })
    ).rejects.toThrowError('Unauthenticated');

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.TermsOfService.update).not.toHaveBeenCalled();
  });

  it('Should call pjmeDBPrismaClient.TermsOfService.update function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853503149);

    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 'user-id' });

    const prismaResult = { id: 1 };
    pjmeDBPrismaClient.TermsOfService.update.mockResolvedValue({ ...prismaResult });

    const input = {
      id: 1,
      translationId: { id: 10, en: 20 },
      content: { id: 'Konten ID', en: 'Content EN' },
    };

    await updateTermsOfService(input);

    expect(pjmeDBPrismaClient.TermsOfService.update).toHaveBeenCalledWith({
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
      select: { id: true },
    });
  });
});
