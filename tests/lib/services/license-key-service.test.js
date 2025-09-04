import {
  describe,
  it,
  expect,
  vi,
  afterEach,
  beforeAll,
} from 'vitest';
import {
  createLicenseKey,
  getLicenseKeys,
  searchLicenseKeys,
  deleteLicenseKey,
  getLicenseKey,
  updateLicenseKey,
  setCanRegenerateLicenseKeys,
} from '@/lib/services/license-key-service';
import UnauthenticatedError from '@/lib/errors/UnauthenticatedError';

beforeAll(() => {
  vi.mock('server-only', () => ({}));

  vi.mock('@/lib/verifySession', () => ({
    default: vi.fn(),
  }));

  vi.mock('@/lib/services/customer-service', () => ({
    getCustomer: async () => ({
      first_name: 'adelina',
      last_name: 'damayanti',
      email: 'adel@gmail.com',
    }),
  }));

  vi.mock('@/lib/pjma-prisma-client', () => ({
    default: {
      LicenseKey: {
        create: vi.fn(),
        delete: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
    },
  }));

  vi.mock('@/lib/pjme-prisma-client', () => ({
    default: {
      Customer: {
        findUnique: vi.fn(),
      },
    },
  }));

  vi.mock('@/lib/services/secret-key-service', () => ({
    getSpecificSecretKey: vi.fn(),
  }));

  vi.mock('jsonwebtoken', () => ({
    default: {
      sign: () => 'jsonwebtoken',
      verify: vi.fn(),
      decode: vi.fn(),
    },
  }));
});

afterEach(() => {
  // Clear mocks before each test to ensure test isolation
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe('createLicenseKey function', () => {
  it('Should call verifySession function, not call pjmaDBPrismaClient.LicenseKey.create function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmaDBPrismaClient = (await import('@/lib/pjma-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(createLicenseKey({
      secret_key_id: '123',
      customer_id: 'customer-id',
      type: 'online',
    })).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(pjmaDBPrismaClient.LicenseKey.create).not.toHaveBeenCalled();
  });

  it('Should call pjmaDBPrismaClient.LicenseKey.create function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853503149);
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmaDBPrismaClient = (await import('@/lib/pjma-prisma-client')).default;
    const { getSpecificSecretKey } = await import('@/lib/services/secret-key-service');

    verifySession.mockResolvedValue({ isAuth: true, userId: '123' });
    getSpecificSecretKey.mockResolvedValue({ key: '123' });
    pjmaDBPrismaClient.LicenseKey.create.mockResolvedValue({ secret_key_id: 1n });

    await createLicenseKey({
      secret_key_id: '2',
      customer_id: 'b86eb08d-02d8-44a2-a3fe-1c18cf35ce3c',
      type: 'online',
    });

    expect(pjmaDBPrismaClient.LicenseKey.create).toHaveBeenCalledWith({
      data: {
        id: expect.any(String),
        secret_key_id: BigInt(2),
        customer_id: 'b86eb08d-02d8-44a2-a3fe-1c18cf35ce3c',
        email: 'adel@gmail.com',
        code: 'jsonwebtoken',
        created_at: BigInt(Math.floor(new Date().getTime() / 1000)),
        updated_at: BigInt(Math.floor(new Date().getTime() / 1000)),
      },
      select: { id: true },
    });
  });
});

describe('getLicenseKeys function', () => {
  it('should call verifySession function, not call pjmaDBPrismaClient.LicenseKey.findMany function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmaDBPrismaClient = (await import('@/lib/pjma-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(getLicenseKeys({ select: {}, pageIndex: 0, pageSize: 10, filters: { secret_key_id: 2 } }))
      .rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(pjmaDBPrismaClient.LicenseKey.findMany).not.toHaveBeenCalled();
  });

  it('should call pjmaDBPrismaClient.LicenseKey.findMany function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmaDBPrismaClient = (await import('@/lib/pjma-prisma-client')).default;
    const jwt = (await import('jsonwebtoken')).default;

    const filters = { secret_key_id: 1, is_revoked: false };
    verifySession.mockResolvedValue({ isAuth: true, userId: 'abc' });
    const mockLicenseKeys = [
      { id: '1', created_at: BigInt(123), updated_at: BigInt(3498), key: 'key1' },
      { id: '2', created_at: BigInt(456), updated_at: BigInt(567), key: 'key2' },
    ];
    pjmaDBPrismaClient.LicenseKey.findMany.mockResolvedValue(mockLicenseKeys);
    jwt.decode.mockReturnValue({ exp: 6789 });

    await getLicenseKeys({
      select: { id: true, key: true },
      pageIndex: 1,
      pageSize: 2,
      filters,
    });

    expect(pjmaDBPrismaClient.LicenseKey.findMany).toHaveBeenCalledWith({
      select: { id: true, key: true },
      orderBy: [
        { updated_at: 'desc' },
        { id: 'desc' },
      ],
      take: 2,
      skip: 2,
      where: {
        secret_key_id: 1n,
        is_revoked: false,
      },
    });
  });
});

