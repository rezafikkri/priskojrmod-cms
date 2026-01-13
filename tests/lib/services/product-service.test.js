import {
  describe,
  it,
  expect,
  vi,
  afterEach,
  beforeAll,
} from 'vitest';
import {
  createProduct,
  updateProductPinnedStatus,
  updateProductPublishedStatus,
  deleteProduct,
  deleteProductVariant,
  deleteProductImage,
  deleteProductDiscount,
  deleteProductCoupon,
  updateProduct,
} from '@/lib/services/product-service';
import { Language, PriceType } from '@/constants/enums';
import UnauthenticatedError from '@/lib/errors/UnauthenticatedError';

beforeAll(() => {
  vi.mock('server-only', () => ({}));

  vi.mock('@/lib/verifySession', () => ({
    default: vi.fn(),
  }));

  vi.mock('@/lib/pjme-prisma-client', () => ({
    default: {
      Category: {
        findUnique: vi.fn(),
      },
      Product: {
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
        findUnique: vi.fn(),
      },
      ProductVariant: { delete: vi.fn() },
      ProductImage: { delete: vi.fn() },
      ProductDiscount: {
        delete: vi.fn(),
        update: vi.fn(),
      },
      ProductCoupon: {
        delete: vi.fn(),
        update: vi.fn(),
      },
      $transaction: vi.fn(),
    },
  }));
});

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe('createProduct function', () => {
  it('Should call verifySession function, not call pjmeDBPrismaClient.Product.create function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(createProduct({})).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Product.create).not.toHaveBeenCalled();
  });

  it('Should call pjmeDBPrismaClient.Product.create function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853503149);

    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    pjmeDBPrismaClient.Category.findUnique.mockResolvedValue(null);
    verifySession.mockResolvedValue({ isAuth: true, userId: 'admin-id-123' });

    const input = {
      name: 'Awesome New Product',
      categoryId: 1,
      licenseId: 1,
      ownerId: 1,
      downloadUrl: 'https://example.com/download',
      description: {
        id: 'Deskripsi produk keren',
        en: 'Awesome product description',
      },
      variants: [
        {
          name: 'Standard',
        },
      ],
      images: [
        { url: 'https://images.unsplash.com/photo-1750222382424-610417abf3b1', isThumbnail: true, width: 100, height: 100 },
      ],
      isPublished: true,
      priceType: PriceType.FREE,
      version: '1.0.0',
    };

    await createProduct(input);

    const currentTime = Math.floor(new Date().getTime() / 1000);

    expect(pjmeDBPrismaClient.Product.create).toHaveBeenCalledWith({
      data: {
        categoryId: input.categoryId,
        adminId: 'admin-id-123',
        ownerId: input.ownerId,
        licenseId: input.licenseId,
        name: input.name,
        slug: 'awesome-new-product',
        priceType: input.priceType,
        isPublished: input.isPublished,
        createdAt: currentTime,
        updatedAt: currentTime,
        downloadUrl: input.downloadUrl,
        translations: {
          create: [
            { language: Language.ID, description: input.description.id },
            { language: Language.EN, description: input.description.en },
          ],
        },
        versions: {
          create: {
            releasedAt: 1744853503,
            version: '1.0.0',
          },
        },
        images: {
          create: input.images,
        },
        variants: {
          create: input.variants,
        },
      },
      select: { id: true },
    });
  });
});

describe('updateProductPinnedStatus function', () => {
  it('Should call verifySession function, not call pjmeDBPrismaClient.Product.update function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(updateProductPinnedStatus()).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Product.update).not.toHaveBeenCalled();
  });

  it('Should call pjmeDBPrismaClient.Product.update function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853603149);

    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 'admin-id-123' });

    pjmeDBPrismaClient.Product.count.mockResolvedValue(2);
    pjmeDBPrismaClient.Product.update.mockResolvedValue({
      id: '999c549f-33d7-461e-9f0e-928b17097e42',
      updatedAt: Math.floor(new Date().getTime() / 1000),
    });

    await updateProductPinnedStatus('999c549f-33d7-461e-9f0e-928b17097e42', true);

    expect(pjmeDBPrismaClient.Product.count).toHaveBeenCalledWith({ where: { isPinned: true }});
    expect(pjmeDBPrismaClient.Product.update).toHaveBeenCalledWith({
      where: { id: '999c549f-33d7-461e-9f0e-928b17097e42' },
      data: {
        isPinned: true,
        updatedAt: Math.floor(new Date().getTime() / 1000),
      },
      select: { id: true, updatedAt: true },
    });
  });
});

