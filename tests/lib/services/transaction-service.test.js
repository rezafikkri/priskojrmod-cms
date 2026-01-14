import {
  describe,
  it,
  expect,
  vi,
  afterEach,
  beforeAll,
} from 'vitest';
import UnauthenticatedError from '@/lib/errors/UnauthenticatedError';
import {
  getTransactions,
  searchTransactions,
  getTransactionDetails,
  updateTransactionStatus,
  correctTransactionStatus,
  generateConfirmationMessage,
  generateTransactionExport,
} from '@/lib/services/transaction-service';
import { TransactionStatus, ShareMethod, CurrencyCode } from '@/constants/enums';

beforeAll(() => {
  vi.mock('server-only', () => ({}));

  vi.mock('@/lib/verifySession', () => ({
    default: vi.fn(),
  }));

  vi.mock('@/lib/pjme-prisma-client', () => ({
    default: {
      Transaction: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      Product: {
        findMany: vi.fn(),
      },
      Category: {
        findUnique: vi.fn(),
      },
      $transaction: vi.fn(),
      $queryRaw: vi.fn(),
    },
  }));

  vi.mock('@/lib/services/license-key-service', () => ({
    createLicenseKeys: () => {},
    updateLicenseKeys: () => {},
    deleteLicenseKeys: () => {},
    generateLicenseKeyCode: () => 'LICENSE_CODE',
    updateLicenseKeysRevokeStatus: () => {},
  }));

  vi.mock('@/lib/services/product-service', () => ({
    getDriveFileInfo: vi.fn(),
  }));

  vi.mock('@/lib/google-client', () => ({
    getGoogleDriveClient: vi.fn(() => ({
      request: vi.fn().mockResolvedValue({ data: { id: 'perm-123' } }),
    })),
  }));

  vi.mock('@/prisma-pjme-db/pjme-db-client', () => ({
    Prisma: {
      sql: vi.fn((strings, ...values) => ({ strings, values })),
    },
  }));

  vi.mock('@/lib/pjma-prisma-client', () => ({
    default: {
      LicenseKey: {
        findMany: vi.fn(),
      },
      SecretKeyLicense: {
        findMany: vi.fn(),
      },
    },
  }));

  process.env.NEXT_PUBLIC_BRAND_URL = 'https://example.com';
  process.env.NEXT_PUBLIC_BRAND_NAME = 'Example Brand';
});

afterEach(() => {
  vi.resetAllMocks();
});

describe('getTransactions function', () => {
  it('should call verifySession function, not call pjmeDBPrismaClient.Transaction.findMany function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(
      getTransactions({
        select: { id: true },
        pageIndex: 0,
        pageSize: 10,
        filters: { status: TransactionStatus.PAID },
      }),
    ).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Transaction.findMany).not.toHaveBeenCalled();
  });
  
  it('should call pjmeDBPrismaClient.Transaction.findMany function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 'user-id' });

    const mockTransactions = [
      {
        id: 'uuid-1',
        total_amount: { toNumber: () => 15000 },
        updated_at: new Date('2025-10-29T00:00:00Z'),
      },
      {
        id: 'uuid-2',
        total_amount: { toNumber: () => 22000 },
        updated_at: new Date('2025-10-29T01:00:00Z'),
      },
    ];

    pjmeDBPrismaClient.Transaction.findMany.mockResolvedValue(mockTransactions);

    const result = await getTransactions({
      select: { id: true, total_amount: true },
      pageIndex: 1,
      pageSize: 2,
      filters: { status: 'paid' },
    });

    expect(pjmeDBPrismaClient.Transaction.findMany).toHaveBeenCalledWith({
      select: { id: true, total_amount: true },
      take: 2,
      skip: 2,
      where: { status: 'paid' },
      orderBy: { updated_at: 'desc' },
    });

    expect(result).toEqual([
      {
        id: 'uuid-1',
        total_amount: 15000,
        updated_at: new Date('2025-10-29T00:00:00Z'),
      },
      {
        id: 'uuid-2',
        total_amount: 22000,
        updated_at: new Date('2025-10-29T01:00:00Z'),
      },
    ]);
  });
});

