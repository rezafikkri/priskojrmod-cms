import {
  describe,
  it,
  expect,
  vi,
  afterEach,
  beforeAll,
} from 'vitest';
import {
  createCustomer,
  getCustomers,
  searchCustomers,
  getCustomer,
  updateCustomer,
  updateCustomerBanStatus,
  getCustomerSuggestions,
  deleteCustomer,
} from '@/lib/services/customer-service';
import UnauthenticatedError from '@/lib/errors/UnauthenticatedError';

beforeAll(() => {
  vi.mock('server-only', () => ({}));

  vi.mock('@/lib/verifySession', () => ({
    default: vi.fn(),
  }));

  vi.mock('@/lib/prisma', () => ({
    default: {
      customer: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      licenseKey: {
        deleteMany: () => {},
        count: () => 0,
        updateMany: () => {},
      },
    },
  }));

  vi.mock('@/config/cms', () => ({}));
});

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe('createCustomer function', () => {
  it('Should call verifySession function, not call prisma.customer.create function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(
      createCustomer({
        firstName: 'Reza',
        lastName: 'Setiawan',
        email: 'reza@domain.com',
        picture: null,
      }),
    ).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.customer.create).not.toHaveBeenCalled();
  });

  it('Should call prisma.customer.create function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853503149); // Mocked timestamp

    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ userId: 1 });

    prisma.customer.create.mockResolvedValue({ id: 'e65385e2-25a1-4ef9-940f-a33b6450f462' });

    await createCustomer({
      firstName: 'Adel',
      lastName: 'Putra',
      email: 'adel@gmail.com',
      picture: 'https://example.com/avatar.png',
    });

    expect(prisma.customer.create).toHaveBeenCalledWith({
      data: {
        firstName: 'Adel',
        lastName: 'Putra',
        email: 'adel@gmail.com',
        picture: 'https://example.com/avatar.png',
        createdAt: Math.floor(new Date().getTime() / 1000),
        updatedAt: Math.floor(new Date().getTime() / 1000),
      },
      select: { id: true },
    });
  });
});

describe('getCustomers function', () => {
  it('should call verifySession function, not call prisma.customer.findMany function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(
      getCustomers({
        select: { id: true, firstName: true },
        pageIndex: 0,
        pageSize: 10,
        filters: {},
      })
    ).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.customer.findMany).not.toHaveBeenCalled();
  });

  it('should call prisma.customer.findMany function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ userId: 1 });

    prisma.customer.findMany.mockResolvedValue([
      {
        id: '344fa7a4-fe6f-4632-97b5-1fe9b9d9a424',
        firstName: 'Reza',
        lastName: 'Setiawan',
        createdAt: 1744853503,
        updatedAt: 1744853599,
        lastActive: 1744853699,
      },
    ]);

    await getCustomers({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        updatedAt: true,
        lastActive: true,
      },
      pageIndex: 0,
      pageSize: 10,
      filters: { isBanned: false },
    });

    expect(prisma.customer.findMany).toHaveBeenCalledWith({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        updatedAt: true,
        lastActive: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      skip: 0,
      where: { isBanned: false },
    });
  });
});

describe('searchCustomers function', () => {
  it('should call verifySession function, not call prisma.customer.findMany function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(
      searchCustomers({
        key: 're',
        select: { id: true, email: true, firstName: true },
        limit: 10,
        filters: { isBanned: false },
      }),
    ).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.customer.findMany).not.toHaveBeenCalled();
  });

  it('should call prisma.customer.findMany function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ userId: 1 });

    prisma.customer.findMany.mockResolvedValue([
      {
        id: 'f094e3f7-a479-4768-be14-b464ac3ee3f1',
        email: 'reza@example.com',
        firstName: 'Reza',
        lastName: 'Setiawan',
        isBanned: false,
        createdAt: 1744853503,
        updatedAt: 1744853599,
        lastActive: 1744853699,
      },
    ]);

    await searchCustomers({
      key: 'reza',
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isBanned: true,
        createdAt: true,
        updatedAt: true,
        lastActive: true,
      },
      limit: 10,
      filters: { isBanned: false },
    });

    expect(prisma.customer.findMany).toHaveBeenCalledWith({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isBanned: true,
        createdAt: true,
        updatedAt: true,
        lastActive: true,
      },
      where: {
        email: {
          startsWith: 'reza',
          mode: 'insensitive',
        },
        isBanned: false,
      },
      take: 11, // limit + 1
    });
  });
});

