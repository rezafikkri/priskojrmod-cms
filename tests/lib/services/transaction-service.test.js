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

  vi.mock('@/lib/prisma', () => ({
    default: {
      transaction: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      product: {
        findMany: vi.fn(),
      },
      category: {
        findUnique: vi.fn(),
      },
      $transaction: vi.fn(),
      $queryRaw: vi.fn(),
      licenseKey: {
        findMany: vi.fn(),
      },
      secretKey: {
        findMany: vi.fn(),
      },
    },
  }));

  vi.mock('@/prisma/generated/client', () => ({
    Prisma: {
      sql: vi.fn((strings, ...values) => ({ strings, values })),
    },
  }));

  vi.mock('@/config/cms', () => ({

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
});

afterEach(() => {
  vi.resetAllMocks();
});

describe('getTransactions function', () => {
  it('should call verifySession function, not call prisma.transaction.findMany function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

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
    expect(prisma.transaction.findMany).not.toHaveBeenCalled();
  });
  
  it('should call prisma.transaction.findMany function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ userId: 1 });

    const mockTransactions = [
      {
        id: 'uuid-1',
        totalAmount: { toNumber: () => 15000 },
        updatedAt: new Date('2025-10-29T00:00:00Z'),
      },
      {
        id: 'uuid-2',
        totalAmount: { toNumber: () => 22000 },
        updatedAt: new Date('2025-10-29T01:00:00Z'),
      },
    ];

    prisma.transaction.findMany.mockResolvedValue(mockTransactions);

    const result = await getTransactions({
      select: { id: true, totalAmount: true },
      pageIndex: 1,
      pageSize: 2,
      filters: { status: 'paid' },
    });

    expect(prisma.transaction.findMany).toHaveBeenCalledWith({
      select: { id: true, totalAmount: true },
      take: 2,
      skip: 2,
      where: { status: 'paid' },
      orderBy: { updatedAt: 'desc' },
    });

    expect(result).toEqual([
      {
        id: 'uuid-1',
        totalAmount: 15000,
        updatedAt: new Date('2025-10-29T00:00:00Z'),
      },
      {
        id: 'uuid-2',
        totalAmount: 22000,
        updatedAt: new Date('2025-10-29T01:00:00Z'),
      },
    ]);
  });
});

describe('searchTransactions function', () => {
  it('should call verifySession function, not call prisma.transaction.findMany function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

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
    expect(prisma.transaction.findMany).not.toHaveBeenCalled();
  });

  it('should call prisma.transaction.findMany function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ userId: 1 });

    const mockTransactions = [
      {
        id: '018f3c00-aaaa-4f66-b8f0-123456789abc',
        totalAmount: { toNumber: () => 15000 },
        code: 'TRX001',
      },
      {
        id: '018f3c00-bbbb-4f66-b8f0-abcdef123456',
        totalAmount: { toNumber: () => 22000 },
        code: 'TRX001',
      },
    ];

    prisma.transaction.findMany.mockResolvedValue(mockTransactions);

    const result = await searchTransactions({
      key: 'TRX001',
      select: { id: true, code: true, totalAmount: true },
      limit: 2,
      filters: { status: 'paid' },
    });

    expect(prisma.transaction.findMany).toHaveBeenCalledWith({
      select: { id: true, code: true, totalAmount: true },
      where: {
        code: 'TRX001',
        status: 'paid',
      },
      take: 3, // limit + 1
    });

    expect(result).toEqual([
      {
        id: '018f3c00-aaaa-4f66-b8f0-123456789abc',
        totalAmount: 15000,
        code: 'TRX001',
      },
      {
        id: '018f3c00-bbbb-4f66-b8f0-abcdef123456',
        totalAmount: 22000,
        code: 'TRX001',
      },
    ]);
  });
});

