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
  deleteSecretKey,
  getSecretKeys,
  getSecretKey,
  saveRegeneratedSecretKey,
} from '@/lib/services/secret-key-service';
import UnauthenticatedError from '@/lib/errors/UnauthenticatedError';

beforeAll(() => {
  vi.mock('server-only', () => ({}));

  vi.mock('@/lib/verifySession', () => ({
    default: vi.fn(),
  }));

  vi.mock('@/lib/prisma', () => ({
    default: {
      secretKey: {
        create: vi.fn(),
        delete: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
      product: {
        findUnique: vi.fn(),
      },
    },
  }));

  vi.mock('next/cache', () => ({
    revalidatePath: () => {},
  }));
});

afterEach(() => {
  // Clear mocks before each test to ensure test isolation
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe('createSecretKey function', () => {
  it('Should call verifySession function, not call prisma.secretKey.create function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(createSecretKey({
      key: 'test-key',
    })).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.secretKey.create).not.toHaveBeenCalled();
  });

  it('Should call prisma.secretKey.create function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853503149);

    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ userId: 1 });

    prisma.secretKey.create.mockResolvedValue({ id: 1 });
    prisma.product.findUnique.mockResolvedValue({ name: 'Product Name' });

    await createSecretKey({
      productId: '24dd4d78-ead8-45b8-bfa5-e2bb289cb4d2',
      key: '8f23fcc4c918eb26c991b3950c79a243a6b0d683c2e58e0d31fc367b652e2b05',
    });

    expect(prisma.secretKey.create).toHaveBeenCalledWith({
      data: {
        key: '8f23fcc4c918eb26c991b3950c79a243a6b0d683c2e58e0d31fc367b652e2b05',
        productId: '24dd4d78-ead8-45b8-bfa5-e2bb289cb4d2',
        createdAt: Math.floor(new Date().getTime() / 1000),
      },
      select: { id: true },
    });
  });
});

describe('deleteSecretKey function', () => {
  it('Should call verifySession function, not call prisma.secretKey.delete function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(deleteSecretKey('1')).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.secretKey.delete).not.toHaveBeenCalled();
  });

  it('Should call prisma.secretKey.delete function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ userId: 1 });
    prisma.secretKey.delete.mockResolvedValue({
      id: 2,
    });

    await deleteSecretKey('1');

    expect(prisma.secretKey.delete).toHaveBeenCalledWith({
      where: { id: 1 },
      select: {
        id: true,
      },
    });
  });
});

describe('getSecretKeys function', () => {
  it('should call verifySession function, not call prisma.secretKey.findMany function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(getSecretKeys({
      id: true,
      product: {
        select: { name: true },
      },
    })).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.secretKey.findMany).not.toHaveBeenCalled();
  });

  it('should call prisma.LicenseKey.findMany function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ userId: 1 });
    prisma.secretKey.findMany.mockResolvedValue([{
      id: 2,
      product: {
        name: '12345',
      },
    }]);

    await getSecretKeys({
      id: true,
      product: {
        select: { name: true },
      },
    });

    expect(prisma.secretKey.findMany).toHaveBeenCalledWith({
      select: {
        id: true,
        regeneratedAt: true,
        key: true,
        createdAt: true,
        product: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  });
});

describe('getSecretKey function', () => {
  it('should call verifySession function, not call prisma.secretKey.findUnique function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(getSecretKey('123')).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.secretKey.findUnique).not.toHaveBeenCalled();
  });

  it('should call prisma.secretKey.findUnique function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ userId: 1 });

    prisma.secretKey.findUnique.mockResolvedValue({
      id: 123,
      product: {
        name: 'Test App',
      },
      key: 'secret-key-value',
    });

    await getSecretKey('123');

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.secretKey.findUnique).toHaveBeenCalledWith({
      where: { id: 123 },
      select: {
        id: true,
        product: {
          select: { name: true },
        },
        key: true,
      },
    });
  });
});

describe('saveRegeneratedSecretKey function', () => {
  it('Should call verifySession function, not call prisma.secretKey.update function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(saveRegeneratedSecretKey({
      id: '123',
      key: 'a'.repeat(64),
    })).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.secretKey.update).not.toHaveBeenCalled();
  });

  it('Should call prisma.secretKey.update function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853503149);

    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    const regeneratedKey = '6f927ec4f37c8a99880ad233b9d9cf7ea539b58b99bd7e21d7bcd2f4a7d9123e';

    verifySession.mockResolvedValue({ userId: 1 });

    prisma.secretKey.update.mockResolvedValue({
      key: regeneratedKey,
    });

    await saveRegeneratedSecretKey({
      id: '123',
      key: regeneratedKey,
    });

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.secretKey.update).toHaveBeenCalledWith({
      where: { id: 123 },
      data: {
        key: regeneratedKey,
        regeneratedAt: Math.floor(new Date().getTime() / 1000),
      },
      select: { key: true },
    });
  });
});