describe('getCustomer function', () => {
  it('Should call verifySession function, not call prisma.customer.findFirst function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(
      getCustomer({ id: 'f094e3f7-a479-4768-be14-b464ac3ee3f1' })
    ).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.customer.findFirst).not.toHaveBeenCalled();
  });

  it('Should call prisma.customer.findFirst function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ userId: 1 });

    prisma.customer.findFirst.mockResolvedValue({ id: 'f094e3f7-a479-4768-be14-b464ac3ee3f1' });

    await getCustomer({ id: 'f094e3f7-a479-4768-be14-b464ac3ee3f1' });

    expect(prisma.customer.findFirst).toHaveBeenCalledWith({
      where: { id: 'f094e3f7-a479-4768-be14-b464ac3ee3f1' },
      select: {
        id: true,
        isBanned: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        picture: true,
      },
    });
  });
});

describe('updateCustomer function', () => {
  it('Should call verifySession function, not call prisma.customer.update function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(
      updateCustomer({
        id: 'fa156c2c-e2c3-412f-93f5-5f8bf9ce2b7e',
        firstName: 'Reza',
        lastName: 'Setiawan',
        email: 'reza@x.com',
        picture: null,
      }),
    ).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.customer.update).not.toHaveBeenCalled();
  });

  it('Should call prisma.customer.update function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853503149);

    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ userId: 1 });

    // Return that the customer is still banned
    prisma.customer.findUnique.mockResolvedValue({
      isBanned: true,
    });

    prisma.customer.update.mockResolvedValue({ id: 'fa156c2c-e2c3-412f-93f5-5f8bf9ce2b7e' });

    await updateCustomer({
      id: 'fa156c2c-e2c3-412f-93f5-5f8bf9ce2b7e',
      firstName: 'Adel',
      lastName: 'Putra',
      email: 'adel@domain.com',
      picture: 'https://image.com/avatar.png',
    });

    const currentTime = Math.floor(new Date().getTime() / 1000);

    expect(prisma.customer.update).toHaveBeenCalledWith({
      where: { id: 'fa156c2c-e2c3-412f-93f5-5f8bf9ce2b7e' },
      data: {
        firstName: 'Adel',
        lastName: 'Putra',
        picture: 'https://image.com/avatar.png',
        email: 'adel@domain.com',
        updatedAt: currentTime,
      },
      select: { id: true },
    });
  });
});

describe('updateCustomerBanStatus function', () => {
  it('Should call verifySession function, not call prisma.customer.update function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(
      updateCustomerBanStatus('c705f67d-4f2b-45f7-99fd-2fc193f5e000', true)
    ).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.customer.update).not.toHaveBeenCalled();
  });

  it('Should call prisma.customer.update function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853503149);

    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ userId: 1 });

    prisma.customer.update.mockResolvedValue({ id: 'c705f67d-4f2b-45f7-99fd-2fc193f5e000' });

    await updateCustomerBanStatus('c705f67d-4f2b-45f7-99fd-2fc193f5e000', true);

    expect(prisma.customer.update).toHaveBeenCalledWith({
      where: { id: 'c705f67d-4f2b-45f7-99fd-2fc193f5e000' },
      data: {
        isBanned: true,
        updatedAt: Math.floor(new Date().getTime() / 1000),
      },
      select: { id: true },
    });
  });
});

describe('getCustomerSuggestions function', () => {
  it('should call verifySession function, not call prisma.customer.findMany function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(
      getCustomerSuggestions('example')
    ).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.customer.findMany).not.toHaveBeenCalled();
  });

  it('should call prisma.customer.findMany function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ userId: 1 });

    prisma.customer.findMany.mockResolvedValue([
      { id: '1', firstName: 'Alice', email: 'alice@mail.com' },
      { id: '2', firstName: 'Bob', email: 'bob@mail.com' },
    ]);

    await getCustomerSuggestions('a');

    expect(prisma.customer.findMany).toHaveBeenCalledWith({
      where: {
        email: {
          startsWith: 'a',
          mode: 'insensitive',
        },
        isBanned: false,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
      take: 10,
    });
  });
});

describe('deleteCustomer function', () => {
  it('should call verifySession, not call prisma.customer.delete function and throw with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(null);

    await expect(deleteCustomer('28c841fc-8efb-4469-b7c9-d3c90b417e60')).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.customer.delete).not.toHaveBeenCalled();
  });

  it('should call prisma.customer.delete function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    const fakeId = '28c841fc-8efb-4469-b7c9-d3c90b417e60';

    verifySession.mockResolvedValue({ userId: 1 });

    prisma.customer.findFirst.mockResolvedValue({
      isBanned: true,
      googleUserId: null,
      lastActive: Math.floor(Date.now() / 1000) - 999999,
    });

    prisma.customer.delete.mockResolvedValue({ id: fakeId });

    await deleteCustomer(fakeId);

    expect(prisma.customer.delete).toHaveBeenCalledWith({
      where: { id: fakeId },
      select: { id: true },
    });
  });
});
