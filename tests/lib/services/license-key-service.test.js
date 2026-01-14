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

  vi.mock('@/lib/prisma', () => ({
    default: {
      secretKey: {
        findUnique: vi.fn(),
      },
      licenseKey: {
        create: vi.fn(),
        delete: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
      customer: {
        findFirst: vi.fn(),
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

  vi.mock('@/config/cms', () => ({}));
});

afterEach(() => {
  // Clear mocks before each test to ensure test isolation
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe('createLicenseKey function', () => {
  it('Should call verifySession function, not call prisma.licenseKey.create function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(createLicenseKey({
      secret_key_id: '123',
      customer_id: 'customer-id',
      type: 'online',
    })).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.licenseKey.create).not.toHaveBeenCalled();
  });

  it('Should call prisma.licenseKey.create function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853503149);
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;
    const { getSpecificSecretKey } = await import('@/lib/services/secret-key-service');

    verifySession.mockResolvedValue({ isAuth: true, userId: '123' });
    getSpecificSecretKey.mockResolvedValue({ key: '123' });
    prisma.customer.findFirst.mockResolvedValue({
      firstName: 'test',
      lastName: 'gege',
      email: 'test@g.com',
    });
    prisma.secretKey.findUnique.mockResolvedValue({ key: 'test' });
    prisma.licenseKey.create.mockResolvedValue({ secret_key_id: 1 });

    await createLicenseKey({
      secret_key_id: '2',
      customer_id: 'b86eb08d-02d8-44a2-a3fe-1c18cf35ce3c',
      type: 'online',
    });

    expect(prisma.licenseKey.create).toHaveBeenCalledWith({
      data: {
        id: expect.any(String),
        secret_key_id: 2,
        customer_id: 'b86eb08d-02d8-44a2-a3fe-1c18cf35ce3c',
        code: 'jsonwebtoken',
        created_at: Math.floor(new Date().getTime() / 1000),
        updated_at: Math.floor(new Date().getTime() / 1000),
      },
      select: { id: true },
    });
  });
});

describe('getLicenseKeys function', () => {
  it('should call verifySession function, not call prisma.licenseKey.findMany function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(getLicenseKeys({ select: {}, pageIndex: 0, pageSize: 10, filters: { secret_key_id: 2 } }))
      .rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.licenseKey.findMany).not.toHaveBeenCalled();
  });

  it('should call prisma.licenseKey.findMany function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;
    const jwt = (await import('jsonwebtoken')).default;

    const filters = { secret_key_id: 1, is_revoked: false };
    verifySession.mockResolvedValue({ isAuth: true, userId: 'abc' });
    const mocklicenseKeys = [
      { id: '1', created_at: 123, updated_at: 3498, key: 'key1' },
      { id: '2', created_at: 456, updated_at: 567, key: 'key2' },
    ];
    prisma.licenseKey.findMany.mockResolvedValue(mocklicenseKeys);
    jwt.decode.mockReturnValue({ exp: 6789 });

    await getLicenseKeys({
      pageIndex: 1,
      pageSize: 2,
      filters,
    });

    expect(prisma.licenseKey.findMany).toHaveBeenCalledWith({
      select: {
        id: true,
        device_id: true,
        code: true,
        is_revoked: true,
        created_at: true,
        updated_at: true,
        regenerated_at: true,
        secretKey: {
          select: {
            product: {
              select: { name: true },
            },
          },
        },
        customer: {
          select: { email: true },
        },
      },
      orderBy: [
        { updated_at: 'desc' },
        { id: 'desc' },
      ],
      take: 2,
      skip: 2,
      where: {
        secret_key_id: 1,
        is_revoked: false,
      },
    });
  });
});

describe('searchLicenseKeys function', () => {
  it('should call verifySession function, not call prisma.licenseKey.findMany function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(searchLicenseKeys({
      searchKey: 'test',
      searchLimit: 5,
      filters: { secret_key_id: 3 },
    })).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.licenseKey.findMany).not.toHaveBeenCalled();
  });

  it('should call prisma.licenseKey.findMany function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;
    const jwt = (await import('jsonwebtoken')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 'abc' });
    const mocklicenseKeys = [
      { id: '1', created_at: 123, updated_at: 3498, regenerated_at: 512, key: 'key1' },
      { id: '2', created_at: 456, updated_at: 567, key: 'key2' },
    ];
    prisma.licenseKey.findMany.mockResolvedValue(mocklicenseKeys);
    jwt.decode.mockReturnValue({ exp: 1234 });

    await searchLicenseKeys({
      key: 'test',
      limit: 5,
      filters: { secret_key_id: 4, is_revoked: true },
    });

    expect(prisma.licenseKey.findMany).toHaveBeenCalledWith({
      select: {
        id: true,
        device_id: true,
        code: true,
        is_revoked: true,
        created_at: true,
        updated_at: true,
        regenerated_at: true,
        secretKey: {
          select: {
            product: {
              select: { name: true },
            },
          },
        },
        customer: {
          select: { email: true },
        },
      },
      where: {
        customer: {
          email: {
            startsWith: 'test',
            mode: 'insensitive',
          },
        },
        secret_key_id: 4,
        is_revoked: true,
      },
      take: 6,
    });
  });
});

