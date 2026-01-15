import {
  describe,
  it,
  expect,
  vi,
  afterEach,
  beforeAll,
} from 'vitest';
import {
  getAccount,
  updateAccount,
  deleteDonationLink,
} from '@/lib/services/account-settings-service';
import UnauthenticatedError from '@/lib/errors/UnauthenticatedError';

beforeAll(() => {
  vi.mock('server-only', () => ({}));

  vi.mock('@/lib/verifySession', () => ({
    default: vi.fn(),
  }));

  vi.mock('@/lib/prisma', () => ({
    default: {
      admin: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      donationLink: {
        delete: vi.fn(),
      },
      $transaction: vi.fn(),
    },
  }));

  vi.mock('libphonenumber-js', () => ({
    default: () => ({
      country: 'ID',
      number: '+6285758438583',
      isValid: () => true,
    }),
  }));

  vi.mock('@/config/cms', () => ({}));
  vi.mock('next/cache', () => ({
    revalidatePath: () => {},
  }));
});

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe('getAccount function', () => {
  it('should call verifySession function, not call prisma.admin.findUnique function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(getAccount()).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.admin.findUnique).not.toHaveBeenCalled();
  });

  it('should call prisma.admin.findUnique function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({
      userId: 1,
      userName: 'John',
      userEmail: 'john@example.com',
      userPicture: 'pic.jpg',
    });

    prisma.admin.findUnique.mockResolvedValue({
      lastName: 'Doe',
      whatsappPhoneNumber: '+6285758438583',
      donationLinks: [],
    });

    await getAccount();

    expect(prisma.admin.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: {
        role: true,
        whatsappPhoneNumber: true,
        donationLinks: {
          select: {
            id: true,
            currencyCode: true,
            url: true,
          },
        },
      },
    });
  });
});

describe('updateAccount function', () => {
  it('should call verifySession function, not call prisma.admin.update function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(updateAccount({
      firstName: 'John',
      lastName: 'Doe',
      whatsappPhoneNumber: '+6285758438583',
      picture: 'https://test.co/pic.jpg',
      donationLinks: [
        { dbId: 1, currencyCode: 'IDR', url: 'https://donate1.com' },
        { currencyCode: 'USD', url: 'https://donate2.com' },
      ],
    })).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.admin.update).not.toHaveBeenCalled();
  });

  it('should call prisma.admin.update function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853703149);
    const currentTime = Math.floor(new Date().getTime() / 1000);

    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ userId: 12 });

    prisma.$transaction.mockResolvedValue([
      {
        id: 12,
        donationLinks: [
          { id: 1, currencyCode: 'IDR', url: 'https://donate1.com' },
          { id: 2, currencyCode: 'USD', url: 'https://donate2.com' },
        ],
      },
    ]);

    prisma.admin.update.mockResolvedValue({
      id: 12,
      donationLinks: [
        { id: 1, currencyCode: 'IDR', url: 'https://donate1.com' },
        { id: 2, currencyCode: 'USD', url: 'https://donate2.com' },
      ],
    });

    await updateAccount({
      firstName: 'John',
      lastName: 'Doe',
      whatsappPhoneNumber: {
        countryIso: 'ID',
        number: '+6285758438583',
      },
      picture: 'https://test.co/pic.jpg',
      donationLinks: [
        { dbId: 1, currencyCode: 'IDR', url: 'https://donate1.com' },
        { dbId: 2, currencyCode: 'USD', url: 'https://donate2.com' },
      ],
    });

    expect(prisma.admin.update).toHaveBeenCalledWith({
      where: { id: 12 },
      data: {
        firstName: 'John',
        lastName: 'Doe',
        whatsappPhoneNumber: '+6285758438583',
        picture: 'https://test.co/pic.jpg',
        donationLinks: {
          update: [
            {
              data: { currencyCode: 'IDR', url: 'https://donate1.com' },
              where: { id: 1 },
            },
            {
              data: { currencyCode: 'USD', url: 'https://donate2.com' },
              where: { id: 2 },
            },
          ],
        },
        updatedAt: currentTime,
      },
      select: {
        id: true,
        donationLinks: {
          select: {
            id: true,
            currencyCode: true,
            url: true,
          },
        },
      },
    });
  });
});

describe('deleteDonationLink function', () => {
  it('should call verifySession function, not call prisma.donationLink.delete function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(deleteDonationLink(1)).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.donationLink.delete).not.toHaveBeenCalled();
  });

  it('should call prisma.donationLink.delete function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ userId: 12 });

    prisma.$transaction.mockResolvedValue([
      { id: 1 },
      { id: 12 },
    ]);
    prisma.donationLink.delete.mockResolvedValue({ id: 1 });

    await deleteDonationLink(1);

    expect(prisma.donationLink.delete).toHaveBeenCalledWith({
      where: { id: 1 },
      select: { id: true },
    });
  });
});