describe('getTransactionDetails function', () => {
  it('should call verifySession function, not call prisma.transaction.findUnique function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(null);

    await expect(getTransactionDetails('some-id')).rejects.toThrow(UnauthenticatedError);
    expect(verifySession).toHaveBeenCalledTimes(1);
    expect(prisma.transaction.findUnique).not.toHaveBeenCalled();
  });

  it('should call prisma.transaction.findUnique function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ user: { id: 'user-123' } });

    const mockTransaction = {
      id: 'uuid-1',
      code: 'TRX-001',
      status: 'paid',
      createdAt: new Date('2025-01-01T00:00:00Z'),
      updatedAt: new Date('2025-01-02T00:00:00Z'),
      currencyCode: 'USD',
      totalAmount: { toNumber: () => 1000 },
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      customerPhoneNumber: '123456789',
      invoices: [
        {
          id: 'invoice-1',
          invoiceNumber: 'INV-001',
          status: 'active',
          issuedAt: new Date('2025-01-01T00:00:00Z'),
          voidedAt: null,
        },
      ],
      details: [
        {
          id: 'detail-1',
          quantity: 2,
          productName: 'Product A',
          productVersion: '1.0.0',
          productDriveFileId: 'drive-123',
          productDownloadUrl: 'https://example.com/download',
          productVariant: 'standard',
          variantDownloadUrl: 'https://example.com/variant',
          variantFileAccessPassword: null,
          productCurrencyCode: 'USD',
          productPrice: { toNumber: () => 500 },
          productDiscount: 0,
          productCouponCode: null,
          productCouponDiscount: 0,
          shareMethod: 'link',
          sharedAt: null,
        },
      ],
    };

    prisma.transaction.findUnique.mockResolvedValue(mockTransaction);

    await getTransactionDetails('018f3c00-1111-4f66-b8f0-123456789abc');

    expect(verifySession).toHaveBeenCalledTimes(1);
    expect(prisma.transaction.findUnique).toHaveBeenCalledWith({
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
  it('should call verifySession function, not call prisma.transaction.update function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(null);

    const uuidV7 = '018f3c00-1111-4f66-b8f0-123456789abc';

    await expect(updateTransactionStatus({ id: uuidV7, status: 'paid' }))
      .rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalledTimes(1);
    expect(prisma.transaction.update).not.toHaveBeenCalled();
    expect(prisma.transaction.findUnique).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('should call prisma.transaction.update function correctly when authenticated', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ user: { id: 'user-123' } });

    const uuidV7 = '018f3c00-1111-4f66-b8f0-123456789abc';

    // mock value
    prisma.transaction.findUnique.mockResolvedValue({
      id: uuidV7,
      customerId: 'cust-uuid-1',
      status: TransactionStatus.PENDING,
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      updatedAt: Date.now(),
      customer: { isBanned: false },
      details: [
        { id: '018f3c00-2222-4f66-b8f0-abcdef123456', productId: 'prod-uuid-1', productDriveFileId: null, shareMethod: null }
      ],
    });
    prisma.product.findMany.mockResolvedValue([
      { id: 'prod-uuid-1', categoryId: 'cat-uuid-1', name: 'Product A' }
    ]);
    prisma.category.findUnique.mockResolvedValue({ id: 'cat-uuid-app' });
    prisma.secretKey.findMany.mockResolvedValue([]);
    prisma.transaction.update.mockResolvedValue({ id: uuidV7 });
    prisma.$transaction.mockImplementation(async (fn) => fn({
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
    expect(prisma.transaction.update).toHaveBeenCalled();
  });
});

describe('correctTransactionStatus function', () => {
  it('should call verifySession function, not call prisma.transaction.update function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(null);

    const uuidV7 = '018f3c00-1111-4f66-b8f0-123456789abc';

    await expect(correctTransactionStatus({ id: uuidV7, status: TransactionStatus.PAID }))
      .rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalledTimes(1);
    expect(prisma.transaction.update).not.toHaveBeenCalled();
    expect(prisma.transaction.findUnique).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('should call prisma.transaction.update function correctly when authenticated', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ user: { id: 'user-123' } });

    const uuidV7 = '018f3c00-1111-4f66-b8f0-123456789abc';

    // Mock return transaction data
    prisma.transaction.findUnique.mockResolvedValue({
      id: uuidV7,
      customerId: 'cust-uuid-1',
      status: TransactionStatus.CANCELLED,
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      updatedAt: Date.now(),
      customer: { isBanned: false },
      details: [
        { id: '018f3c00-2222-4f66-b8f0-abcdef123456', productId: 'prod-uuid-1', productDriveFileId: null, shareMethod: ShareMethod.MANUAL_REQUIRED }
      ],
    });
    prisma.product.findMany.mockResolvedValue([
      { id: 'prod-uuid-1', categoryId: 'cat-uuid-1', name: 'Product A' }
    ]);
    prisma.category.findUnique.mockResolvedValue({ id: 'cat-uuid-app' });
    prisma.secretKey.findMany.mockResolvedValue([
      {
        id: 'sk-uuid-1',
        productId: 'prod-uuid-1',
        key: 'SECRET_KEY',
        licenseKey: [
          { id: 'lk-uuid-1', isRevoked: true, code: 'OLD_CODE', updatedAt: Date.now() }
        ],
      }
    ]);
    prisma.transaction.update.mockResolvedValue({ id: uuidV7 });
    const txMock = {
      invoice: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 'inv-uuid-1', invoiceNumber: 'INV-001' }),
        update: vi.fn().mockResolvedValue({ id: 'inv-uuid-1' }),
      },
      transaction: {
        update: vi.fn().mockResolvedValue({ id: uuidV7 }),
      },
    };
    prisma.$transaction.mockImplementation(async (fn) => fn(txMock));

    await correctTransactionStatus({ id: uuidV7, status: TransactionStatus.PAID });

    expect(verifySession).toHaveBeenCalledTimes(1);
    expect(txMock.transaction.update).toHaveBeenCalled();
  });
});

