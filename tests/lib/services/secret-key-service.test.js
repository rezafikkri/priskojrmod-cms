import {
  describe,
  it,
  expect,
  vi,
  afterEach,
  beforeAll,
} from 'vitest';
import {
  createSecretKey,
  updateAppName,
  deleteSecretKey,
  getSecretKeys,
  getSpecificSecretKey,
  getSecretKey,
  saveRegeneratedSecretKey,
} from '@/lib/services/secret-key-service';
import UnauthenticatedError from '@/lib/errors/UnauthenticatedError';

beforeAll(() => {
  vi.mock('server-only', () => ({}));

  vi.mock('@/lib/verifySession', () => ({
    default: vi.fn(),
  }));

  vi.mock('@/lib/pjma-prisma-client', () => ({
    default: {
      SecretKeyLicense: {
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
      Product: {
        findUnique: vi.fn(),
      },
    },
  }));
});

afterEach(() => {
  // Clear mocks before each test to ensure test isolation
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe('createSecretKey function', () => {
  it('Should call verifySession function, not call pjmaDBPrismaClient.SecretKeyLicense.create function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmaDBPrismaClient = (await import('@/lib/pjma-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(createSecretKey({
      key: 'test-key',
      app_name: 'test-app',
    })).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(pjmaDBPrismaClient.SecretKeyLicense.create).not.toHaveBeenCalled();
  });

  it('Should call pjmaDBPrismaClient.SecretKeyLicense.create function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853503149);

    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmaDBPrismaClient = (await import('@/lib/pjma-prisma-client')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: '123' });
    pjmaDBPrismaClient.SecretKeyLicense.create.mockResolvedValue({ id: 1 });
    pjmeDBPrismaClient.Product.findUnique.mockResolvedValue({ name: 'Product Name' });

    await createSecretKey({
      product_id: '24dd4d78-ead8-45b8-bfa5-e2bb289cb4d2',
      key: '8f23fcc4c918eb26c991b3950c79a243a6b0d683c2e58e0d31fc367b652e2b05',
    });

    expect(pjmaDBPrismaClient.SecretKeyLicense.create).toHaveBeenCalledWith({
      data: {
        key: '8f23fcc4c918eb26c991b3950c79a243a6b0d683c2e58e0d31fc367b652e2b05',
        app_name: 'Product Name',
        product_id: '24dd4d78-ead8-45b8-bfa5-e2bb289cb4d2',
        created_at: Math.floor(new Date().getTime() / 1000),
      },
      select: { id: true },
    });
  });
});

describe('updateAppName function', () => {
  it('Should call verifySession function, not call pjmaDBPrismaClient.SecretKeyLicense.update function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmaDBPrismaClient = (await import('@/lib/pjma-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(
      updateAppName({
        product_id: '24dd4d78-ead8-45b8-bfa5-e2bb289cb4d2',
        name: 'New Product Name',
      }),
    ).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(pjmaDBPrismaClient.SecretKeyLicense.updateMany).not.toHaveBeenCalled();
  });

  it('Should call pjmaDBPrismaClient.SecretKeyLicense.update function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmaDBPrismaClient = (await import('@/lib/pjma-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 'user-id' });

    await updateAppName({
      product_id: '24dd4d78-ead8-45b8-bfa5-e2bb289cb4d2',
      name: 'Updated Name',
    });

    expect(pjmaDBPrismaClient.SecretKeyLicense.updateMany).toHaveBeenCalledWith({
      where: { product_id: '24dd4d78-ead8-45b8-bfa5-e2bb289cb4d2' },
      data: { app_name: 'Updated Name' },
    });
  });
});

describe('deleteSecretKey function', () => {
  it('Should call verifySession function, not call pjmaDBPrismaClient.SecretKeyLicense.delete function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmaDBPrismaClient = (await import('@/lib/pjma-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(deleteSecretKey('1')).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(pjmaDBPrismaClient.SecretKeyLicense.delete).not.toHaveBeenCalled();
  });

  it('Should call pjmaDBPrismaClient.SecretKeyLicense.delete function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmaDBPrismaClient = (await import('@/lib/pjma-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: '123' });
    pjmaDBPrismaClient.SecretKeyLicense.delete.mockResolvedValue({
      id: 2,
    });

    await deleteSecretKey('1');

    expect(pjmaDBPrismaClient.SecretKeyLicense.delete).toHaveBeenCalledWith({
      where: { id: 1 },
      select: {
        id: true,
      },
    });
  });
});

