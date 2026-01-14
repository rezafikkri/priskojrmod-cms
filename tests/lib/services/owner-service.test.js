import {
  describe,
  it,
  expect,
  vi,
  afterEach,
  beforeAll,
} from 'vitest';
import {
  createOwner,
  deleteOwner,
  updateOwner,
} from '@/lib/services/owner-service';
import UnauthenticatedError from '@/lib/errors/UnauthenticatedError';

beforeAll(() => {
  vi.mock('server-only', () => ({}));

  vi.mock('@/lib/verifySession', () => ({
    default: vi.fn(),
  }));

  vi.mock('@/lib/prisma', () => ({
    default: {
      owner: {
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

describe('createOwner function', () => {
  it('Should call verifySession function, not call prisma.owner.create function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(createOwner({
      firstName: 'John',
      lastName: 'Doe',
      smProfileUrl: 'https://www.instagram.com/fikkrireza',
      picture: 'https://example.com/pic.jpg',
    })).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.owner.create).not.toHaveBeenCalled();
  });

  it('Should call prisma.owner.create function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853503149);

    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 'user-id' });

    await createOwner({
      firstName: 'Jane',
      lastName: 'Smith',
      smProfileUrl: 'https://www.instagram.com/fikkrireza',
      picture: 'https://example.com/image.jpg',
    });

    expect(prisma.owner.create).toHaveBeenCalledWith({
      data: {
        firstName: 'Jane',
        lastName: 'Smith',
        smProfileUrl: 'https://www.instagram.com/fikkrireza',
        picture: 'https://example.com/image.jpg',
        createdAt: Math.floor(new Date().getTime() / 1000),
        updatedAt: Math.floor(new Date().getTime() / 1000),
      },
      select: { id: true },
    });
  });
});

describe('deleteOwner function', () => {
  it('Should call verifySession function, not call prisma.owner.delete function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(deleteOwner(1)).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.owner.delete).not.toHaveBeenCalled();
  });

  it('Should call prisma.owner.delete function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ isAuth: true });

    await deleteOwner(5);

    expect(prisma.owner.delete).toHaveBeenCalledWith({
      where: { id: 5 },
      select: { id: true },
    });
  });
});

describe('updateOwner function', () => {
  it('Should call verifySession function, not call prisma.owner.update function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(updateOwner({
      id: 1,
      firstName: 'Updated',
      lastName: 'Owner',
      smProfileUrl: 'https://www.instagram.com/fikkrireza',
      picture: 'https://updated.com/pic.jpg',
    })).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.owner.update).not.toHaveBeenCalled();
  });

  it('Should call prisma.owner.update function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853503149);

    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ isAuth: true });

    await updateOwner({
      id: 2,
      firstName: 'Budi',
      lastName: 'Santoso',
      smProfileUrl: 'https://www.instagram.com/fikkrireza',
      picture: 'https://example.com/budi.jpg',
    });

    expect(prisma.owner.update).toHaveBeenCalledWith({
      where: { id: 2 },
      data: {
        firstName: 'Budi',
        lastName: 'Santoso',
        smProfileUrl: 'https://www.instagram.com/fikkrireza',
        picture: 'https://example.com/budi.jpg',
        updatedAt: Math.floor(new Date().getTime() / 1000),
      },
      select: { id: true },
    });
  });
});
