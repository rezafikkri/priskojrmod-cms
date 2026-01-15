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
        update: vi.fn(),
      },
    },
  }));

  vi.mock('@/config/cms', () => ({}));
  vi.mock('next/cache', () => ({
    revalidatePath: () => {},
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

    verifySession.mockResolvedValue({ userId: 1 });

    const input = {
      content: {
        id: 'Tentang Kami ID',
        en: 'About Us EN',
      },
      supportEmail: 'support@tokokami.com',
      supportWhatsapp: { countryIso: 'ID', number: '+6281234567890' },
      officeHours: {
        id: 'Senin - Jumat: 09.00 - 17.00 | Sabtu & Minggu: Tutup',
        en: 'Monday - Friday: 09:00 AM - 05:00 PM | Saturday & Sunday: Closed',
      },
    };

    const prismaResult = {
      id: 1,
      translations: [
        { id: 1, language: Language.ID },
        { id: 2, language: Language.EN },
      ],
    };

    prisma.aboutUs.create.mockResolvedValue({ ...prismaResult });

    await createAboutUs(input);

    expect(prisma.aboutUs.create).toHaveBeenCalledWith({
      data: {
        supportWhatsapp: input.supportWhatsapp.number,
        supportEmail: input.supportEmail,
        translations: {
          create: [
            {
              language: Language.ID,
              content: input.content.id,
              officeHours: input.officeHours.id,
            },
            {
              language: Language.EN,
              content: input.content.en,
              officeHours: input.officeHours.en,
            },
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
  it('Should call verifySession function, not call prisma.aboutUs.update function and throw Error with "Unauthenticated" message', async () => {
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
        supportEmail: 'support@tokokami.com',
        supportWhatsapp: { countryIso: 'ID', number: '+6281234567890' },
        content: {
          id: 'Konten Indonesia',
          en: 'English Content',
        },
        officeHours: {
          id: 'Senin - Jumat: 09.00 - 17.00 | Sabtu & Minggu: Tutup',
          en: 'Monday - Friday: 09:00 AM - 05:00 PM | Saturday & Sunday: Closed',
        },
      })
    ).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.aboutUs.update).not.toHaveBeenCalled();
  });

  it('Should call prisma.aboutUs.update function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ userId: 1 });

    const input = {
      id: 1,
      translationId: {
        id: 1,
        en: 2,
      },
      supportEmail: 'support@tokokami.com',
      supportWhatsapp: { countryIso: 'ID', number: '+6281234567890' },
      content: {
        id: 'Konten Indonesia',
        en: 'English Content',
      },
      officeHours: {
        id: 'Senin - Jumat: 09.00 - 17.00 | Sabtu & Minggu: Tutup',
        en: 'Monday - Friday: 09:00 AM - 05:00 PM | Saturday & Sunday: Closed',
      },
    };

    await updateAboutUs(input);

    expect(prisma.aboutUs.update).toHaveBeenCalledWith({
      where: { id: input.id },
      data: {
        supportEmail: input.supportEmail,
        supportWhatsapp: input.supportWhatsapp.number,
        translations: {
          update: [
            {
              data: {
                content: input.content.id,
                officeHours: input.officeHours.id,
              },
              where: { id: input.translationId.id },
            },
            {
              data: {
                content: input.content.en,
                officeHours: input.officeHours.en,
              },
              where: { id: input.translationId.en },
            },
          ],
        },

      },
      select: { id: true },
    });
  });
});