describe('deleteLicenseKey function', () => {
  it('should call verifySession, not call prisma.licenseKey.delete function and throw with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(deleteLicenseKey('123')).rejects.toThrowError(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.licenseKey.delete).not.toHaveBeenCalled();
  });

  it('should call prisma.licenseKey.delete function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 'abc' });

    await deleteLicenseKey('f28fe573-7fc9-4c0f-bd89-c698266fd4cf');

    expect(prisma.licenseKey.delete).toHaveBeenCalledWith({
      where: { id: 'f28fe573-7fc9-4c0f-bd89-c698266fd4cf' },
      select: { id: true },
    });
  });
});

describe('getLicenseKey function', () => {
  it('Should call verifySession function, not call prisma.licenseKey.findUnique function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(getLicenseKey('1')).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.licenseKey.findUnique).not.toHaveBeenCalled();
  });

  it('Should call prisma.licenseKey.findUnique function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 'admin-id' });

    prisma.licenseKey.findUnique.mockResolvedValue({
      id: '33c993ad-097f-499d-9899-61186bb31b72',
      code: 'fake-key',
      customer: {
        firstName: 'test',
        lastName: 'gege',
        email: 'test@g.com',
      },
      secretKey: {
        product: {
          name: 'app-name',
        },
      },
    });

    await getLicenseKey('33c993ad-097f-499d-9899-61186bb31b72');

    expect(prisma.licenseKey.findUnique).toHaveBeenCalledWith({
      where: { id: '33c993ad-097f-499d-9899-61186bb31b72' },
      select: {
        id: true,
        code: true,
        reset_count: true,
        last_reset_period: true,
        secretKey: {
          select: {
            product: {
              select: { name: true },
            },
          },
        },
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  });
});

describe('updateLicenseKey function', () => {
  it('Should call verifySession function, not call prisma.licenseKey.update function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(
      updateLicenseKey({
        id: '3f50e7ba-9c3e-4cf1-8a98-77be2c32c71a',
        type: 'online',
        change_expiration_date: false,
      })
    ).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.licenseKey.update).not.toHaveBeenCalled();
  });

  it('Should call prisma.licenseKey.update function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853503149); // deterministic timestamp

    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 'admin-id' });

    prisma.licenseKey.findUnique.mockResolvedValue(null);

    await updateLicenseKey({
      id: '3f50e7ba-9c3e-4cf1-8a98-77be2c32c71a',
      type: 'online',
      change_expiration_date: true,
    });

    expect(prisma.licenseKey.update).toHaveBeenCalledWith({
      where: { id: '3f50e7ba-9c3e-4cf1-8a98-77be2c32c71a' },
      select: {
        id: true,
      },
      data: {
        updated_at: Math.floor(new Date().getTime() / 1000),
      },
    });
  });
});

describe('setCanRegenerateLicenseKeys function', () => {
  it('Should call verifySession function, not call prisma.licenseKey.updateMany function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(setCanRegenerateLicenseKeys([
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    ])).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.licenseKey.updateMany).not.toHaveBeenCalled();
  });

  it('Should call prisma.licenseKey.updateMany function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853503149); // deterministic timestamp

    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 'user-id' });
    prisma.licenseKey.updateMany.mockResolvedValue({ count: 2 });

    const uuid1 = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const uuid2 = 'b1aebc99-8d0b-4ef8-aa6d-6bb9bd380b22';

    await setCanRegenerateLicenseKeys([uuid1, uuid2]);

    expect(prisma.licenseKey.updateMany).toHaveBeenCalledWith({
      where: {
        id: { in: [uuid1, uuid2] },
      },
      data: {
        can_regenerate: true,
        updated_at: Math.floor(new Date().getTime() / 1000),
      },
    });
  });
});
