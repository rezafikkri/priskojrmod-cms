import {
  describe,
  it,
  expect,
  vi,
  afterEach,
  beforeAll,
} from 'vitest';
import UnauthenticatedError from '@/lib/errors/UnauthenticatedError';
import NotAllowedError from '@/lib/errors/NotAllowedError';
import { AdminRole } from '@/constants/enums';
import {
  getAdmins,
  createAdmin,
  getAdmin,
  updateAdmin,
  deleteAdmin,
  deleteDonationLink,
} from '@/lib/services/admin-service';

beforeAll(() => {
  vi.mock('server-only', () => ({}));

  vi.mock('@/lib/verifySession', () => ({
    default: vi.fn(),
  }));

  vi.mock('@/lib/utils', () => ({
    isOwnerAdmin: vi.fn(),
  }));

  vi.mock('@/lib/pjme-prisma-client', () => ({
    default: {
      Admin: {
        findMany: vi.fn(),
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      DonationLink: {
        deleteMany: vi.fn(),
        delete: vi.fn(),
      },
      $transaction: vi.fn(),
    },
  }));

  vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
  }));

  vi.mock('libphonenumber-js', () => ({
    default: () => ({
      country: 'ID',
      number: '+628123456789',
      isValid: () => true,
    }),
  }));
});

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe('getAdmins function', () => {
  it('should call verifySession function, not call isOwnerAdmin function and pjmeDBPrismaClient.Admin.findMany function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const { isOwnerAdmin } = await import('@/lib/utils');
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(getAdmins()).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(isOwnerAdmin).not.toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Admin.findMany).not.toHaveBeenCalled();
  });

  it('should call isOwnerAdmin function and not call pjmeDBPrismaClient.Admin.findMany function and throw Error with "NotAllowedError" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const { isOwnerAdmin } = await import('@/lib/utils');
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    // userId smallint
    verifySession.mockResolvedValue({
      isAuth: true,
      userId: 11,
      userRole: AdminRole.STAFF,
    });

    isOwnerAdmin.mockReturnValue(false);

    await expect(getAdmins()).rejects.toThrow(NotAllowedError);

    expect(verifySession).toHaveBeenCalled();
    expect(isOwnerAdmin).toHaveBeenCalledWith(AdminRole.STAFF);
    expect(pjmeDBPrismaClient.Admin.findMany).not.toHaveBeenCalled();
  });

  it('should call pjmeDBPrismaClient.Admin.findMany function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const { isOwnerAdmin } = await import('@/lib/utils');
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    // owner id smallint
    verifySession.mockResolvedValue({
      isAuth: true,
      userId: 1,
      userRole: AdminRole.OWNER,
    });

    isOwnerAdmin.mockReturnValue(true);

    // created_at & updated_at → epoch time hardcoded (integer)
    pjmeDBPrismaClient.Admin.findMany.mockResolvedValue([
      {
        id: 2,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        picture: 'pic.jpg',
        created_at: 1732250000,
        updated_at: 1732260000,
      },
    ]);

    await getAdmins();

    expect(pjmeDBPrismaClient.Admin.findMany).toHaveBeenCalledWith({
      where: { id: { not: 1 } },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        picture: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { updated_at: 'desc' },
    });
  });
});

describe('createAdmin function', () => {
  it('should call verifySession function, not call isOwnerAdmin function and pjmeDBPrismaClient.Admin.create function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const { isOwnerAdmin } = await import('@/lib/utils');
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    const input = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      whatsapp_phone_number: { country_iso: 'ID', number: '08123456789' },
      picture: 'https://test.com/pic.jpg',
      donation_links: [
        { currency_code: 'IDR', link: '' },
        { currency_code: 'USD', link: '' },
      ],
    };

    await expect(createAdmin(input)).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(isOwnerAdmin).not.toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Admin.create).not.toHaveBeenCalled();
  });

  it('should call isOwnerAdmin function and not call pjmeDBPrismaClient.Admin.create function and throw Error with "NotAllowedError" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const { isOwnerAdmin } = await import('@/lib/utils');
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({
      isAuth: true,
      userId: 10,
      userRole: AdminRole.STAFF,
    });

    isOwnerAdmin.mockReturnValue(false);

    const input = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      whatsapp_phone_number: { country_iso: 'ID', number: '08123456789' },
      picture: 'https://test.com/pic.jpg',
      donation_links: [
        { currency_code: 'IDR', link: '' },
        { currency_code: 'USD', link: '' },
      ],
    };

    await expect(createAdmin(input)).rejects.toThrow(NotAllowedError);

    expect(verifySession).toHaveBeenCalled();
    expect(isOwnerAdmin).toHaveBeenCalledWith(AdminRole.STAFF);
    expect(pjmeDBPrismaClient.Admin.create).not.toHaveBeenCalled();
  });

  it('should call pjmeDBPrismaClient.Admin.create function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853503149); // fixed time

    const verifySession = (await import('@/lib/verifySession')).default;
    const { isOwnerAdmin } = await import('@/lib/utils');
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({
      isAuth: true,
      userId: 1,
      userRole: AdminRole.OWNER,
    });

    isOwnerAdmin.mockReturnValue(true);

    pjmeDBPrismaClient.Admin.create.mockResolvedValue({ id: 2 });

    const input = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      whatsapp_phone_number: { country_iso: 'ID', number: '08123456789' },
      picture: 'https://test.com/pic.jpg',
      donation_links: [
        { currency_code: 'IDR', link: 'https://a.com' },
        { currency_code: 'USD', link: '' },
      ],
    };

    await createAdmin(input);

    const currentTime = Math.floor(new Date().getTime() / 1000);

    expect(pjmeDBPrismaClient.Admin.create).toHaveBeenCalledWith({
      data: {
        role: 'staff',
        first_name: input.first_name,
        last_name: input.last_name,
        email: input.email,
        whatsapp_phone_number: '+628123456789',
        picture: input.picture,
        created_at: currentTime,
        updated_at: currentTime,
        donation_links: {
          create: [
            {
              currency_code: 'IDR',
              link: 'https://a.com',
            },
          ],
        },
      },
      select: { id: true },
    });
  });
});