describe('searchLicenseKeys function', () => {
  it('should call verifySession function, not call pjmaDBPrismaClient.LicenseKey.findMany function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmaDBPrismaClient = (await import('@/lib/pjma-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(searchLicenseKeys({
      select: {},
      searchKey: 'test',
      searchLimit: 5,
      filters: { secret_key_id: 3 },
    })).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(pjmaDBPrismaClient.LicenseKey.findMany).not.toHaveBeenCalled();
  });

  it('should call pjmaDBPrismaClient.LicenseKey.findMany function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmaDBPrismaClient = (await import('@/lib/pjma-prisma-client')).default;
    const jwt = (await import('jsonwebtoken')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 'abc' });
    const mockLicenseKeys = [
      { id: '1', created_at: BigInt(123), updated_at: BigInt(3498), regenerated_at: BigInt(512), key: 'key1' },
      { id: '2', created_at: BigInt(456), updated_at: BigInt(567), key: 'key2' },
    ];
    pjmaDBPrismaClient.LicenseKey.findMany.mockResolvedValue(mockLicenseKeys);
    jwt.decode.mockReturnValue({ exp: 1234 });

    await searchLicenseKeys({
      select: { id: true, key: true },
      key: 'test',
      limit: 5,
      filters: { secret_key_id: 4, is_revoked: true },
    });

    expect(pjmaDBPrismaClient.LicenseKey.findMany).toHaveBeenCalledWith({
      select: { id: true, key: true },
      where: {
        email: {
          startsWith: 'test',
          mode: 'insensitive',
        },
        secret_key_id: 4n,
        is_revoked: true,
      },
      take: 6,
    });
  });
});

describe('deleteLicenseKey function', () => {
  it('should call verifySession, not call pjmaDBPrismaClient.LicenseKey.delete function and throw with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmaDBPrismaClient = (await import('@/lib/pjma-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(deleteLicenseKey('123')).rejects.toThrowError(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(pjmaDBPrismaClient.LicenseKey.delete).not.toHaveBeenCalled();
  });

  it('should call pjmaDBPrismaClient.LicenseKey.delete function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmaDBPrismaClient = (await import('@/lib/pjma-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 'abc' });

    await deleteLicenseKey('f28fe573-7fc9-4c0f-bd89-c698266fd4cf');

    expect(pjmaDBPrismaClient.LicenseKey.delete).toHaveBeenCalledWith({
      where: { id: 'f28fe573-7fc9-4c0f-bd89-c698266fd4cf' },
      select: { id: true },
    });
  });
});

