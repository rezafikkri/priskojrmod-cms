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
import { CurrencyCode, Language, PriceType } from '@/constants/enums';

beforeAll(() => {
  vi.mock('server-only', () => ({}));

  vi.mock('@/lib/verifySession', () => ({
    default: vi.fn(),
  }));

  vi.mock('@/lib/pjme-prisma-client', () => ({
    default: {
      Product: {
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
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

    await expect(createProduct({})).rejects.toThrow('Unauthenticated');

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Product.create).not.toHaveBeenCalled();
  });

  it('Should call pjmeDBPrismaClient.Product.create function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853503149);

    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 'admin-id-123' });

    const input = {
      name: 'Awesome New Product',
      category_id: 1,
      license_id: 1,
      owner_id: 1,
      download_link: 'https://example.com/download',
      description: {
        id: 'Deskripsi produk keren',
        en: 'Awesome product description',
      },
      variants: [
        { name: 'Standard', prices: [{ price: 10000, currency_code: 'IDR' }] },
      ],
      images: [
        { url: 'https://images.unsplash.com/photo-1750222382424-610417abf3b1', is_thumbnail: true, width: 100, height: 100 },
      ],
      discount: { value: 10, expired_at: '1735689600' },
      coupon: { code: 'NICE', discount: 5, expired_at: '1735689600' },
      is_published: true,
      price_type: PriceType.PAID,
    };

    await createProduct(input);

    const currentTime = BigInt(Math.floor(new Date().getTime() / 1000));

    expect(pjmeDBPrismaClient.Product.create).toHaveBeenCalledWith({
      data: {
        category_id: input.category_id,
        admin_id: 'admin-id-123',
        owner_id: input.owner_id,
        license_id: input.license_id,
        name: input.name,
        slug: 'awesome-new-product',
        price_type: input.price_type,
        is_published: input.is_published,
        created_at: currentTime,
        released_at: currentTime,
        updated_at: currentTime,
        download_link: input.download_link,
        translations: {
          create: [
            { language: Language.ID, description: input.description.id },
            { language: Language.EN, description: input.description.en },
          ],
        },
        images: {
          create: input.images,
        },
        variants: {
          create: [{
            ...input.variants[0],
            prices: { create: input.variants[0].prices },
          }],
        },
        discount: {
          create: {
            discount: input.discount.value,
            expired_at: BigInt(input.discount.expired_at),
          },
        },
        coupon: {
          create: {
            ...input.coupon,
            expired_at: BigInt(input.coupon.expired_at),
          },
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

    await expect(updateProductPinnedStatus({ id: '999c549f-33d7-461e-9f0e-928b17097e42', is_pinned: true }))
      .rejects.toThrow('Unauthenticated');

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
      updated_at: BigInt(Math.floor(new Date().getTime() / 1000)),
    });

    await updateProductPinnedStatus({ id: '999c549f-33d7-461e-9f0e-928b17097e42', is_pinned: true });

    expect(pjmeDBPrismaClient.Product.count).toHaveBeenCalledWith({ where: { is_pinned: true }});
    expect(pjmeDBPrismaClient.Product.update).toHaveBeenCalledWith({
      where: { id: '999c549f-33d7-461e-9f0e-928b17097e42' },
      data: {
        is_pinned: true,
        updated_at: BigInt(Math.floor(new Date().getTime() / 1000)),
      },
      select: { id: true, updated_at: true },
    });
  });
});

describe('updateProductPublishedStatus function', () => {
  it('Should call verifySession function, not call pjmeDBPrismaClient.Product.update function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(updateProductPublishedStatus({
      id: 'fd209fe2-3f60-42b2-9985-99b3fc4f8600',
      is_published: true,
    })).rejects.toThrow('Unauthenticated');

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
      updated_at: BigInt(Math.floor(new Date().getTime() / 1000)),
    });

    await updateProductPublishedStatus({ id: 'fd209fe2-3f60-42b2-9985-99b3fc4f8600', is_published: false });

    expect(pjmeDBPrismaClient.Product.update).toHaveBeenCalledWith({
      where: { id: 'fd209fe2-3f60-42b2-9985-99b3fc4f8600' },
      data: {
        is_published: false,
        updated_at: BigInt(Math.floor(new Date().getTime() / 1000)),
      },
      select: { id: true, updated_at: true },
    });
  });
});