describe('getAdmin function', () => {
  it('should call verifySession function, not call isOwnerAdmin function and pjmeDBPrismaClient.Admin.findUnique function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const { isOwnerAdmin } = await import('@/lib/utils');
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(getAdmin(5)).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(isOwnerAdmin).not.toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Admin.findUnique).not.toHaveBeenCalled();
  });

  it('should call isOwnerAdmin function and not call pjmeDBPrismaClient.Admin.findUnique function and throw Error with "NotAllowedError" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const { isOwnerAdmin } = await import('@/lib/utils');
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({
      isAuth: true,
      userId: 10,
      userRole: AdminRole.STAFF,
    });

    isOwnerAdmin.mockReturnValue(false);

    await expect(getAdmin(5)).rejects.toThrow(NotAllowedError);

    expect(verifySession).toHaveBeenCalled();
    expect(isOwnerAdmin).toHaveBeenCalledWith(AdminRole.STAFF);
    expect(pjmeDBPrismaClient.Admin.findUnique).not.toHaveBeenCalled();
  });

  it('should call pjmeDBPrismaClient.Admin.findUnique function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const { isOwnerAdmin } = await import('@/lib/utils');
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({
      isAuth: true,
      userId: 1,
      userRole: AdminRole.STAFF,
    });

    isOwnerAdmin.mockReturnValue(true);

    pjmeDBPrismaClient.Admin.findUnique.mockResolvedValue({
      id: 7,
      first_name: 'Budi',
      last_name: 'Santoso',
      email: 'budi@example.com',
      whatsapp_phone_number: '+628123456789',
      picture: 'https://images.com/photo.jpg',
      role: AdminRole.STAFF,
      donation_links: [
        { id: 91, currency_code: 'IDR', link: 'https://saweria.id/budi' },
        { id: 92, currency_code: 'USD', link: 'https://ko-fi.com/budi' },
      ],
    });

    await getAdmin(7);

    expect(pjmeDBPrismaClient.Admin.findUnique).toHaveBeenCalledWith({
      where: { id: 7 },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        whatsapp_phone_number: true,
        picture: true,
        role: true,
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

describe('updateAdmin function', () => {
  it('should call verifySession function, not call isOwnerAdmin function, not call pjmeDBPrismaClient.$transaction, not call pjmeDBPrismaClient.Admin.update function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const { isOwnerAdmin } = await import('@/lib/utils');
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(updateAdmin({})).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(isOwnerAdmin).not.toHaveBeenCalled();
    expect(pjmeDBPrismaClient.$transaction).not.toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Admin.update).not.toHaveBeenCalled();
  });

  it('should call isOwnerAdmin function, not call pjmeDBPrismaClient.$transaction, not call pjmeDBPrismaClient.Admin.update function and throw Error with "NotAllowedError" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const { isOwnerAdmin } = await import('@/lib/utils');
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({
      userRole: AdminRole.STAFF,
    });

    isOwnerAdmin.mockReturnValue(false);

    await expect(updateAdmin({})).rejects.toThrow(NotAllowedError);

    expect(verifySession).toHaveBeenCalled();
    expect(isOwnerAdmin).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.$transaction).not.toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Admin.update).not.toHaveBeenCalled();
  });

  it('should call pjmeDBPrismaClient.$transaction function and pjmeDBPrismaClient.Admin.update function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853603149);
    const currentTime = Math.floor(new Date().getTime() / 1000);

    const verifySession = (await import('@/lib/verifySession')).default;
    const { isOwnerAdmin } = await import('@/lib/utils');
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({ userRole: AdminRole.OWNER });
    isOwnerAdmin.mockReturnValue(true);

    const input = {
      id: 12,
      first_name: 'Reza',
      last_name: 'Akbar',
      whatsapp_phone_number: {
        country_iso: 'ID',
        number: '08123456789',
      },
      picture: 'https://example.com/avatar.jpg',
      donation_links: [
        { dbId: 55, currency_code: 'IDR', link: 'https://donate.com/1' },
        { dbId: 66, currency_code: 'USD', link: '' },
      ],
    };

    pjmeDBPrismaClient.$transaction.mockResolvedValue([
      {},
      {
        id: 12,
        donation_links: [
          { id: 55, currency_code: 'IDR', link: 'https://donate.com/1' },
        ],
      },
    ]);

    await updateAdmin(input);

    expect(pjmeDBPrismaClient.$transaction).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Admin.update).toHaveBeenCalledWith({
      where: { id: 12 },
      data: {
        first_name: input.first_name,
        last_name: input.last_name,
        whatsapp_phone_number: '+628123456789',
        picture: input.picture,
        updated_at: currentTime,
        donation_links: {
          update: [
            {
              where: { id: 55 },
              data: {
                currency_code: 'IDR',
                link: 'https://donate.com/1',
              },
            },
          ],
        },
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

describe('deleteAdmin function', () => {
  it('should call verifySession function, not call isOwnerAdmin function and pjmeDBPrismaClient.Admin.delete function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const { isOwnerAdmin } = await import('@/lib/utils');
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(deleteAdmin(1)).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(isOwnerAdmin).not.toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Admin.delete).not.toHaveBeenCalled();
  });

  it('should call isOwnerAdmin function and not call pjmeDBPrismaClient.Admin.delete function and throw Error with "NotAllowedError" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const { isOwnerAdmin } = await import('@/lib/utils');
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({ userRole: AdminRole.STAFF });
    isOwnerAdmin.mockReturnValue(false);

    await expect(deleteAdmin(1)).rejects.toThrow(NotAllowedError);

    expect(verifySession).toHaveBeenCalled();
    expect(isOwnerAdmin).toHaveBeenCalledWith(AdminRole.STAFF);
    expect(pjmeDBPrismaClient.Admin.delete).not.toHaveBeenCalled();
  });

  it('should call pjmeDBPrismaClient.Admin.delete function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const { isOwnerAdmin } = await import('@/lib/utils');
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;
    const { revalidatePath } = await import('next/cache');

    verifySession.mockResolvedValue({ userRole: AdminRole.OWNER });
    isOwnerAdmin.mockReturnValue(true);

    pjmeDBPrismaClient.Admin.delete.mockResolvedValue({ id: 10 });

    const result = await deleteAdmin(10);

    expect(pjmeDBPrismaClient.Admin.delete).toHaveBeenCalledWith({
      where: {
        id: 10,
        role: { not: AdminRole.OWNER },
      },
      select: { id: true },
    });

    expect(revalidatePath).toHaveBeenCalledWith('/admin');
    expect(result).toEqual({ id: 10 });
  });
});