describe('updateProductPublishedStatus function', () => {
  it('Should call verifySession function, not call pjmeDBPrismaClient.Product.update function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(updateProductPublishedStatus({})).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Product.update).not.toHaveBeenCalled();
  });

  it('Should call pjmeDBPrismaClient.Product.update function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853603149);

    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 'admin-id-123' });

    pjmeDBPrismaClient.Product.update.mockResolvedValue({
      id: 'fd209fe2-3f60-42b2-9985-99b3fc4f8600',
      updatedAt: Math.floor(new Date().getTime() / 1000),
    });

    await updateProductPublishedStatus('fd209fe2-3f60-42b2-9985-99b3fc4f8600', false);

    expect(pjmeDBPrismaClient.Product.update).toHaveBeenCalledWith({
      where: { id: 'fd209fe2-3f60-42b2-9985-99b3fc4f8600' },
      data: {
        isPublished: false,
        updatedAt: Math.floor(new Date().getTime() / 1000),
      },
      select: { id: true, updatedAt: true },
    });
  });
});

describe('deleteProduct function', () => {
  it('Should call verifySession function, not call pjmeDBPrismaClient.Product.delete function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(deleteProduct('6cb32c0f-a38a-4e42-bf45-d5a964205ab3')).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Product.delete).not.toHaveBeenCalled();
  });

  it('Should call pjmeDBPrismaClient.Product.delete function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 'admin-id-123' });
    pjmeDBPrismaClient.Product.findUnique.mockResolvedValue({
      isPinned: false,
      isPublished: false,
    });

    await deleteProduct('6cb32c0f-a38a-4e42-bf45-d5a964205ab3');

    expect(pjmeDBPrismaClient.Product.delete).toHaveBeenCalledWith({
      where: { id: '6cb32c0f-a38a-4e42-bf45-d5a964205ab3' },
      select: { id: true },
    });
  });
});

describe('deleteProductVariant function', () => {
  it('Should call verifySession function, not call pjmeDBPrismaClient.$transaction, pjmeDBPrismaClient.ProductVariant.delete and pjmeDBPrismaClient.Product.update function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(deleteProductVariant(
      'c9274c35-7561-4824-8bde-a2db2e81f101',
      '629f8469-ff43-4d49-bca6-4875b93f4b69',
    )).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.$transaction).not.toHaveBeenCalled();
    expect(pjmeDBPrismaClient.ProductVariant.delete).not.toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Product.update).not.toHaveBeenCalled();
  });

  it('Should call pjmeDBPrismaClient.$transaction function and call pjmeDBPrismaClient.ProductVariant.delete and pjmeDBPrismaClient.Product.update function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853603149);
    const currentTime = Math.floor(new Date().getTime() / 1000);

    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 'admin-id-123' });

    await deleteProductVariant('c9274c35-7561-4824-8bde-a2db2e81f101', '629f8469-ff43-4d49-bca6-4875b93f4b69');

    expect(pjmeDBPrismaClient.$transaction).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.ProductVariant.delete).toHaveBeenCalledWith({
      where: { id: 'c9274c35-7561-4824-8bde-a2db2e81f101' },
      select: { id: true },
    });
    expect(pjmeDBPrismaClient.Product.update).toHaveBeenCalledWith({
      where: { id: '629f8469-ff43-4d49-bca6-4875b93f4b69' },
      data: { updatedAt: currentTime },
      select: { id: true },
    });
  });
});

