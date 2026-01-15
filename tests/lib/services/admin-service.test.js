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

  vi.mock('@/lib/utils', async (importOriginal) => {
    const original = await importOriginal();

    return {
      ...original,
      isOwnerAdmin: vi.fn(),
    };
  });

  vi.mock('@/lib/prisma', () => ({
    default: {
      admin: {
        findMany: vi.fn(),
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      donationLink: {
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

  vi.mock('@/config/cms', () => ({}));
});

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe('getAdmins function', () => {
  it('should call verifySession function, not call isOwnerAdmin function and prisma.admin.findMany function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const { isOwnerAdmin } = await import('@/lib/utils');
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(getAdmins()).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(isOwnerAdmin).not.toHaveBeenCalled();
    expect(prisma.admin.findMany).not.toHaveBeenCalled();
  });

  it('should call isOwnerAdmin function and not call prisma.admin.findMany function and throw Error with "NotAllowedError" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const { isOwnerAdmin } = await import('@/lib/utils');
    const prisma = (await import('@/lib/prisma')).default;

    // userId smallint
    verifySession.mockResolvedValue({
      userId: 11,
      userRole: AdminRole.STAFF,
    });

    isOwnerAdmin.mockReturnValue(false);

    await expect(getAdmins()).rejects.toThrow(NotAllowedError);

    expect(verifySession).toHaveBeenCalled();
    expect(isOwnerAdmin).toHaveBeenCalledWith(AdminRole.STAFF);
    expect(prisma.admin.findMany).not.toHaveBeenCalled();
  });

  it('should call prisma.admin.findMany function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const { isOwnerAdmin } = await import('@/lib/utils');
    const prisma = (await import('@/lib/prisma')).default;

    // owner id smallint
    verifySession.mockResolvedValue({
      userId: 1,
      userRole: AdminRole.OWNER,
    });

    isOwnerAdmin.mockReturnValue(true);

    // createdAt & updatedAt → epoch time hardcoded (integer)
    prisma.admin.findMany.mockResolvedValue([
      {
        id: 2,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        picture: 'pic.jpg',
        createdAt: 1732250000,
        updatedAt: 1732260000,
      },
    ]);

    await getAdmins();

    expect(prisma.admin.findMany).toHaveBeenCalledWith({
      where: { id: { not: 1 } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        picture: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  });
});

describe('createAdmin function', () => {
  it('should call verifySession function, not call isOwnerAdmin function and prisma.admin.create function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const { isOwnerAdmin } = await import('@/lib/utils');
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    const input = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      whatsappPhoneNumber: { countryIso: 'ID', number: '08123456789' },
      picture: 'https://test.com/pic.jpg',
      donationLinks: [
        { currencyCode: 'IDR', url: '' },
        { currencyCode: 'USD', url: '' },
      ],
    };

    await expect(createAdmin(input)).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(isOwnerAdmin).not.toHaveBeenCalled();
    expect(prisma.admin.create).not.toHaveBeenCalled();
  });

  it('should call isOwnerAdmin function and not call prisma.admin.create function and throw Error with "NotAllowedError" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const { isOwnerAdmin } = await import('@/lib/utils');
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({
      userId: 10,
      userRole: AdminRole.STAFF,
    });

    isOwnerAdmin.mockReturnValue(false);

    const input = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      whatsappPhoneNumber: { countryIso: 'ID', number: '08123456789' },
      picture: 'https://test.com/pic.jpg',
      donationLinks: [
        { currencyCode: 'IDR', url: '' },
        { currencyCode: 'USD', url: '' },
      ],
    };

    await expect(createAdmin(input)).rejects.toThrow(NotAllowedError);

    expect(verifySession).toHaveBeenCalled();
    expect(isOwnerAdmin).toHaveBeenCalledWith(AdminRole.STAFF);
    expect(prisma.admin.create).not.toHaveBeenCalled();
  });

  it('should call prisma.admin.create function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853503149); // fixed time

    const verifySession = (await import('@/lib/verifySession')).default;
    const { isOwnerAdmin } = await import('@/lib/utils');
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({
      userId: 1,
      userRole: AdminRole.OWNER,
    });

    isOwnerAdmin.mockReturnValue(true);

    prisma.admin.create.mockResolvedValue({ id: 2 });

    const input = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      whatsappPhoneNumber: { countryIso: 'ID', number: '08123456789' },
      picture: 'https://test.com/pic.jpg',
      donationLinks: [
        { currencyCode: 'IDR', url: 'https://a.com' },
        { currencyCode: 'USD', url: '' },
      ],
    };

    await createAdmin(input);

    const currentTime = Math.floor(new Date().getTime() / 1000);

    expect(prisma.admin.create).toHaveBeenCalledWith({
      data: {
        role: 'staff',
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        whatsappPhoneNumber: '+628123456789',
        picture: input.picture,
        createdAt: currentTime,
        updatedAt: currentTime,
        donationLinks: {
          create: [
            {
              currencyCode: 'IDR',
              url: 'https://a.com',
            },
          ],
        },
      },
      select: { id: true },
    });
  });
});

