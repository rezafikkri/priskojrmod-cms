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

  vi.mock('@/lib/pjme-prisma-client', () => ({
    default: {
      Admin: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      DonationLink: {
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
  it('should call verifySession function, not call pjmeDBPrismaClient.Admin.findUnique function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(getAccount()).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Admin.findUnique).not.toHaveBeenCalled();
  });

  it('should call pjmeDBPrismaClient.Admin.findUnique function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({
      isAuth: true,
      userId: 'admin-id',
      userName: 'John',
      userEmail: 'john@example.com',
      userPicture: 'pic.jpg',
    });

    pjmeDBPrismaClient.Admin.findUnique.mockResolvedValue({
      last_name: 'Doe',
      whatsapp_phone_number: '+6285758438583',
      donation_links: [],
    });

    await getAccount();

    expect(pjmeDBPrismaClient.Admin.findUnique).toHaveBeenCalledWith({
      where: { id: 'admin-id' },
      select: {
        role: true,
        last_name: true,
        whatsapp_phone_number: true,
        donation_links: {
          select: {
            id: true,
            currency_code: true,
            link: true,
          },
        },
      },
    });
  });
});

describe('updateAccount function', () => {
  it('should call verifySession function, not call pjmeDBPrismaClient.Admin.update function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(updateAccount({
      first_name: 'John',
      last_name: 'Doe',
      whatsapp_phone_number: '+6285758438583',
      picture: 'https://test.co/pic.jpg',
      donation_links: [
        { dbId: 1, currency_code: 'IDR', link: 'https://donate1.com' },
        { currency_code: 'USD', link: 'https://donate2.com' },
      ],
    })).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Admin.update).not.toHaveBeenCalled();
  });

  it('should call pjmeDBPrismaClient.Admin.update function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853703149);
    const currentTime = Math.floor(new Date().getTime() / 1000);

    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 12 });

    pjmeDBPrismaClient.$transaction.mockResolvedValue([
      {
        id: 12,
        donation_links: [
          { id: 1, currency_code: 'IDR', link: 'https://donate1.com' },
          { id: 2, currency_code: 'USD', link: 'https://donate2.com' },
        ],
      },
    ]);

    pjmeDBPrismaClient.Admin.update.mockResolvedValue({
      id: 12,
      donation_links: [
        { id: 1, currency_code: 'IDR', link: 'https://donate1.com' },
        { id: 2, currency_code: 'USD', link: 'https://donate2.com' },
      ],
    });

    await updateAccount({
      first_name: 'John',
      last_name: 'Doe',
      whatsapp_phone_number: {
        country_iso: 'ID',
        number: '+6285758438583',
      },
      picture: 'https://test.co/pic.jpg',
      donation_links: [
        { dbId: 1, currency_code: 'IDR', link: 'https://donate1.com' },
        { dbId: 2, currency_code: 'USD', link: 'https://donate2.com' },
      ],
    });

    expect(pjmeDBPrismaClient.Admin.update).toHaveBeenCalledWith({
      where: { id: 12 },
      data: {
        first_name: 'John',
        last_name: 'Doe',
        whatsapp_phone_number: '+6285758438583',
        picture: 'https://test.co/pic.jpg',
        donation_links: {
          update: [
            {
              data: { currency_code: 'IDR', link: 'https://donate1.com' },
              where: { id: 1 },
            },
            {
              data: { currency_code: 'USD', link: 'https://donate2.com' },
              where: { id: 2 },
            },
          ],
        },
        updated_at: currentTime,
      },
      select: {
        id: true,
        donation_links: {
          select: {
            id: true,
            currency_code: true,
            link: true,
          },
        },
      },
    });
  });
});

describe('deleteDonationLink function', () => {
  it('should call verifySession function, not call pjmeDBPrismaClient.DonationLink.delete function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(deleteDonationLink(1)).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.DonationLink.delete).not.toHaveBeenCalled();
  });

  it('should call pjmeDBPrismaClient.DonationLink.delete function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 12 });

    pjmeDBPrismaClient.$transaction.mockResolvedValue([
      { id: 1 },
      { id: 12 },
    ]);
    pjmeDBPrismaClient.DonationLink.delete.mockResolvedValue({ id: 1 });

    await deleteDonationLink(1);

    expect(pjmeDBPrismaClient.DonationLink.delete).toHaveBeenCalledWith({
      where: { id: 1 },
      select: { id: true },
    });
  });
});