describe('generateConfirmationMessage function', () => {
  it('should call verifySession function, not call prisma.transaction.findUnique function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(generateConfirmationMessage('0192e7e8-8b1d-7f51-9076-ccb6fcb6c77a'))
      .rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.transaction.findUnique).not.toHaveBeenCalled();
  });

  it('should call prisma.transaction.findUnique function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ userId: 1 });

    const mockTransaction = {
      code: 'TRX-123',
      currencyCode: CurrencyCode.IDR,
      customerName: 'Reza',
      customerEmail: 'reza@example.com',
      details: [
        { productName: 'Produk A', shareMethod: ShareMethod.DOWNLOAD_LINK },
        { productName: 'Produk B', shareMethod: ShareMethod.DRIVE_SHARE },
      ],
    };

    prisma.transaction.findUnique.mockResolvedValue(mockTransaction);

    await generateConfirmationMessage('0192e7e8-8b1d-7f51-9076-ccb6fcb6c77a');

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.transaction.findUnique).toHaveBeenCalledWith({
      where: { id: '0192e7e8-8b1d-7f51-9076-ccb6fcb6c77a' },
      select: {
        code: true,
        currencyCode: true,
        customerName: true,
        customerEmail: true,
        details: {
          select: {
            productName: true,
            shareMethod: true,
          },
        },
      },
    });
  });
});

describe('generateTransactionExport function', () => {
  it('should call verifySession function, not call prisma.$queryRaw function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(
      generateTransactionExport({
        transactionStatus: TransactionStatus.PAID,
        currencyCode: CurrencyCode.IDR,
      }),
    ).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it('should call prisma.$queryRaw function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ userId: 1 });

    const mockTransactions = [
      {
        code: 'TRX-001',
        customerName: 'Reza',
        customerEmail: 'reza@example.com',
        customerPhoneNumber: '08123456789',
        status: 'paid',
        createdAt: 1730140800,
        updatedAt: 1730144400,
        totalAmount: { toNumber: () => 15000 },
        productName: 'Produk A',
        productVersion: '1.0',
        productVariant: 'Default',
        quantity: 1,
        productPrice: { toNumber: () => 15000 },
        productCurrencyCode: 'IDR',
        productDiscount: 0,
        productCouponCode: null,
        productCouponDiscount: 0,
      },
    ];

    prisma.$queryRaw.mockResolvedValue(mockTransactions);

    await generateTransactionExport({
      transactionStatus: TransactionStatus.PAID,
      currencyCode: CurrencyCode.IDR,
    });

    expect(verifySession).toHaveBeenCalled();

    const sql = prisma.$queryRaw.mock.calls[0][0]
    const nested = sql.values[1]

    expect(sql.values).toContain('IDR');
    expect(nested.values).toContain('paid');
  });
});