describe('getLicenseKey function', () => {
  it('Should call verifySession function, not call pjmaDBPrismaClient.LicenseKey.findUnique function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmaDBPrismaClient = (await import('@/lib/pjma-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(getLicenseKey('1')).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(pjmaDBPrismaClient.LicenseKey.findUnique).not.toHaveBeenCalled();
  });

  it('Should call pjmaDBPrismaClient.LicenseKey.findUnique function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmaDBPrismaClient = (await import('@/lib/pjma-prisma-client')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 'admin-id' });

    pjmeDBPrismaClient.Customer.findUnique.mockResolvedValue({
      first_name: 'reza',
      email: 'fikkri.reza@gmail.com',
    });
    pjmaDBPrismaClient.LicenseKey.findUnique.mockResolvedValue({
      id: '33c993ad-097f-499d-9899-61186bb31b72',
      customer_id: '930ee77a-2b41-4099-87a7-28e1f309d73f',
      code: 'fake-key',
      used_for_activate: true,
      secret_key: {
        app_name: 'app-name',
      },
    });

    await getLicenseKey('33c993ad-097f-499d-9899-61186bb31b72');

    expect(pjmaDBPrismaClient.LicenseKey.findUnique).toHaveBeenCalledWith({
      where: { id: '33c993ad-097f-499d-9899-61186bb31b72' },
      select: {
        id: true,
        customer_id: true,
        code: true,
        email: true,
        used_for_activate: true,
        secret_key: {
          select: {
            app_name: true,
          },
        },
      },
    });
  });
});

describe('updateLicenseKey function', () => {
  it('Should call verifySession function, not call pjmaDBPrismaClient.LicenseKey.update function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmaDBPrismaClient = (await import('@/lib/pjma-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(
      updateLicenseKey({
        id: '3f50e7ba-9c3e-4cf1-8a98-77be2c32c71a',
        type: 'online',
        used_for_activate: true,
        change_expiration_date: false,
      })
    ).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(pjmaDBPrismaClient.LicenseKey.update).not.toHaveBeenCalled();
  });

  it('Should call pjmaDBPrismaClient.LicenseKey.update function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853503149); // deterministic timestamp

    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmaDBPrismaClient = (await import('@/lib/pjma-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 'admin-id' });

    pjmaDBPrismaClient.LicenseKey.findUnique.mockResolvedValue(null);

    await updateLicenseKey({
      id: '3f50e7ba-9c3e-4cf1-8a98-77be2c32c71a',
      type: 'online',
      used_for_activate: true,
      change_expiration_date: true,
    });

    expect(pjmaDBPrismaClient.LicenseKey.update).toHaveBeenCalledWith({
      where: { id: '3f50e7ba-9c3e-4cf1-8a98-77be2c32c71a' },
      select: {
        id: true,
      },
      data: {
        updated_at: BigInt(Math.floor(new Date().getTime() / 1000)),
        used_for_activate: true,
      },
    });
  });
});

describe('setCanRegenerateLicenseKeys function', () => {
  it('Should call verifySession function, not call pjmaDBPrismaClient.LicenseKey.updateMany function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmaDBPrismaClient = (await import('@/lib/pjma-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(setCanRegenerateLicenseKeys([
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    ])).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(pjmaDBPrismaClient.LicenseKey.updateMany).not.toHaveBeenCalled();
  });

  it('Should call pjmaDBPrismaClient.LicenseKey.updateMany function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853503149); // deterministic timestamp

    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmaDBPrismaClient = (await import('@/lib/pjma-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 'user-id' });
    pjmaDBPrismaClient.LicenseKey.updateMany.mockResolvedValue({ count: 2 });

    const uuid1 = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const uuid2 = 'b1aebc99-8d0b-4ef8-aa6d-6bb9bd380b22';

    await setCanRegenerateLicenseKeys([uuid1, uuid2]);

    expect(pjmaDBPrismaClient.LicenseKey.updateMany).toHaveBeenCalledWith({
      where: {
        id: { in: [uuid1, uuid2] },
      },
      data: {
        can_regenerate: true,
        updated_at: BigInt(Math.floor(new Date().getTime() / 1000)),
      },
    });
  });
});