describe('getSecretKeys function', () => {
  it('should call verifySession function, not call pjmaDBPrismaClient.SecretKeyLicense.findMany function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmaDBPrismaClient = (await import('@/lib/pjma-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(getSecretKeys({
      id: true,
      app_name: true,
    })).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(pjmaDBPrismaClient.SecretKeyLicense.findMany).not.toHaveBeenCalled();
  });

  it('should call pjmaDBPrismaClient.LicenseKey.findMany function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmaDBPrismaClient = (await import('@/lib/pjma-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: '123' });
    pjmaDBPrismaClient.SecretKeyLicense.findMany.mockResolvedValue([{
      id: 2,
      app_name: '12345',
    }]);

    await getSecretKeys({
      id: true,
      app_name: true,
    });

    expect(pjmaDBPrismaClient.SecretKeyLicense.findMany).toHaveBeenCalledWith({
      select: {
        id: true,
        app_name: true,
      },
      orderBy: { created_at: 'desc' },
    });
  });
});

describe('getSpecificSecretKey function', () => {
  it('should call verifySession function, not call pjmaDBPrismaClient.SecretKeyLicense.findUnique function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmaDBPrismaClient = (await import('@/lib/pjma-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(getSpecificSecretKey(
      '1',
      { key: true },
    )).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(pjmaDBPrismaClient.SecretKeyLicense.findUnique).not.toHaveBeenCalled();
  });

  it('should call pjmaDBPrismaClient.LicenseKey.findUnique function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmaDBPrismaClient = (await import('@/lib/pjma-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: '123' });
    pjmaDBPrismaClient.SecretKeyLicense.findUnique.mockResolvedValue({
      key: '12345',
    });

    await getSpecificSecretKey(
      2,
      { key: true },
    );

    expect(pjmaDBPrismaClient.SecretKeyLicense.findUnique).toHaveBeenCalledWith({
      where: { id: 2 },
      select: { key: true },
    });
  });
});

describe('getSecretKey function', () => {
  it('should call verifySession function, not call pjmaDBPrismaClient.SecretKeyLicense.findUnique function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmaDBPrismaClient = (await import('@/lib/pjma-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(getSecretKey('123')).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(pjmaDBPrismaClient.SecretKeyLicense.findUnique).not.toHaveBeenCalled();
  });

  it('should call pjmaDBPrismaClient.SecretKeyLicense.findUnique function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmaDBPrismaClient = (await import('@/lib/pjma-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 'user-id' });

    pjmaDBPrismaClient.SecretKeyLicense.findUnique.mockResolvedValue({
      id: 123,
      app_name: 'Test App',
      key: 'secret-key-value',
    });

    await getSecretKey('123');

    expect(verifySession).toHaveBeenCalled();
    expect(pjmaDBPrismaClient.SecretKeyLicense.findUnique).toHaveBeenCalledWith({
      where: { id: 123 },
      select: {
        id: true,
        app_name: true,
        key: true,
      },
    });
  });
});

describe('saveRegeneratedSecretKey function', () => {
  it('Should call verifySession function, not call pjmaDBPrismaClient.SecretKeyLicense.update function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmaDBPrismaClient = (await import('@/lib/pjma-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(saveRegeneratedSecretKey({
      id: '123',
      key: 'a'.repeat(64),
    })).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(pjmaDBPrismaClient.SecretKeyLicense.update).not.toHaveBeenCalled();
  });

  it('Should call pjmaDBPrismaClient.SecretKeyLicense.update function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853503149);

    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmaDBPrismaClient = (await import('@/lib/pjma-prisma-client')).default;

    const regeneratedKey = '6f927ec4f37c8a99880ad233b9d9cf7ea539b58b99bd7e21d7bcd2f4a7d9123e';

    verifySession.mockResolvedValue({ isAuth: true, userId: 'user-id' });

    pjmaDBPrismaClient.SecretKeyLicense.update.mockResolvedValue({
      key: regeneratedKey,
    });

    await saveRegeneratedSecretKey({
      id: '123',
      key: regeneratedKey,
    });

    expect(verifySession).toHaveBeenCalled();
    expect(pjmaDBPrismaClient.SecretKeyLicense.update).toHaveBeenCalledWith({
      where: { id: 123 },
      data: {
        key: regeneratedKey,
        regenerated_at: Math.floor(new Date().getTime() / 1000),
      },
      select: { key: true },
    });
  });
});