describe('deleteProduct function', () => {
  it('Should call verifySession function, not call pjmeDBPrismaClient.Product.delete function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(deleteProduct('6cb32c0f-a38a-4e42-bf45-d5a964205ab3')).rejects.toThrow('Unauthenticated');

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Product.delete).not.toHaveBeenCalled();
  });

  it('Should call pjmeDBPrismaClient.Product.delete function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 'admin-id-123' });

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
    )).rejects.toThrow('Unauthenticated');

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.$transaction).not.toHaveBeenCalled();
    expect(pjmeDBPrismaClient.ProductVariant.delete).not.toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Product.update).not.toHaveBeenCalled();
  });

  it('Should call pjmeDBPrismaClient.$transaction function and call pjmeDBPrismaClient.ProductVariant.delete and pjmeDBPrismaClient.Product.update function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853603149);
    const currentTime = BigInt(Math.floor(new Date().getTime() / 1000));

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
      data: { updated_at: currentTime },
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
    )).rejects.toThrow('Unauthenticated');

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.$transaction).not.toHaveBeenCalled();
    expect(pjmeDBPrismaClient.ProductImage.delete).not.toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Product.update).not.toHaveBeenCalled();
  });

  it('Should call pjmeDBPrismaClient.$transaction function and call pjmeDBPrismaClient.ProductImage.delete and pjmeDBPrismaClient.Product.update function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853603149);
    const currentTime = BigInt(Math.floor(new Date().getTime() / 1000));

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
      data: { updated_at: currentTime },
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
      .rejects.toThrow('Unauthenticated');

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.$transaction).not.toHaveBeenCalled();
    expect(pjmeDBPrismaClient.ProductDiscount.delete).not.toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Product.update).not.toHaveBeenCalled();
  });

  it('Should call pjmeDBPrismaClient.$transaction function and call pjmeDBPrismaClient.ProductDiscount.delete and pjmeDBPrismaClient.Product.update function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853603149);
    const currentTime = BigInt(Math.floor(new Date().getTime() / 1000));

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
      data: { updated_at: currentTime },
      select: { id: true },
    });
  });
});

describe('deleteProductCoupon function', () => {
  it('Should call verifySession function, not call pjmeDBPrismaClient.$transaction, pjmeDBPrismaClient.ProductCoupon.delete and pjmeDBPrismaClient.Product.update function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(deleteProductCoupon(1, '2e497c7c-3aa2-450a-ac53-e129f5c3cc94'))
      .rejects.toThrow('Unauthenticated');

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.$transaction).not.toHaveBeenCalled();
    expect(pjmeDBPrismaClient.ProductCoupon.delete).not.toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Product.update).not.toHaveBeenCalled();
  });

  it('Should call pjmeDBPrismaClient.$transaction function and call pjmeDBPrismaClient.ProductCoupon.delete and pjmeDBPrismaClient.Product.update function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853603149);
    const currentTime = BigInt(Math.floor(new Date().getTime() / 1000));

    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 'admin-id-123' });

    await deleteProductCoupon(1, '2e497c7c-3aa2-450a-ac53-e129f5c3cc94');

    expect(pjmeDBPrismaClient.$transaction).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.$transaction.mock.calls[0][0]).toHaveLength(2);

    expect(pjmeDBPrismaClient.ProductCoupon.delete).toHaveBeenCalledWith({
      where: { id: 1 },
      select: { id: true },
    });
    expect(pjmeDBPrismaClient.Product.update).toHaveBeenCalledWith({
      where: { id: '2e497c7c-3aa2-450a-ac53-e129f5c3cc94' },
      data: { updated_at: currentTime },
      select: { id: true },
    });
  });
});

