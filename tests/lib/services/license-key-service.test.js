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

beforeAll(() => {
  vi.mock('server-only', () => ({}));

  vi.mock('@/lib/verifySession', () => ({
    default: vi.fn(),
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
      name: 'reza',
      email: 're@co.co',
      type: 'online',
    })).rejects.toThrow('Unauthenticated');

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
      name: 'adel',
      email: 'adel@gmail.com',
      type: 'online',
    });

    expect(pjmaDBPrismaClient.LicenseKey.create).toHaveBeenCalledWith({
      data: {
        secret_key_id: BigInt(2),
        email: 'adel@gmail.com',
        key: 'jsonwebtoken',
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
      .rejects.toThrow('Unauthenticated');

    expect(verifySession).toHaveBeenCalled();
    expect(pjmaDBPrismaClient.LicenseKey.findMany).not.toHaveBeenCalled();
  });

  it('should call pjmaDBPrismaClient.LicenseKey.findMany function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmaDBPrismaClient = (await import('@/lib/pjma-prisma-client')).default;
    const jwt = (await import('jsonwebtoken')).default;

    const filters = { secret_key_id: 1 };
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
      orderBy: { updated_at: 'desc' },
      take: 2,
      skip: 2,
      where: {
        secret_key_id: 1n,
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
    })).rejects.toThrow('Unauthenticated');

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
      filters: { secret_key_id: 4 },
    });

    expect(pjmaDBPrismaClient.LicenseKey.findMany).toHaveBeenCalledWith({
      select: { id: true, key: true },
      where: {
        email: {
          startsWith: 'test',
          mode: 'insensitive',
        },
        secret_key_id: 4n,
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

    await expect(deleteLicenseKey('123')).rejects.toThrowError('Unauthenticated');

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

    await expect(getLicenseKey('1')).rejects.toThrow('Unauthenticated');

    expect(verifySession).toHaveBeenCalled();
    expect(pjmaDBPrismaClient.LicenseKey.findUnique).not.toHaveBeenCalled();
  });

  it('Should call pjmaDBPrismaClient.LicenseKey.findUnique function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmaDBPrismaClient = (await import('@/lib/pjma-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 'admin-id' });

    pjmaDBPrismaClient.LicenseKey.findUnique.mockResolvedValue({
      id: '33c993ad-097f-499d-9899-61186bb31b72',
      secret_key_id: BigInt(123456),
      email: 'test@example.com',
      key: 'fake-key',
      used_for_activate: true,
      used_for_download: false,
    });

    await getLicenseKey('33c993ad-097f-499d-9899-61186bb31b72');

    expect(pjmaDBPrismaClient.LicenseKey.findUnique).toHaveBeenCalledWith({
      where: { id: '33c993ad-097f-499d-9899-61186bb31b72' },
      select: {
        id: true,
        secret_key_id: true,
        email: true,
        key: true,
        used_for_activate: true,
        used_for_download: true,
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
        old_key: 'old-key',
        old_secret_key_id: '1',
        secret_key_id: '1',
        name: 'Test Name',
        type: 'online',
        used_for_activate: true,
        used_for_download: false,
        change_expiration_date: false,
      })
    ).rejects.toThrow('Unauthenticated');

    expect(verifySession).toHaveBeenCalled();
    expect(pjmaDBPrismaClient.LicenseKey.update).not.toHaveBeenCalled();
  });

  it('Should call pjmaDBPrismaClient.LicenseKey.update function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853503149); // deterministic timestamp

    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmaDBPrismaClient = (await import('@/lib/pjma-prisma-client')).default;
    const { getSpecificSecretKey } = await import('@/lib/services/secret-key-service');
    const jwt = (await import('jsonwebtoken')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 'admin-id' });

    getSpecificSecretKey.mockResolvedValue({ key: 'secret-key' });
    jwt.verify.mockReturnValue({
      name: 'Old Name',
      email: 'test@example.com',
      type: 'online',
      exp: 1234567890,
    });

    pjmaDBPrismaClient.LicenseKey.update.mockResolvedValue({
      key: 'jsonwebtoken',
      secret_key_id: BigInt(1),
    });

    await updateLicenseKey({
      id: '3f50e7ba-9c3e-4cf1-8a98-77be2c32c71a',
      old_key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30',
      old_secret_key_id: '1',
      secret_key_id: '2',
      name: 'New Name',
      type: 'online',
      used_for_activate: true,
      used_for_download: false,
      change_expiration_date: true,
    });

    expect(pjmaDBPrismaClient.LicenseKey.update).toHaveBeenCalledWith({
      where: { id: '3f50e7ba-9c3e-4cf1-8a98-77be2c32c71a' },
      select: {
        key: true,
        secret_key_id: true,
      },
      data: {
        secret_key_id: BigInt(2),
        updated_at: BigInt(Math.floor(new Date().getTime() / 1000)),
        used_for_activate: true,
        used_for_download: false,
        key: 'jsonwebtoken',
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
    ])).rejects.toThrow('Unauthenticated');

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
