import {
  describe,
  it,
  expect,
  vi,
  afterEach,
  beforeAll,
} from 'vitest';
import { Language } from '@/constants/enums';
import { createLicense, deleteLicense, updateLicense } from '@/lib/services/license-service';

beforeAll(() => {
  vi.mock('server-only', () => ({}));

  vi.mock('@/lib/verifySession', () => ({
    default: vi.fn(),
  }));

  vi.mock('@/lib/pjme-prisma-client', () => ({
    default: {
      License: {
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    },
  }));
});

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe('createLicense function', () => {
  it('Should call verifySession function, not call pjmeDBPrismaClient.License.create function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(createLicense({
      name: {
        id: 'Lisensi',
        en: 'License',
      },
      content: {
        id: 'Konten',
        en: 'Content',
      },
    })).rejects.toThrow('Unauthenticated');

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.License.create).not.toHaveBeenCalled();
  });

  it('Should call pjmeDBPrismaClient.License.create function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853503149); // arbitrary fixed timestamp

    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 'user-id' });

    await createLicense({
      name: {
        id: 'Lisensi ID',
        en: 'License EN',
      },
      content: {
        id: 'Konten ID',
        en: 'Content EN',
      },
    });

    const expectedTimestamp = BigInt(Math.floor(new Date().getTime() / 1000));

    expect(pjmeDBPrismaClient.License.create).toHaveBeenCalledWith({
      data: {
        created_at: expectedTimestamp,
        updated_at: expectedTimestamp,
        translations: {
          create: [
            {
              language: Language.ID,
              name: 'Lisensi ID',
              content: 'Konten ID',
            },
            {
              language: Language.EN,
              name: 'License EN',
              content: 'Content EN',
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

describe('updateLicense function', () => {
  it('Should call verifySession function, not call pjmeDBPrismaClient.License.update function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(updateLicense({
      id: 1,
      translationId: {
        id: 10,
        en: 11,
      },
      name: {
        id: 'Lisensi ID',
        en: 'License EN',
      },
      content: {
        id: 'Konten ID',
        en: 'Content EN',
      },
    })).rejects.toThrow('Unauthenticated');

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.License.update).not.toHaveBeenCalled();
  });

  it('Should call pjmeDBPrismaClient.License.update function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853503149);

    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 'user-id' });

    await updateLicense({
      id: 1,
      translationId: {
        id: 10,
        en: 11,
      },
      name: {
        id: 'Lisensi ID',
        en: 'License EN',
      },
      content: {
        id: 'Konten ID',
        en: 'Content EN',
      },
    });

    expect(pjmeDBPrismaClient.License.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        updated_at: BigInt(Math.floor(new Date().getTime() / 1000)),
        translations: {
          update: [
            {
              where: { id: 10 },
              data: {
                language: Language.ID,
                name: 'Lisensi ID',
                content: 'Konten ID',
              },
            },
            {
              where: { id: 11 },
              data: {
                language: Language.EN,
                name: 'License EN',
                content: 'Content EN',
              },
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

describe('deleteLicense function', () => {
  it('Should call verifySession function, not call pjmeDBPrismaClient.License.delete function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(deleteLicense(1)).rejects.toThrow('Unauthenticated');

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.License.delete).not.toHaveBeenCalled();
  });

  it('Should call pjmeDBPrismaClient.License.delete function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 'user-id' });

    await deleteLicense(1);

    expect(pjmeDBPrismaClient.License.delete).toHaveBeenCalledWith({
      where: { id: 1 },
      select: { id: true },
    });
  });
});
