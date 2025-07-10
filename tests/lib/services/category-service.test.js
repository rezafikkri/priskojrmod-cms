import {
  describe,
  it,
  expect,
  vi,
  afterEach,
  beforeAll,
} from 'vitest';
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from '@/lib/services/category-service';

beforeAll(() => {
  vi.mock('server-only', () => ({}));

  vi.mock('@/lib/verifySession', () => ({
    default: vi.fn(),
  }));

  vi.mock('@/lib/pjme-prisma-client', () => ({
    default: {
      Category: {
        create: vi.fn(),
        delete: vi.fn(),
        update: vi.fn(),
      },
    },
  }));
});

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe('createCategory function', () => {
  it('Should call verifySession function, not call pjmeDBPrismaClient.Category.create function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(createCategory({ name: 'Tech News' }))
      .rejects.toThrow('Unauthenticated');

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Category.create).not.toHaveBeenCalled();
  });

  it('Should call pjmeDBPrismaClient.Category.create function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853503149);

    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true });

    await createCategory({ name: 'Programming Tips' });

    expect(pjmeDBPrismaClient.Category.create).toHaveBeenCalledWith({
      data: {
        name: 'Programming Tips',
        slug: 'programming-tips',
        created_at: BigInt(Math.floor(new Date().getTime() / 1000)),
        updated_at: BigInt(Math.floor(new Date().getTime() / 1000)),
      },
      select: { id: true },
    });
  });
});

describe('deleteCategory function', () => {
  it('Should call verifySession function, not call pjmeDBPrismaClient.Category.delete function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(deleteCategory(10)).rejects.toThrow('Unauthenticated');

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Category.delete).not.toHaveBeenCalled();
  });

  it('Should call pjmeDBPrismaClient.Category.delete function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true });

    await deleteCategory(7);

    expect(pjmeDBPrismaClient.Category.delete).toHaveBeenCalledWith({
      where: { id: 7 },
      select: { id: true },
    });
  });
});

describe('updateCategory function', () => {
  it('Should call verifySession function, not call pjmeDBPrismaClient.Category.update function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(updateCategory({
      id: 4,
      name: 'Updated Category',
    })).rejects.toThrow('Unauthenticated');

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Category.update).not.toHaveBeenCalled();
  });

  it('Should call pjmeDBPrismaClient.Category.update function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853503149);

    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true });

    await updateCategory({
      id: 9,
      name: 'Advanced Dev',
    });

    expect(pjmeDBPrismaClient.Category.update).toHaveBeenCalledWith({
      where: { id: 9 },
      data: {
        name: 'Advanced Dev',
        slug: 'advanced-dev',
        updated_at: BigInt(Math.floor(new Date().getTime() / 1000)),
      },
      select: { id: true },
    });
  });
});
