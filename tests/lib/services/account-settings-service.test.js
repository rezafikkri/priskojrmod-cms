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
  deletedonationLink,
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
});

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe('getAccount function', () => {
  it('should call verifySession function, not call prisma.Admin.findUnique function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(getAccount()).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.Admin.findUnique).not.toHaveBeenCalled();
  });

  it('should call prisma.Admin.findUnique function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({
      isAuth: true,
      userId: 'admin-id',
      userName: 'John',
      userEmail: 'john@example.com',
      userPicture: 'pic.jpg',
    });

    prisma.Admin.findUnique.mockResolvedValue({
      lastName: 'Doe',
      whatsappPhoneNumber: '+6285758438583',
      donationLinks: [],
    });

    await getAccount();

    expect(prisma.Admin.findUnique).toHaveBeenCalledWith({
      where: { id: 'admin-id' },
      select: {
        role: true,
        lastName: true,
        whatsappPhoneNumber: true,
        donationLinks: {
          select: {
            id: true,
            currencyCode: true,
            link: true,
          },
        },
      },
    });
  });
});

describe('updateAccount function', () => {
  it('should call verifySession function, not call prisma.Admin.update function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(updateAccount({
      firstName: 'John',
      lastName: 'Doe',
      whatsappPhoneNumber: '+6285758438583',
      picture: 'https://test.co/pic.jpg',
      donationLinks: [
        { dbId: 1, currencyCode: 'IDR', link: 'https://donate1.com' },
        { currencyCode: 'USD', link: 'https://donate2.com' },
      ],
    })).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.Admin.update).not.toHaveBeenCalled();
  });

  it('should call prisma.Admin.update function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853703149);
    const currentTime = Math.floor(new Date().getTime() / 1000);

    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 12 });

    prisma.$transaction.mockResolvedValue([
      {
        id: 12,
        donationLinks: [
          { id: 1, currencyCode: 'IDR', link: 'https://donate1.com' },
          { id: 2, currencyCode: 'USD', link: 'https://donate2.com' },
        ],
      },
    ]);

    prisma.Admin.update.mockResolvedValue({
      id: 12,
      donationLinks: [
        { id: 1, currencyCode: 'IDR', link: 'https://donate1.com' },
        { id: 2, currencyCode: 'USD', link: 'https://donate2.com' },
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
        { dbId: 1, currencyCode: 'IDR', link: 'https://donate1.com' },
        { dbId: 2, currencyCode: 'USD', link: 'https://donate2.com' },
      ],
    });

    expect(prisma.Admin.update).toHaveBeenCalledWith({
      where: { id: 12 },
      data: {
        firstName: 'John',
        lastName: 'Doe',
        whatsappPhoneNumber: '+6285758438583',
        picture: 'https://test.co/pic.jpg',
        donationLinks: {
          update: [
            {
              data: { currencyCode: 'IDR', link: 'https://donate1.com' },
              where: { id: 1 },
            },
            {
              data: { currencyCode: 'USD', link: 'https://donate2.com' },
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
            link: true,
          },
        },
      },
    });
  });
});

describe('deletedonationLink function', () => {
  it('should call verifySession function, not call prisma.donationLink.delete function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(deletedonationLink(1)).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.donationLink.delete).not.toHaveBeenCalled();
  });

  it('should call prisma.donationLink.delete function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 12 });

    prisma.$transaction.mockResolvedValue([
      { id: 1 },
      { id: 12 },
    ]);
    prisma.donationLink.delete.mockResolvedValue({ id: 1 });

    await deletedonationLink(1);

    expect(prisma.donationLink.delete).toHaveBeenCalledWith({
      where: { id: 1 },
      select: { id: true },
    });
  });
});