describe('deleteProductImage function', () => {
  it('Should call verifySession function, not call pjmeDBPrismaClient.$transaction, pjmeDBPrismaClient.ProductImage.delete and pjmeDBPrismaClient.Product.update function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(deleteProductImage(
      '2e497c7c-3aa2-450a-ac53-e199f5c3cc83',
      '2e497c7c-3aa2-450a-ac53-e199f5c3cc84',
    )).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.$transaction).not.toHaveBeenCalled();
    expect(pjmeDBPrismaClient.ProductImage.delete).not.toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Product.update).not.toHaveBeenCalled();
  });

  it('Should call pjmeDBPrismaClient.$transaction function and call pjmeDBPrismaClient.ProductImage.delete and pjmeDBPrismaClient.Product.update function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853603149);
    const currentTime = Math.floor(new Date().getTime() / 1000);

    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 'admin-id-123' });

    await deleteProductImage('2e497c7c-3aa2-450a-ac53-e199f5c3cc83', '2e497c7c-3aa2-450a-ac53-e199f5c3cc84');

    expect(pjmeDBPrismaClient.$transaction).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.ProductImage.delete).toHaveBeenCalledWith({
      where: { id: '2e497c7c-3aa2-450a-ac53-e199f5c3cc83' },
      select: { id: true },
    });
    expect(pjmeDBPrismaClient.Product.update).toHaveBeenCalledWith({
      where: { id: '2e497c7c-3aa2-450a-ac53-e199f5c3cc84' },
      data: { updatedAt: currentTime },
      select: { id: true },
    });
  });
});

describe('deleteProductDiscount function', () => {
  it('Should call verifySession function, not call pjmeDBPrismaClient.$transaction, pjmeDBPrismaClient.ProductDiscount.delete and pjmeDBPrismaClient.Product.update function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(deleteProductDiscount(1, '2e497c7c-3aa2-450a-ac53-e199f5c3cc94'))
      .rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.$transaction).not.toHaveBeenCalled();
    expect(pjmeDBPrismaClient.ProductDiscount.delete).not.toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Product.update).not.toHaveBeenCalled();
  });

  it('Should call pjmeDBPrismaClient.$transaction function and call pjmeDBPrismaClient.ProductDiscount.delete and pjmeDBPrismaClient.Product.update function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853603149);
    const currentTime = Math.floor(new Date().getTime() / 1000);

    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 'admin-id-123' });

    await deleteProductDiscount(1, '2e497c7c-3aa2-450a-ac53-e199f5c3cc94');

    expect(pjmeDBPrismaClient.$transaction).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.ProductDiscount.delete).toHaveBeenCalledWith({
      where: { id: 1 },
      select: { id: true },
    });
    expect(pjmeDBPrismaClient.Product.update).toHaveBeenCalledWith({
      where: { id: '2e497c7c-3aa2-450a-ac53-e199f5c3cc94' },
      data: { updatedAt: currentTime },
      select: { id: true },
    });
  });
});

describe('deleteProductCoupon function', () => {
  it('Should call verifySession function, not call pjmeDBPrismaClient.$transaction, pjmeDBPrismaClient.ProductCoupon.delete and pjmeDBPrismaClient.Product.update function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(deleteProductCoupon(
      '2e497c7c-3aa2-450a-ac53-e129f5c3cc99',
      '2e497c7c-3aa2-450a-ac53-e129f5c3cc94',
    ))
      .rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.$transaction).not.toHaveBeenCalled();
    expect(pjmeDBPrismaClient.ProductCoupon.delete).not.toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Product.update).not.toHaveBeenCalled();
  });

  it('Should call pjmeDBPrismaClient.$transaction function and call pjmeDBPrismaClient.ProductCoupon.delete and pjmeDBPrismaClient.Product.update function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853603149);
    const currentTime = Math.floor(new Date().getTime() / 1000);

    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 'admin-id-123' });

    await deleteProductCoupon('2e497c7c-3aa2-450a-ac53-e129f5c3cc99', '2e497c7c-3aa2-450a-ac53-e129f5c3cc94');

    expect(pjmeDBPrismaClient.$transaction).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.$transaction.mock.calls[0][0]).toHaveLength(2);

    expect(pjmeDBPrismaClient.ProductCoupon.delete).toHaveBeenCalledWith({
      where: { id: '2e497c7c-3aa2-450a-ac53-e129f5c3cc99' },
      select: { id: true },
    });
    expect(pjmeDBPrismaClient.Product.update).toHaveBeenCalledWith({
      where: { id: '2e497c7c-3aa2-450a-ac53-e129f5c3cc94' },
      data: { updatedAt: currentTime },
      select: { id: true },
    });
  });
});