describe('deleteDonationLink function', () => {
  it('should call verifySession function, not call isOwnerAdmin function, not call pjmeDBPrismaClient.$transaction, not call pjmeDBPrismaClient.DonationLink.delete function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const { isOwnerAdmin } = await import('@/lib/utils');
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(deleteDonationLink(1, 2)).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(isOwnerAdmin).not.toHaveBeenCalled();
    expect(pjmeDBPrismaClient.$transaction).not.toHaveBeenCalled();
    expect(pjmeDBPrismaClient.DonationLink.delete).not.toHaveBeenCalled();
  });

  it('should call isOwnerAdmin function and not call pjmeDBPrismaClient.$transaction, not call pjmeDBPrismaClient.DonationLink.delete function and throw Error with "NotAllowedError" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const { isOwnerAdmin } = await import('@/lib/utils');
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({ userRole: AdminRole.STAFF });
    isOwnerAdmin.mockReturnValue(false);

    await expect(deleteDonationLink(1, 2)).rejects.toThrow(NotAllowedError);

    expect(verifySession).toHaveBeenCalled();
    expect(isOwnerAdmin).toHaveBeenCalledWith(AdminRole.STAFF);
    expect(pjmeDBPrismaClient.$transaction).not.toHaveBeenCalled();
    expect(pjmeDBPrismaClient.DonationLink.delete).not.toHaveBeenCalled();
  });

  it('should call pjmeDBPrismaClient.DonationLink.delete function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853703149);
    const currentTime = Math.floor(new Date().getTime() / 1000);

    const verifySession = (await import('@/lib/verifySession')).default;
    const { isOwnerAdmin } = await import('@/lib/utils');
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({ userRole: AdminRole.OWNER });
    isOwnerAdmin.mockReturnValue(true);

    const donationLinkId = 100;
    const adminId = 10;

    pjmeDBPrismaClient.$transaction.mockResolvedValue([
      { id: donationLinkId },
      { id: adminId },
    ]);

    await deleteDonationLink(donationLinkId, adminId);

    expect(pjmeDBPrismaClient.$transaction).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.DonationLink.delete).toHaveBeenCalledWith({
      where: { id: donationLinkId },
      select: { id: true },
    });

    expect(pjmeDBPrismaClient.Admin.update).toHaveBeenCalledWith({
      where: { id: adminId },
      data: { updated_at: currentTime },
      select: { id: true },
    });
  });
});
