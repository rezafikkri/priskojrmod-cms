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
  getCustomersForAutocomplete,
  deleteCustomer,
} from '@/lib/services/customer-service';
import UnauthenticatedError from '@/lib/errors/UnauthenticatedError';

beforeAll(() => {
  vi.mock('server-only', () => ({}));

  vi.mock('@/lib/verifySession', () => ({
    default: vi.fn(),
  }));

  vi.mock('@/lib/pjme-prisma-client', () => ({
    default: {
      Customer: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    },
  }));

  vi.mock('@/lib/pjma-prisma-client', () => ({
    default: {
      LicenseKey: {
        deleteMany: () => {},
        count: () => 0,
        updateMany: () => {},
      },
    },
  }));
});

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe('createCustomer function', () => {
  it('Should call verifySession function, not call pjmeDBPrismaClient.Customer.create function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(
      createCustomer({
        first_name: 'Reza',
        last_name: 'Setiawan',
        email: 'reza@domain.com',
        picture: null,
      }),
    ).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Customer.create).not.toHaveBeenCalled();
  });

  it('Should call pjmeDBPrismaClient.Customer.create function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853503149); // Mocked timestamp

    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 'user-id' });

    pjmeDBPrismaClient.Customer.create.mockResolvedValue({ id: 'e65385e2-25a1-4ef9-940f-a33b6450f462' });

    await createCustomer({
      first_name: 'Adel',
      last_name: 'Putra',
      email: 'adel@gmail.com',
      picture: 'https://example.com/avatar.png',
    });

    expect(pjmeDBPrismaClient.Customer.create).toHaveBeenCalledWith({
      data: {
        first_name: 'Adel',
        last_name: 'Putra',
        email: 'adel@gmail.com',
        picture: 'https://example.com/avatar.png',
        created_at: Math.floor(new Date().getTime() / 1000),
        updated_at: Math.floor(new Date().getTime() / 1000),
      },
      select: { id: true },
    });
  });
});

describe('getCustomers function', () => {
  it('should call verifySession function, not call pjmeDBPrismaClient.Customer.findMany function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(
      getCustomers({
        select: { id: true, first_name: true },
        pageIndex: 0,
        pageSize: 10,
        filters: {},
      })
    ).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Customer.findMany).not.toHaveBeenCalled();
  });

  it('should call pjmeDBPrismaClient.Customer.findMany function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 'user-id' });

    pjmeDBPrismaClient.Customer.findMany.mockResolvedValue([
      {
        id: '344fa7a4-fe6f-4632-97b5-1fe9b9d9a424',
        first_name: 'Reza',
        last_name: 'Setiawan',
        created_at: 1744853503,
        updated_at: 1744853599,
        last_active: 1744853699,
      },
    ]);

    await getCustomers({
      select: {
        id: true,
        first_name: true,
        last_name: true,
        created_at: true,
        updated_at: true,
        last_active: true,
      },
      pageIndex: 0,
      pageSize: 10,
      filters: { is_banned: false },
    });

    expect(pjmeDBPrismaClient.Customer.findMany).toHaveBeenCalledWith({
      select: {
        id: true,
        first_name: true,
        last_name: true,
        created_at: true,
        updated_at: true,
        last_active: true,
      },
      orderBy: { updated_at: 'desc' },
      take: 10,
      skip: 0,
      where: { is_banned: false },
    });
  });
});

describe('searchCustomers function', () => {
  it('should call verifySession function, not call pjmeDBPrismaClient.Customer.findMany function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(
      searchCustomers({
        key: 're',
        select: { id: true, email: true, first_name: true },
        limit: 10,
        filters: { is_banned: false },
      }),
    ).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Customer.findMany).not.toHaveBeenCalled();
  });

  it('should call pjmeDBPrismaClient.Customer.findMany function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 'user-id' });

    pjmeDBPrismaClient.Customer.findMany.mockResolvedValue([
      {
        id: 'f094e3f7-a479-4768-be14-b464ac3ee3f1',
        email: 'reza@example.com',
        first_name: 'Reza',
        last_name: 'Setiawan',
        is_banned: false,
        created_at: 1744853503,
        updated_at: 1744853599,
        last_active: 1744853699,
      },
    ]);

    await searchCustomers({
      key: 'reza',
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        is_banned: true,
        created_at: true,
        updated_at: true,
        last_active: true,
      },
      limit: 10,
      filters: { is_banned: false },
    });

    expect(pjmeDBPrismaClient.Customer.findMany).toHaveBeenCalledWith({
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        is_banned: true,
        created_at: true,
        updated_at: true,
        last_active: true,
      },
      where: {
        email: {
          startsWith: 'reza',
          mode: 'insensitive',
        },
        is_banned: false,
      },
      take: 11, // limit + 1
    });
  });
});