describe('updateProduct function', () => {
  it('Should call verifySession function, not call pjmeDBPrismaClient.$transaction, pjmeDBPrismaClient.Product.update function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(updateProduct({})).rejects.toThrow('Unauthenticated');

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.$transaction).not.toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Product.update).not.toHaveBeenCalled();
  });

  it('Should call pjmeDBPrismaClient.$transaction function and pjmeDBPrismaClient.Product.update function twice correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853603149);
    const currentTime = BigInt(Math.floor(new Date().getTime() / 1000));

    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 'admin-id-123' });
    const input = {
      id: '2e497c7c-3aa2-450a-ac53-e129f5c4cc34',
      name: 'Updated Awesome Product',
      category_id: 2,
      owner_id: 2,
      license_id: 2,
      download_link: 'https://example.com/new-download',
      translationId: {
        id: '2e497c7c-3aa2-450a-ac53-e129f5c3cc34',
        en: '1e497c7c-3aa2-450a-ac53-e129f5c3cc34',
      },
      description: { id: 'Deskripsi baru', en: 'New description' },
      changelog: { id: 'Catatan perubahan', en: 'Changelog' },
      variants: [
        {
          dbId: '2e497c7c-3aa2-450a-ac53-e129f5c4cc34',
          name: 'Middle',
          download_link: '',
          prices: [
            {
              id: '2e497c7c-3aa2-450a-ac53-e129f5c4cc35',
              currency_code: CurrencyCode.IDR,
              price: 20000,
            },
          ],
        },
      ],
      images: [
        {
          dbId: '2e497c7c-3aa2-450a-ac53-e129f5c4ac34',
          url: 'https://images.unsplash.com/photo-1750797636255-8c939940bcad',
          is_thumbnail: true,
          width: 123,
          height: 456,
        },
      ],
      discount: { id: 1, value: 15, expired_at: '1735776000' },
      coupon: { id: 1, code: 'NEW', discount: 10, expired_at: '1735776000' },
      price_type: PriceType.PAID,
      should_update_released_at: true,
    };
    pjmeDBPrismaClient.$transaction.mockResolvedValue([
      { id: '2e497c7c-3aa2-450a-ac53-e129f5c4cc34', variants: input.variants, images: input.images }, 
      { id: 1 },
      { id: 1 },
    ]);

    await updateProduct(input);

    expect(pjmeDBPrismaClient.$transaction).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Product.update).toHaveBeenCalledWith({
      where: { id: input.id },
      data: {
        category_id: input.category_id,
        owner_id: input.owner_id,
        license_id: input.license_id,
        name: input.name,
        slug: 'updated-awesome-product',
        download_link: input.download_link,
        updated_at: currentTime,
        translations: {
          update: [
            {
              data: { description: input.description.id, changelog: input.changelog.id },
              where: { id: input.translationId.id },
            },
            {
              data: { description: input.description.en, changelog: input.changelog.en },
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
                prices: {
                  create: variant.prices,
                },
              },
              update: {
                ...variant,
                prices: {
                  upsert: variant.prices.map(price => ({
                    create: { price: price.price, currency_code: price.currency_code },
                    update: { price: price.price, currency_code: price.currency_code },
                    where: { id: price.id },
                  })),
                },
              },
              where: { id: variantId },
            };
          }),
        },
        released_at: currentTime,
        price_type: input.price_type,
      },
      select: {
        images: {
          select: {
            id: true,
            url: true,
            is_thumbnail: true,
            width: true,
            height: true,
          },
        },
        variants: {
          select: {
            id: true,
            name: true,
            download_link: true,
            prices: {
              select: {
                id: true,
                currency_code: true,
                price: true,
              },
            },
          },
        },
      },
    });
    expect(pjmeDBPrismaClient.ProductDiscount.update).toHaveBeenCalledWith({
      where: { id: input.discount.id },
      data: {
        discount: input.discount.value,
        expired_at: BigInt(input.discount.expired_at)
      },
      select: { id: true }
    });
    expect(pjmeDBPrismaClient.ProductCoupon.update).toHaveBeenCalledWith({
      where: { id: input.coupon.id },
      data: {
        code: input.coupon.code,
        discount: input.coupon.discount,
        expired_at: BigInt(input.coupon.expired_at)
      },
      select: { id: true }
    });
  });
});