describe('searchTransactions function', () => {
  it('should call verifySession function, not call pjmeDBPrismaClient.Transaction.findMany function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(
      searchTransactions({
        key: 'TRX001',
        select: { id: true },
        limit: 5,
        filters: { status: 'paid' },
      }),
    ).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Transaction.findMany).not.toHaveBeenCalled();
  });

  it('should call pjmeDBPrismaClient.Transaction.findMany function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 'user-id' });

    const mockTransactions = [
      {
        id: '018f3c00-aaaa-4f66-b8f0-123456789abc',
        total_amount: { toNumber: () => 15000 },
        code: 'TRX001',
      },
      {
        id: '018f3c00-bbbb-4f66-b8f0-abcdef123456',
        total_amount: { toNumber: () => 22000 },
        code: 'TRX001',
      },
    ];

    pjmeDBPrismaClient.Transaction.findMany.mockResolvedValue(mockTransactions);

    const result = await searchTransactions({
      key: 'TRX001',
      select: { id: true, code: true, total_amount: true },
      limit: 2,
      filters: { status: 'paid' },
    });

    expect(pjmeDBPrismaClient.Transaction.findMany).toHaveBeenCalledWith({
      select: { id: true, code: true, total_amount: true },
      where: {
        code: 'TRX001',
        status: 'paid',
      },
      take: 3, // limit + 1
    });

    expect(result).toEqual([
      {
        id: '018f3c00-aaaa-4f66-b8f0-123456789abc',
        total_amount: 15000,
        code: 'TRX001',
      },
      {
        id: '018f3c00-bbbb-4f66-b8f0-abcdef123456',
        total_amount: 22000,
        code: 'TRX001',
      },
    ]);
  });
});

describe('getTransactionDetails function', () => {
  it('should call verifySession function, not call pjmeDBPrismaClient.Transaction.findUnique function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(null);

    await expect(getTransactionDetails('some-id')).rejects.toThrow(UnauthenticatedError);
    expect(verifySession).toHaveBeenCalledTimes(1);
    expect(pjmeDBPrismaClient.Transaction.findUnique).not.toHaveBeenCalled();
  });

  it('should call pjmeDBPrismaClient.Transaction.findUnique function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({ user: { id: 'user-123' } });

    const mockTransaction = {
      id: 'uuid-1',
      code: 'TRX-001',
      status: 'paid',
      created_at: new Date('2025-01-01T00:00:00Z'),
      updated_at: new Date('2025-01-02T00:00:00Z'),
      currency_code: 'USD',
      total_amount: { toNumber: () => 1000 },
      customer_name: 'John Doe',
      customer_email: 'john@example.com',
      customer_phone_number: '123456789',
      invoices: [
        {
          id: 'invoice-1',
          invoice_number: 'INV-001',
          status: 'active',
          issued_at: new Date('2025-01-01T00:00:00Z'),
          voided_at: null,
        },
      ],
      details: [
        {
          id: 'detail-1',
          quantity: 2,
          product_name: 'Product A',
          product_version: '1.0.0',
          product_drive_file_id: 'drive-123',
          product_download_link: 'https://example.com/download',
          product_variant: 'standard',
          variant_download_link: 'https://example.com/variant',
          variant_file_access_password: null,
          product_currency_code: 'USD',
          product_price: { toNumber: () => 500 },
          product_discount: 0,
          product_coupon_code: null,
          product_coupon_discount: 0,
          share_method: 'link',
          shared_at: null,
        },
      ],
    };

    pjmeDBPrismaClient.Transaction.findUnique.mockResolvedValue(mockTransaction);

    await getTransactionDetails('018f3c00-1111-4f66-b8f0-123456789abc');

    expect(verifySession).toHaveBeenCalledTimes(1);
    expect(pjmeDBPrismaClient.Transaction.findUnique).toHaveBeenCalledWith({
      where: { id: '018f3c00-1111-4f66-b8f0-123456789abc' },
      select: expect.objectContaining({
        code: true,
        status: true,
        details: expect.any(Object),
      }),
    });
  });
});