describe('getAdmin function', () => {
  it('should call verifySession function, not call isOwnerAdmin function and prisma.admin.findUnique function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const { isOwnerAdmin } = await import('@/lib/utils');
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(getAdmin(5)).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(isOwnerAdmin).not.toHaveBeenCalled();
    expect(prisma.admin.findUnique).not.toHaveBeenCalled();
  });

  it('should call isOwnerAdmin function and not call prisma.admin.findUnique function and throw Error with "NotAllowedError" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const { isOwnerAdmin } = await import('@/lib/utils');
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({
      userId: 10,
      userRole: AdminRole.STAFF,
    });

    isOwnerAdmin.mockReturnValue(false);

    await expect(getAdmin(5)).rejects.toThrow(NotAllowedError);

    expect(verifySession).toHaveBeenCalled();
    expect(isOwnerAdmin).toHaveBeenCalledWith(AdminRole.STAFF);
    expect(prisma.admin.findUnique).not.toHaveBeenCalled();
  });

  it('should call prisma.admin.findUnique function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const { isOwnerAdmin } = await import('@/lib/utils');
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({
      userId: 1,
      userRole: AdminRole.STAFF,
    });

    isOwnerAdmin.mockReturnValue(true);

    prisma.admin.findUnique.mockResolvedValue({
      id: 7,
      firstName: 'Budi',
      lastName: 'Santoso',
      email: 'budi@example.com',
      whatsappPhoneNumber: '+628123456789',
      picture: 'https://images.com/photo.jpg',
      role: AdminRole.STAFF,
      donationLinks: [
        { id: 91, currencyCode: 'IDR', url: 'https://saweria.id/budi' },
        { id: 92, currencyCode: 'USD', url: 'https://ko-fi.com/budi' },
      ],
    });

    await getAdmin(7);

    expect(prisma.admin.findUnique).toHaveBeenCalledWith({
      where: { id: 7 },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        whatsappPhoneNumber: true,
        picture: true,
        role: true,
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

describe('updateAdmin function', () => {
  it('should call verifySession function, not call isOwnerAdmin function, not call prisma.$transaction, not call prisma.admin.update function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const { isOwnerAdmin } = await import('@/lib/utils');
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(updateAdmin({})).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(isOwnerAdmin).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.admin.update).not.toHaveBeenCalled();
  });

  it('should call isOwnerAdmin function, not call prisma.$transaction, not call prisma.admin.update function and throw Error with "NotAllowedError" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const { isOwnerAdmin } = await import('@/lib/utils');
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({
      userRole: AdminRole.STAFF,
    });

    isOwnerAdmin.mockReturnValue(false);

    await expect(updateAdmin({})).rejects.toThrow(NotAllowedError);

    expect(verifySession).toHaveBeenCalled();
    expect(isOwnerAdmin).toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.admin.update).not.toHaveBeenCalled();
  });

  it('should call prisma.$transaction function and prisma.admin.update function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853603149);
    const currentTime = Math.floor(new Date().getTime() / 1000);

    const verifySession = (await import('@/lib/verifySession')).default;
    const { isOwnerAdmin } = await import('@/lib/utils');
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ userRole: AdminRole.OWNER });
    isOwnerAdmin.mockReturnValue(true);

    const input = {
      id: 12,
      firstName: 'Reza',
      lastName: 'Akbar',
      whatsappPhoneNumber: {
        countryIso: 'ID',
        number: '08123456789',
      },
      picture: 'https://example.com/avatar.jpg',
      donationLinks: [
        { dbId: 55, currencyCode: 'IDR', url: 'https://donate.com/1' },
        { dbId: 66, currencyCode: 'USD', url: '' },
      ],
    };

    prisma.$transaction.mockResolvedValue([
      {},
      {
        id: 12,
        donationLinks: [
          { id: 55, currencyCode: 'IDR', url: 'https://donate.com/1' },
        ],
      },
    ]);

    await updateAdmin(input);

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.admin.update).toHaveBeenCalledWith({
      where: { id: 12 },
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        whatsappPhoneNumber: '+628123456789',
        picture: input.picture,
        updatedAt: currentTime,
        donationLinks: {
          update: [
            {
              where: { id: 55 },
              data: {
                currencyCode: 'IDR',
                url: 'https://donate.com/1',
              },
            },
          ],
        },
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

describe('deleteAdmin function', () => {
  it('should call verifySession function, not call isOwnerAdmin function and prisma.admin.delete function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const { isOwnerAdmin } = await import('@/lib/utils');
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(deleteAdmin(1)).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(isOwnerAdmin).not.toHaveBeenCalled();
    expect(prisma.admin.delete).not.toHaveBeenCalled();
  });

  it('should call isOwnerAdmin function and not call prisma.admin.delete function and throw Error with "NotAllowedError" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const { isOwnerAdmin } = await import('@/lib/utils');
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ userRole: AdminRole.STAFF });
    isOwnerAdmin.mockReturnValue(false);

    await expect(deleteAdmin(1)).rejects.toThrow(NotAllowedError);

    expect(verifySession).toHaveBeenCalled();
    expect(isOwnerAdmin).toHaveBeenCalledWith(AdminRole.STAFF);
    expect(prisma.admin.delete).not.toHaveBeenCalled();
  });

  it('should call prisma.admin.delete function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const { isOwnerAdmin } = await import('@/lib/utils');
    const prisma = (await import('@/lib/prisma')).default;
    const { revalidatePath } = await import('next/cache');

    verifySession.mockResolvedValue({ userRole: AdminRole.OWNER });
    isOwnerAdmin.mockReturnValue(true);

    prisma.admin.delete.mockResolvedValue({ id: 10 });

    const result = await deleteAdmin(10);

    expect(prisma.admin.delete).toHaveBeenCalledWith({
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
  it('should call verifySession function, not call isOwnerAdmin function, not call prisma.$transaction, not call prisma.donationLink.delete function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const { isOwnerAdmin } = await import('@/lib/utils');
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(deleteDonationLink(1, 2)).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(isOwnerAdmin).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.donationLink.delete).not.toHaveBeenCalled();
  });

  it('should call isOwnerAdmin function and not call prisma.$transaction, not call prisma.donationLink.delete function and throw Error with "NotAllowedError" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const { isOwnerAdmin } = await import('@/lib/utils');
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ userRole: AdminRole.STAFF });
    isOwnerAdmin.mockReturnValue(false);

    await expect(deleteDonationLink(1, 2)).rejects.toThrow(NotAllowedError);

    expect(verifySession).toHaveBeenCalled();
    expect(isOwnerAdmin).toHaveBeenCalledWith(AdminRole.STAFF);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.donationLink.delete).not.toHaveBeenCalled();
  });

  it('should call prisma.donationLink.delete function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853703149);
    const currentTime = Math.floor(new Date().getTime() / 1000);

    const verifySession = (await import('@/lib/verifySession')).default;
    const { isOwnerAdmin } = await import('@/lib/utils');
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ userRole: AdminRole.OWNER });
    isOwnerAdmin.mockReturnValue(true);

    const donationLinkId = 100;
    const adminId = 10;

    prisma.$transaction.mockResolvedValue([
      { id: donationLinkId },
      { id: adminId },
    ]);

    await deleteDonationLink(donationLinkId, adminId);

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.donationLink.delete).toHaveBeenCalledWith({
      where: { id: donationLinkId },
      select: { id: true },
    });

    expect(prisma.admin.update).toHaveBeenCalledWith({
      where: { id: adminId },
      data: { updatedAt: currentTime },
      select: { id: true },
    });
  });
});
