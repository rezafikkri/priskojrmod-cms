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

beforeAll(() => {
  vi.mock('server-only', () => ({}));

  vi.mock('@/lib/verifySession', () => ({
    default: vi.fn(),
  }));

  vi.mock('@/lib/pjme-prisma-client', () => ({
    default: {
      Owner: {
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
  it('Should call verifySession function, not call pjmeDBPrismaClient.Owner.create function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(createOwner({
      first_name: 'John',
      last_name: 'Doe',
      sm_username: 'johndoe123',
      picture: 'https://example.com/pic.jpg',
    })).rejects.toThrow('Unauthenticated');

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Owner.create).not.toHaveBeenCalled();
  });

  it('Should call pjmeDBPrismaClient.Owner.create function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853503149);

    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 'user-id' });

    await createOwner({
      first_name: 'Jane',
      last_name: 'Smith',
      sm_username: 'janesmith',
      picture: 'https://example.com/image.jpg',
    });

    expect(pjmeDBPrismaClient.Owner.create).toHaveBeenCalledWith({
      data: {
        first_name: 'Jane',
        last_name: 'Smith',
        sm_username: 'janesmith',
        picture: 'https://example.com/image.jpg',
        created_at: BigInt(Math.floor(new Date().getTime() / 1000)),
        updated_at: BigInt(Math.floor(new Date().getTime() / 1000)),
      },
      select: { id: true },
    });
  });
});

describe('deleteOwner function', () => {
  it('Should call verifySession function, not call pjmeDBPrismaClient.Owner.delete function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(deleteOwner(1)).rejects.toThrow('Unauthenticated');

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Owner.delete).not.toHaveBeenCalled();
  });

  it('Should call pjmeDBPrismaClient.Owner.delete function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true });

    await deleteOwner(5);

    expect(pjmeDBPrismaClient.Owner.delete).toHaveBeenCalledWith({
      where: { id: 5 },
      select: { id: true },
    });
  });
});

describe('updateOwner function', () => {
  it('Should call verifySession function, not call pjmeDBPrismaClient.Owner.update function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(updateOwner({
      id: 1,
      first_name: 'Updated',
      last_name: 'Owner',
      sm_username: 'updatedowner',
      picture: 'https://updated.com/pic.jpg',
    })).rejects.toThrow('Unauthenticated');

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Owner.update).not.toHaveBeenCalled();
  });

  it('Should call pjmeDBPrismaClient.Owner.update function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853503149);

    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true });

    await updateOwner({
      id: 2,
      first_name: 'Budi',
      last_name: 'Santoso',
      sm_username: 'budisantoso',
      picture: 'https://example.com/budi.jpg',
    });

    expect(pjmeDBPrismaClient.Owner.update).toHaveBeenCalledWith({
      where: { id: 2 },
      data: {
        first_name: 'Budi',
        last_name: 'Santoso',
        sm_username: 'budisantoso',
        picture: 'https://example.com/budi.jpg',
        updated_at: BigInt(Math.floor(new Date().getTime() / 1000)),
      },
      select: { id: true },
    });
  });
});