describe('updateTransactionStatus function', () => {
  it('should call verifySession function, not call pjmeDBPrismaClient.Transaction.update function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(null);

    const uuidV7 = '018f3c00-1111-4f66-b8f0-123456789abc';

    await expect(updateTransactionStatus({ id: uuidV7, status: 'paid' }))
      .rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalledTimes(1);
    expect(pjmeDBPrismaClient.Transaction.update).not.toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Transaction.findUnique).not.toHaveBeenCalled();
    expect(pjmeDBPrismaClient.$transaction).not.toHaveBeenCalled();
  });

  it('should call pjmeDBPrismaClient.Transaction.update function correctly when authenticated', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;
    const pjmaDBPrismaClient = (await import('@/lib/pjma-prisma-client')).default;

    verifySession.mockResolvedValue({ user: { id: 'user-123' } });

    const uuidV7 = '018f3c00-1111-4f66-b8f0-123456789abc';

    // mock value
    pjmeDBPrismaClient.Transaction.findUnique.mockResolvedValue({
      id: uuidV7,
      customer_id: 'cust-uuid-1',
      status: TransactionStatus.PENDING,
      customer_name: 'John Doe',
      customer_email: 'john@example.com',
      updated_at: Date.now(),
      customer: { isBanned: false },
      details: [
        { id: '018f3c00-2222-4f66-b8f0-abcdef123456', product_id: 'prod-uuid-1', product_drive_file_id: null, share_method: null }
      ],
    });
    pjmeDBPrismaClient.Product.findMany.mockResolvedValue([
      { id: 'prod-uuid-1', categoryId: 'cat-uuid-1', name: 'Product A' }
    ]);
    pjmeDBPrismaClient.Category.findUnique.mockResolvedValue({ id: 'cat-uuid-app' });
    pjmaDBPrismaClient.SecretKeyLicense.findMany.mockResolvedValue([]);
    pjmeDBPrismaClient.Transaction.update.mockResolvedValue({ id: uuidV7 });
    pjmeDBPrismaClient.$transaction.mockImplementation(async (fn) => fn({
      Invoice: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 'inv-uuid-1' }),
      },
      Transaction: {
        update: vi.fn().mockResolvedValue({ id: uuidV7 }),
      },
    }));

    await updateTransactionStatus({ id: uuidV7, status: TransactionStatus.CANCELLED });

    expect(verifySession).toHaveBeenCalledTimes(1);
    expect(pjmeDBPrismaClient.Transaction.update).toHaveBeenCalled();
  });
});

describe('correctTransactionStatus function', () => {
  it('should call verifySession function, not call pjmeDBPrismaClient.Transaction.update function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(null);

    const uuidV7 = '018f3c00-1111-4f66-b8f0-123456789abc';

    await expect(correctTransactionStatus({ id: uuidV7, status: TransactionStatus.PAID }))
      .rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalledTimes(1);
    expect(pjmeDBPrismaClient.Transaction.update).not.toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Transaction.findUnique).not.toHaveBeenCalled();
    expect(pjmeDBPrismaClient.$transaction).not.toHaveBeenCalled();
  });

  it('should call pjmeDBPrismaClient.Transaction.update function correctly when authenticated', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;
    const pjmaDBPrismaClient = (await import('@/lib/pjma-prisma-client')).default;

    verifySession.mockResolvedValue({ user: { id: 'user-123' } });

    const uuidV7 = '018f3c00-1111-4f66-b8f0-123456789abc';

    // Mock return transaction data
    pjmeDBPrismaClient.Transaction.findUnique.mockResolvedValue({
      id: uuidV7,
      customer_id: 'cust-uuid-1',
      status: TransactionStatus.CANCELLED,
      customer_name: 'John Doe',
      customer_email: 'john@example.com',
      updated_at: Date.now(),
      customer: { isBanned: false },
      details: [
        { id: '018f3c00-2222-4f66-b8f0-abcdef123456', product_id: 'prod-uuid-1', product_drive_file_id: null, share_method: ShareMethod.MANUAL_REQUIRED }
      ],
    });
    pjmeDBPrismaClient.Product.findMany.mockResolvedValue([
      { id: 'prod-uuid-1', categoryId: 'cat-uuid-1', name: 'Product A' }
    ]);
    pjmeDBPrismaClient.Category.findUnique.mockResolvedValue({ id: 'cat-uuid-app' });
    pjmaDBPrismaClient.SecretKeyLicense.findMany.mockResolvedValue([
      {
        id: 'sk-uuid-1',
        product_id: 'prod-uuid-1',
        key: 'SECRET_KEY',
        license_key: [
          { id: 'lk-uuid-1', is_revoked: true, code: 'OLD_CODE', updated_at: Date.now() }
        ],
      }
    ]);
    pjmeDBPrismaClient.Transaction.update.mockResolvedValue({ id: uuidV7 });
    const txMock = {
      Invoice: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 'inv-uuid-1', invoice_number: 'INV-001' }),
        update: vi.fn().mockResolvedValue({ id: 'inv-uuid-1' }),
      },
      Transaction: {
        update: vi.fn().mockResolvedValue({ id: uuidV7 }),
      },
    };
    pjmeDBPrismaClient.$transaction.mockImplementation(async (fn) => fn(txMock));

    await correctTransactionStatus({ id: uuidV7, status: TransactionStatus.PAID });

    expect(verifySession).toHaveBeenCalledTimes(1);
    expect(txMock.Transaction.update).toHaveBeenCalled();
  });
});

