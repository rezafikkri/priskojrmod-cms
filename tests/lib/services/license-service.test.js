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
import UnauthenticatedError from '@/lib/errors/UnauthenticatedError';

beforeAll(() => {
  vi.mock('server-only', () => ({}));

  vi.mock('@/lib/verifySession', () => ({
    default: vi.fn(),
  }));

  vi.mock('@/lib/prisma', () => ({
    default: {
      license: {
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
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

describe('createLicense function', () => {
  it('Should call verifySession function, not call prisma.license.create function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

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
    })).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.license.create).not.toHaveBeenCalled();
  });

  it('Should call prisma.license.create function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853503149); // arbitrary fixed timestamp

    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ userId: 1 });

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

    const expectedTimestamp = Math.floor(new Date().getTime() / 1000);

    expect(prisma.license.create).toHaveBeenCalledWith({
      data: {
        createdAt: expectedTimestamp,
        updatedAt: expectedTimestamp,
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
  it('Should call verifySession function, not call prisma.license.update function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

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
    })).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.license.update).not.toHaveBeenCalled();
  });

  it('Should call prisma.license.update function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853503149);

    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ userId: 1 });

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

    expect(prisma.license.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        updatedAt: Math.floor(new Date().getTime() / 1000),
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
  it('Should call verifySession function, not call prisma.license.delete function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(deleteLicense(1)).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.license.delete).not.toHaveBeenCalled();
  });

  it('Should call prisma.license.delete function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ userId: 1 });

    await deleteLicense(1);

    expect(prisma.license.delete).toHaveBeenCalledWith({
      where: { id: 1 },
      select: { id: true },
    });
  });
});