describe('updateProduct function', () => {
  it('Should call verifySession function, not call pjmeDBPrismaClient.$transaction, pjmeDBPrismaClient.Product.update function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(updateProduct({})).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.$transaction).not.toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Product.update).not.toHaveBeenCalled();
  });

  it('Should call pjmeDBPrismaClient.$transaction function and pjmeDBPrismaClient.Product.update function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853603149);
    const currentTime = Math.floor(new Date().getTime() / 1000);

    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    const input = {
      id: '2e497c7c-3aa2-450a-ac53-e129f5c4cc34',
      name: 'Updated Awesome Product',
      categoryId: 2,
      ownerId: 2,
      licenseId: 2,
      downloadUrl: 'https://example.com/new-download',
      driveFileId: '',
      translationId: {
        id: '2e497c7c-3aa2-450a-ac53-e129f5c3cc34',
        en: '1e497c7c-3aa2-450a-ac53-e129f5c3cc34',
      },
      description: { id: 'Deskripsi baru', en: 'New description' },
      changelog: { id: '', en: '' },
      versionId: '1e497c7c-3aa2-450a-ac53-e129f5c3cc34',
      version: '1.0.0',
      priceType: PriceType.PAID,
      variants: [
        {
          dbId: '2e497c7c-3aa2-450a-ac53-e129f5c4cc34',
          name: 'Middle',
          downloadUrl: 'https://chatgpt.com/c/68b8ccfa-fb94-832e-aadc-0108da26bc6e',
          fileAccessPassword: 'lN384%_Z7f4ivJVd',
        },
      ],
      images: [
        {
          dbId: '2e497c7c-3aa2-450a-ac53-e129f5c4ac36',
          url: 'https://images.unsplash.com/photo-1750797636255-8c939940bcad',
          isThumbnail: true,
          width: 123,
          height: 456,
        },
      ],
    };
    pjmeDBPrismaClient.Category.findUnique.mockResolvedValue({ slug: 'scoreboard' });
    pjmeDBPrismaClient.Product.findUnique.mockResolvedValue({
      name: input.name,
      versions: [
        {
          releasedAt: currentTime,
          version: input.version,
        },
      ],
      category:  {
        slug: 'scoreboard',
      },
    });
    verifySession.mockResolvedValue({ isAuth: true, userId: 'admin-id-123' });
    pjmeDBPrismaClient.$transaction.mockResolvedValue([
      {
        id: '2e497c7c-3aa2-450a-ac53-e129f5c4cc34',
        versions: [
          { id: '2e497c7a-3aa2-450a-ac53-e129f5c4cc35', translations: [] },
        ],
        variants: input.variants.map(variant => ({ ...variant, prices: [] })),
        images: input.images,
      }, 
    ]);

    await updateProduct(input);

    expect(pjmeDBPrismaClient.$transaction).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Product.update).toHaveBeenCalledWith({
      where: { id: input.id },
      data: {
        categoryId: input.categoryId,
        ownerId: input.ownerId,
        licenseId: input.licenseId,
        name: input.name,
        slug: 'updated-awesome-product',
        downloadUrl: input.downloadUrl,
        driveFileId: null,
        updatedAt: currentTime,
        translations: {
          update: [
            {
              data: { description: input.description.id },
              where: { id: input.translationId.id },
            },
            {
              data: { description: input.description.en },
              where: { id: input.translationId.en },
            },
          ],
        },
        images: {
          upsert: input.images.map(image => {
            const imageId = image.dbId ?? v7();
            delete image.dbId;

            return {
              create: { ...image },
              update: { ...image },
              where: { id: imageId },
            };
          }),
        },
        variants: {
          upsert: input.variants.map(variant => {
            const variantId = variant.dbId ?? v7();
            delete variant.dbId;

            return {
              create: {
                ...variant,
              },
              update: {
                ...variant,
              },
              where: { id: variantId },
            };
          }),
        },
        priceType: input.priceType,
      },
      select: {
        versions: {
          orderBy: [
            { releasedAt: 'desc' },
            { id: 'desc' },
          ],
          take: 1,
          select: {
            id: true,
            translations: {
              select: { id: true, language: true },
            },
          },
        },
        images: {
          select: {
            id: true,
            url: true,
            isThumbnail: true,
            width: true,
            height: true,
          },
        },
        variants: {
          select: {
            id: true,
            name: true,
            downloadUrl: true,
            fileAccessPassword: true,
            prices: {
              select: {
                id: true,
                currencyCode: true,
                price: true,
              },
            },
          },
        },
      },
    });
  });
});