describe('generateConfirmationMessage function', () => {
  it('should call verifySession function, not call pjmeDBPrismaClient.Transaction.findUnique function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(generateConfirmationMessage('0192e7e8-8b1d-7f51-9076-ccb6fcb6c77a'))
      .rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Transaction.findUnique).not.toHaveBeenCalled();
  });

  it('should call pjmeDBPrismaClient.Transaction.findUnique function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 'user-id' });

    const mockTransaction = {
      code: 'TRX-123',
      currency_code: CurrencyCode.IDR,
      customer_name: 'Reza',
      customer_email: 'reza@example.com',
      details: [
        { product_name: 'Produk A', share_method: ShareMethod.DOWNLOAD_LINK },
        { product_name: 'Produk B', share_method: ShareMethod.DRIVE_SHARE },
      ],
    };

    pjmeDBPrismaClient.Transaction.findUnique.mockResolvedValue(mockTransaction);

    await generateConfirmationMessage('0192e7e8-8b1d-7f51-9076-ccb6fcb6c77a');

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Transaction.findUnique).toHaveBeenCalledWith({
      where: { id: '0192e7e8-8b1d-7f51-9076-ccb6fcb6c77a' },
      select: {
        code: true,
        currency_code: true,
        customer_name: true,
        customer_email: true,
        details: {
          select: {
            product_name: true,
            share_method: true,
          },
        },
      },
    });
  });
});

describe('generateTransactionExport function', () => {
  it('should call verifySession function, not call pjmeDBPrismaClient.$queryRaw function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(
      generateTransactionExport({
        transactionStatus: TransactionStatus.PAID,
        currencyCode: CurrencyCode.IDR,
      }),
    ).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.$queryRaw).not.toHaveBeenCalled();
  });

  it('should call pjmeDBPrismaClient.$queryRaw function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 'user-id' });

    const mockTransactions = [
      {
        code: 'TRX-001',
        customer_name: 'Reza',
        customer_email: 'reza@example.com',
        customer_phone_number: '08123456789',
        status: 'paid',
        created_at: 1730140800,
        updated_at: 1730144400,
        total_amount: { toNumber: () => 15000 },
        product_name: 'Produk A',
        product_version: '1.0',
        product_variant: 'Default',
        quantity: 1,
        product_price: { toNumber: () => 15000 },
        product_currency_code: 'IDR',
        product_discount: 0,
        product_coupon_code: null,
        product_coupon_discount: 0,
      },
    ];

    pjmeDBPrismaClient.$queryRaw.mockResolvedValue(mockTransactions);

    await generateTransactionExport({
      transactionStatus: TransactionStatus.PAID,
      currencyCode: CurrencyCode.IDR,
    });

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.$queryRaw).toHaveBeenCalledWith(expect.any(Object));
  });
});