describe('getCustomer function', () => {
  it('Should call verifySession function, not call pjmeDBPrismaClient.Customer.findFirst function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(
      getCustomer({ id: 'f094e3f7-a479-4768-be14-b464ac3ee3f1' })
    ).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Customer.findFirst).not.toHaveBeenCalled();
  });

  it('Should call pjmeDBPrismaClient.Customer.findFirst function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 'user-id' });

    pjmeDBPrismaClient.Customer.findFirst.mockResolvedValue({ id: 'f094e3f7-a479-4768-be14-b464ac3ee3f1' });

    await getCustomer({ id: 'f094e3f7-a479-4768-be14-b464ac3ee3f1' });

    expect(pjmeDBPrismaClient.Customer.findFirst).toHaveBeenCalledWith({
      where: { id: 'f094e3f7-a479-4768-be14-b464ac3ee3f1' },
      select: {
        id: true,
        is_banned: true,
        first_name: true,
        last_name: true,
        email: true,
        phone_number: true,
        picture: true,
      },
    });
  });
});

describe('updateCustomer function', () => {
  it('Should call verifySession function, not call pjmeDBPrismaClient.Customer.update function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(
      updateCustomer({
        id: 'fa156c2c-e2c3-412f-93f5-5f8bf9ce2b7e',
        first_name: 'Reza',
        last_name: 'Setiawan',
        email: 'reza@x.com',
        picture: null,
      }),
    ).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Customer.update).not.toHaveBeenCalled();
  });

  it('Should call pjmeDBPrismaClient.Customer.update function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853503149);

    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 'user-id' });

    // Return that the customer is still banned
    pjmeDBPrismaClient.Customer.findUnique.mockResolvedValue({
      is_banned: true,
    });

    pjmeDBPrismaClient.Customer.update.mockResolvedValue({ id: 'fa156c2c-e2c3-412f-93f5-5f8bf9ce2b7e' });

    await updateCustomer({
      id: 'fa156c2c-e2c3-412f-93f5-5f8bf9ce2b7e',
      first_name: 'Adel',
      last_name: 'Putra',
      email: 'adel@domain.com',
      picture: 'https://image.com/avatar.png',
    });

    const currentTime = Math.floor(new Date().getTime() / 1000);

    expect(pjmeDBPrismaClient.Customer.update).toHaveBeenCalledWith({
      where: { id: 'fa156c2c-e2c3-412f-93f5-5f8bf9ce2b7e' },
      data: {
        first_name: 'Adel',
        last_name: 'Putra',
        picture: 'https://image.com/avatar.png',
        email: 'adel@domain.com',
        updated_at: currentTime,
      },
      select: { id: true },
    });
  });
});

describe('updateCustomerBanStatus function', () => {
  it('Should call verifySession function, not call pjmeDBPrismaClient.Customer.update function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(
      updateCustomerBanStatus('c705f67d-4f2b-45f7-99fd-2fc193f5e000', true)
    ).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Customer.update).not.toHaveBeenCalled();
  });

  it('Should call pjmeDBPrismaClient.Customer.update function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853503149);

    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 'user-id' });

    pjmeDBPrismaClient.Customer.update.mockResolvedValue({ id: 'c705f67d-4f2b-45f7-99fd-2fc193f5e000' });

    await updateCustomerBanStatus('c705f67d-4f2b-45f7-99fd-2fc193f5e000', true);

    expect(pjmeDBPrismaClient.Customer.update).toHaveBeenCalledWith({
      where: { id: 'c705f67d-4f2b-45f7-99fd-2fc193f5e000' },
      data: {
        is_banned: true,
        updated_at: Math.floor(new Date().getTime() / 1000),
      },
      select: { id: true },
    });
  });
});

describe('getCustomersForAutocomplete function', () => {
  it('should call verifySession function, not call pjmeDBPrismaClient.Customer.findMany function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(
      getCustomersForAutocomplete('example')
    ).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Customer.findMany).not.toHaveBeenCalled();
  });

  it('should call pjmeDBPrismaClient.Customer.findMany function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true });

    pjmeDBPrismaClient.Customer.findMany.mockResolvedValue([
      { id: '1', first_name: 'Alice', email: 'alice@mail.com' },
      { id: '2', first_name: 'Bob', email: 'bob@mail.com' },
    ]);

    await getCustomersForAutocomplete('a');

    expect(pjmeDBPrismaClient.Customer.findMany).toHaveBeenCalledWith({
      where: {
        email: {
          startsWith: 'a',
          mode: 'insensitive',
        },
        is_banned: false,
      },
      select: {
        id: true,
        first_name: true,
        email: true,
      },
      take: 10,
    });
  });
});

describe('deleteCustomer function', () => {
  it('should call verifySession, not call pjmeDBPrismaClient.Customer.delete function and throw with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(null);

    await expect(deleteCustomer('28c841fc-8efb-4469-b7c9-d3c90b417e60')).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Customer.delete).not.toHaveBeenCalled();
  });

  it('should call pjmeDBPrismaClient.Customer.delete function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    const fakeId = '28c841fc-8efb-4469-b7c9-d3c90b417e60';

    verifySession.mockResolvedValue({ isAuth: true });

    pjmeDBPrismaClient.Customer.findFirst.mockResolvedValue({
      is_banned: true,
      oauth_id: null,
      last_active: Math.floor(Date.now() / 1000) - 999999,
    });

    pjmeDBPrismaClient.Customer.delete.mockResolvedValue({ id: fakeId });

    await deleteCustomer(fakeId);

    expect(pjmeDBPrismaClient.Customer.delete).toHaveBeenCalledWith({
      where: { id: fakeId },
      select: { id: true },
    });
  });
});
