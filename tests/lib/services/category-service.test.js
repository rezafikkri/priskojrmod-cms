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
import UnauthenticatedError from '@/lib/errors/UnauthenticatedError';

beforeAll(() => {
  vi.mock('server-only', () => ({}));

  vi.mock('@/lib/verifySession', () => ({
    default: vi.fn(),
  }));

  vi.mock('@/lib/prisma', () => ({
    default: {
      category: {
        create: vi.fn(),
        delete: vi.fn(),
        update: vi.fn(),
        findUnique: async () => null,
      },
    },
  }));

  vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
  }));
});

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe('createCategory function', () => {
  it('Should call verifySession function, not call prisma.category.create function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(createCategory({ name: 'Tech News' }))
      .rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.category.create).not.toHaveBeenCalled();
  });

  it('Should call prisma.category.create function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853503149);

    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ userId: 1 });

    await createCategory({ name: 'Programming Tips' });

    expect(prisma.category.create).toHaveBeenCalledWith({
      data: {
        name: 'Programming Tips',
        slug: 'programming-tips',
        createdAt: Math.floor(new Date().getTime() / 1000),
        updatedAt: Math.floor(new Date().getTime() / 1000),
      },
      select: { id: true },
    });
  });
});

describe('deleteCategory function', () => {
  it('Should call verifySession function, not call prisma.category.delete function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(deleteCategory(10)).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.category.delete).not.toHaveBeenCalled();
  });

  it('Should call prisma.category.delete function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ userId: 1 });

    await deleteCategory(7);

    expect(prisma.category.delete).toHaveBeenCalledWith({
      where: { id: 7 },
      select: { id: true },
    });
  });
});

describe('updateCategory function', () => {
  it('Should call verifySession function, not call prisma.category.update function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(updateCategory({
      id: 4,
      name: 'Updated Category',
    })).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.category.update).not.toHaveBeenCalled();
  });

  it('Should call prisma.category.update function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853503149);

    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ userId: 1 });

    await updateCategory({
      id: 9,
      name: 'Advanced Dev',
    });

    expect(prisma.category.update).toHaveBeenCalledWith({
      where: { id: 9 },
      data: {
        name: 'Advanced Dev',
        slug: 'advanced-dev',
        updatedAt: Math.floor(new Date().getTime() / 1000),
      },
      select: { id: true },
    });
  });
});
