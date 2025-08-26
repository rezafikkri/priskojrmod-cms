import 'server-only';

import verifySession from '../verifySession';
import UnknownError from '../errors/UnknownError';
import NotFoundError from '../errors/NotFoundError';
import DuplicateError from '../errors/DuplicateError';
import {
  createProductSchema,
  productIdSchema,
  updateProductPinnedStatusSchema,
  updateProductPublishedStatusSchema,
  productDiscountIdSchema,
  productCouponIdSchema,
  productVariantIdSchema,
  productImageIdSchema,
  editProductSchema,
} from '../validators/product-validator';
import pjmeDBPrismaClient from '../pjme-prisma-client';
import { Language, PriceType } from '@/constants/enums';
import PinLimitExceededError from '../errors/PinLimitExceededError';
import { isSemverFormat, mapTranslationsToObject } from '../utils';
import { v4, v7 } from 'uuid';
import { updateAppName } from './secret-key-service';
import { JWT } from 'google-auth-library';
import NotAllowedError from '../errors/NotAllowedError';

function validateProductRules({ parsedData, isApplicationCategory }) {
  // if category is application or price type is free, and download_link is empty, then throw error
  if (isApplicationCategory || parsedData.price_type === PriceType.FREE) {
    if (!parsedData.download_link) {
      throw new NotAllowedError();
    }
  }

  // if category is application and version format is not in semver format, then throw error
  if (isApplicationCategory && !isSemverFormat(parsedData.version)) {
    throw new NotAllowedError();
  }

  // if variant download_link exist and file_access_password doesn't exist, then throw error
  parsedData.variants.forEach(variant => {
    if (variant.download_link && !variant.file_access_password) {
      throw new NotAllowedError();
    }
  });
}

export async function createProduct({
  name,
  category_id,
  license_id,
  owner_id,
  price_type,
  drive_file_id,
  download_link,
  version,
  description,
  variants,
  images,
  discount,
  coupon,
  is_published,
}) {
  const session = await verifySession();
  if (!session) throw new Error('Unauthenticated');

  try {
    const parsedData = createProductSchema.parse({
      name,
      category_id,
      license_id,
      owner_id,
      price_type,
      drive_file_id,
      download_link,
      version,
      description,
      variants,
      images,
      discount,
      coupon,
      is_published,
    });

    const applicationCategory = await pjmeDBPrismaClient.Category.findUnique({
      where: { id: parsedData.category_id, slug: 'application' },
      select: { id: true, },
    });
    const isApplicationCategory = applicationCategory !== null;

    validateProductRules({ parsedData, isApplicationCategory });

    const currentTime = BigInt(Math.floor(new Date().getTime() / 1000));
    const slug = parsedData.name.toLowerCase().replace(/\s/g, '-');
    let createData = {
      category_id: parsedData.category_id,
      admin_id: session.userId,
      owner_id: parsedData.owner_id,
      license_id: parsedData.license_id,
      is_published: parsedData.is_published,

      name: parsedData.name,
      slug,
      price_type: parsedData.price_type,

      created_at: currentTime,
      updated_at: currentTime,

      versions: {
        create: {
          version: parsedData.version,
          released_at: currentTime,
        },
      },

      translations: {
        create: [
          { language: Language.ID, description: parsedData.description.id },
          { language: Language.EN, description: parsedData.description.en },
        ],
      },
      images: {
        create: parsedData.images,
      },
      variants: {
        create: parsedData.variants.map(variant => {
          if (!variant.download_link) {
            delete variant.download_link;
            delete variant.file_access_password;
          }
          if (parsedData.price_type === PriceType.PAID && variant.prices) {
            return {
              ...variant,
              prices: {
                create: variant.prices,
              },
            };
          } else {
            delete variant.prices;
          }
          return variant;
        }),
      },
    };

    if (parsedData.download_link) {
      createData.download_link = parsedData.download_link;
    }
    if (parsedData.drive_file_id) {
      createData.drive_file_id = parsedData.drive_file_id;
    }

    if (parsedData.discount?.value) {
      createData.discount = {
        create: {
          discount: parsedData.discount.value,
          expired_at: BigInt(parsedData.discount.expired_at),
        },
      };
    }
    if (parsedData.coupon?.code) {
      createData.coupon = {
        create: {
          ...parsedData.coupon,
          expired_at: BigInt(parsedData.coupon.expired_at),
        },
      };
    }

    return await pjmeDBPrismaClient.Product.create({
      data: createData,
      select: { id: true },
    });
  } catch (err) {
     if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2002') {
      throw new DuplicateError('Product name already exists.');
    }   

    console.error(err);
    throw new UnknownError();
  }
}

export async function getProducts({
  select = {
    id: true,
    name: true,
    price_type: true,
    is_published: true,
    is_pinned: true,
    created_at: true,
    updated_at: true,
    variants: {
      select: {
        prices: {
          select: {
            currency_code: true,
            price: true,
          },
        },
      },
    },
    versions: {
      orderBy: { released_at: 'desc' },
      take: 1,
      select: { released_at: true },
    },
  },
  filters = {},
} = {}) {
  try {
    const pinnedProducts = await pjmeDBPrismaClient.Product.findMany({
      where: { is_pinned: true, ...filters },
      select,
      orderBy: { updated_at: 'desc' },
    });
    const unpinnedProducts = await pjmeDBPrismaClient.Product.findMany({
      where: { is_pinned: false, ...filters },
      select,
      orderBy: { updated_at: 'desc' },
    });
    return [...pinnedProducts, ...unpinnedProducts].map(product => {
      if (product.created_at) {
        product.created_at = product.created_at.toString();
      }
      if (product.updated_at) {
        product.updated_at = product.updated_at.toString();
      }
      if (product.versions) {
        product.versions = product.versions.map(version => ({
          ...version,
          released_at: version.released_at.toString(),
        }));
      }

      return product;
    });
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function updateProductPinnedStatus({ id, is_pinned }) {
  const session = await verifySession();
  if (!session) throw new Error('Unauthenticated');

  try {
    const parsedData = updateProductPinnedStatusSchema.parse({
      id,
      is_pinned,
    });

    // check the number of products pinned
    const pinnedCount = await pjmeDBPrismaClient.Product.count({
      where: { is_pinned: true },
    });
    const pinnedLimit = parseInt(process.env.PRODUCT_PINNED_LIMIT);
    if (parsedData.is_pinned && pinnedCount >= pinnedLimit) {
      throw new PinLimitExceededError(`You can only pin up to ${pinnedLimit} products.`);
    }

    const result = await pjmeDBPrismaClient.Product.update({
      where: { id: parsedData.id },
      data: {
        is_pinned: parsedData.is_pinned,
        updated_at: BigInt(Math.floor(new Date().getTime() / 1000)),
      },
      select: { id: true, updated_at: true },
    });
    result.updated_at = result.updated_at.toString();
    return result;
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('Product not found, please reload the page and try again.');
    } else if (err.name === 'PinLimitExceededError') {
      throw err;
    }

    console.error(err);
    throw new UnknownError();
  }
}

export async function updateProductPublishedStatus({ id, is_published }) {
  const session = await verifySession();
  if (!session) throw new Error('Unauthenticated');

  try {
    const parsedData = updateProductPublishedStatusSchema.parse({
      id,
      is_published,
    });

    const result = await pjmeDBPrismaClient.Product.update({
      where: { id: parsedData.id },
      data: {
        is_published: parsedData.is_published,
        updated_at: BigInt(Math.floor(new Date().getTime() / 1000)),
      },
      select: { id: true, updated_at: true },
    });
    result.updated_at = result.updated_at.toString();
    return result;
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('Product not found, please reload the page and try again.');
    }

    console.error(err);
    throw new UnknownError();
  }
}

export async function deleteProduct(id) {
  const session = await verifySession();
  if (!session) throw new Error('Unauthenticated');

  try {
    const parsedId = productIdSchema.parse(id);
    return await pjmeDBPrismaClient.Product.delete({
      where: { id: parsedId },
      select: { id: true },
    });
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('Product not found, please reload the page and try again.');
    }

    console.error(err);
    throw new UnknownError();
  }
}

// This function only used for edit product action
// mode parameter in this function is for used after success update product
function mapProductToFormData(product, mode = 'normal') {
  const prices = [];
  const variants = [];
  for (const variant of product.variants) {
    variants.push({
      dbId: variant.id,
      name: variant.name,
      download_link: variant.download_link ?? '',
    });

    for (const price of variant.prices) {
      prices.push({
        ...price,
        variantId: variant.id,
        variantName: variant.name,
      });
    }
  }
  if (variants.length < 1 && mode === 'normal') {
    variants.push({
      id: v4(),
      name: '',
      download_link: '',
    });
  }

  const images = product.images.map(image => {
    const newImage = { ...image };
    newImage.dbId = image.id;
    delete newImage.id;
    return newImage;
  });

  let pricing = {
    prices,
  };
  if (mode === 'updateProduct') {
    if (product.discount) {
      pricing = {
        ...pricing,
        discount: product.discount,
      };
    }
    if (product.coupon) {
      pricing = {
        ...pricing,
        coupon: product.coupon,
      };
    }
  } else {
    pricing = {
      ...pricing,
      price_type: product.price_type,
      discount: product.discount
        ? {
            id: product.discount.id,
            value: product.discount.discount,
            expired_at: product.discount.expired_at,
          }
        : { value: '', expired_at: '' },
      coupon: product.coupon ?? { code: '', discount: '', expired_at: '' },
      should_update_released_at: false,
    }
  } 

  const extrasAndPricing = {
    extras: {
      variants,
      images,
    },
    pricing,
  };

  if (mode === 'updateProduct') {
    return extrasAndPricing;
  }

  const content = {
    translationId: {
      id: product.translations.id.id,
      en: product.translations.id.en,
    },
    description: {
      id: product.translations.description.id,
      en: product.translations.description.en,
    },
    changelog: product.versions[0].translations.changelog
      ? {
        id: product.versions[0].translations.changelog.id,
        en: product.versions[0].translations.changelog.id,
      }
      : { id: '', en: '' },
  };
  if (product.versions[0].translations.id) {
    content.versionTranslationId = {
      id: product.versions[0].translations.id.id,
      en: product.versions[0].translations.id.en,
    };
  }

  return {
    basic: {
      id: product.id,
      name: product.name,
      category_id: product.category_id,
      owner_id: product.owner_id,
      license_id: product.license_id,
      drive_file_id: product.drive_file_id ?? '',
      download_link: product.download_link ?? '',
      price_type: product.price_type,
      dbPriceType: product.price_type,
      versionId: product.versions[0].id,
      version: product.versions[0].version,
    },
    content,
    ...extrasAndPricing,
  };
}

export async function getProduct(id) {
  const idResult = productIdSchema.safeParse(id);
  if (!idResult.success) return null;
  const parsedId = idResult.data;

  try {
    const product = await pjmeDBPrismaClient.Product.findUnique({
      where: { id: parsedId },
      select: {
        id: true,
        category_id: true,
        owner_id: true,
        license_id: true,
        drive_file_id: true,
        download_link: true,
        name: true,
        price_type: true,
        translations: {
          select: {
            id: true,
            language: true,
            description: true,
          },
        },
        versions: {
          orderBy: { released_at: 'desc' },
          take: 1,
          select: {
            id: true,
            version: true,
            translations: {
              select: {
                id: true,
                language: true,
                changelog: true,
              },
            },
          },
        },
        discount: {
          select: {
            id: true,
            discount: true,
            expired_at: true,
          },
        },
        coupon: {
          select: {
            id: true,
            code: true,
            discount: true,
            expired_at: true,
          },
        },
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
    if (!product) return null;

    product.translations = mapTranslationsToObject(product.translations);
    product.versions[0].translations = mapTranslationsToObject(product.versions[0].translations);

    if (product.coupon) {
      product.coupon.expired_at = product.coupon.expired_at.toString();
    }
    if (product.discount) {
      product.discount.expired_at = product.discount.expired_at.toString();
    }

    return mapProductToFormData(product);
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function deleteProductVariant(id, productId) {
  const session = await verifySession();
  if (!session) throw new Error('Unauthenticated');

  try {
    const parsedId = productVariantIdSchema.parse(id);

    return await pjmeDBPrismaClient.$transaction([
      pjmeDBPrismaClient.ProductVariant.delete({
        where: { id: parsedId },
        select: { id: true },
      }),
      pjmeDBPrismaClient.Product.update({
        where: { id: productId },
        data: {
          updated_at: BigInt(Math.floor(Date.now() / 1000)),
        },
        select: { id: true },
      }),
    ]);
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('Variant not found, please reload the page and try again.');
    }

    console.error(err);
    throw new UnknownError();
  }
}

export async function deleteProductImage(id, productId) {
  const session = await verifySession();
  if (!session) throw new Error('Unauthenticated');

  try {
    const parsedId = productImageIdSchema.parse(id);

    return await pjmeDBPrismaClient.$transaction([
      pjmeDBPrismaClient.ProductImage.delete({
        where: { id: parsedId },
        select: { id: true },
      }),
      pjmeDBPrismaClient.Product.update({
        where: { id: productId },
        data: {
          updated_at: BigInt(Math.floor(Date.now() / 1000)),
        },
        select: { id: true },
      }),
    ]);
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('Image not found, please reload the page and try again.');
    }

    console.error(err);
    throw new UnknownError();
  }
}

export async function deleteProductDiscount(id, productId) {
  const session = await verifySession();
  if (!session) throw new Error('Unauthenticated');

  try {
    const parsedId = productDiscountIdSchema.parse(id);

    return await pjmeDBPrismaClient.$transaction([
      pjmeDBPrismaClient.ProductDiscount.delete({
        where: { id: parsedId },
        select: { id: true },
      }),
      pjmeDBPrismaClient.Product.update({
        where: { id: productId },
        data: {
          updated_at: BigInt(Math.floor(Date.now() / 1000)),
        },
        select: { id: true },
      }),
    ]);
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('Discount not found, please reload the page and try again.');
    }

    console.error(err);
    throw new UnknownError();
  }
}

export async function deleteProductCoupon(id, productId) {
  const session = await verifySession();
  if (!session) throw new Error('Unauthenticated');

  try {
    const parsedId = productCouponIdSchema.parse(id);

    return await pjmeDBPrismaClient.$transaction([
      pjmeDBPrismaClient.ProductCoupon.delete({
        where: { id: parsedId },
        select: { id: true },
      }),
      pjmeDBPrismaClient.Product.update({
        where: { id: productId },
        data: {
          updated_at: BigInt(Math.floor(Date.now() / 1000)),
        },
        select: { id: true },
      }),
    ]);
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('Coupon not found, please reload the page and try again.');
    }

    console.error(err);
    throw new UnknownError();
  }
}

function getProductOperationWithPriceFlag(parsedData, shouldUpdateCategory) {
  const currentTime = BigInt(Math.floor(new Date().getTime() / 1000));
  const slug = parsedData.name.toLowerCase().replace(/\s/g, '-');

  let hasPriceType = false;
  // generate product table update data
  let productUpdateData = {
    owner_id: parsedData.owner_id,
    license_id: parsedData.license_id,
    name: parsedData.name,
    slug,
    download_link: parsedData.download_link,
    updated_at: currentTime,
    translations: {
      update: [
        {
          data: { description: parsedData.description.id, changelog: parsedData.changelog.id },
          where: { id: parsedData.translationId.id },
        },
        {
          data: { description: parsedData.description.en, changelog: parsedData.changelog.en },
          where: { id: parsedData.translationId.en },
        },
      ],
    },
    images: {
      upsert: parsedData.images.map(image => {
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
      upsert: parsedData.variants.map(variant => {
        const variantId = variant.dbId ?? v7();
        delete variant.dbId;
        
        if (parsedData.price_type === PriceType.PAID && variant.prices) {
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
                  where: { id: price.id ?? v7() },
                })),
              },
            },
            where: { id: variantId },
          };
        }

        delete variant.prices;
        return { create: variant, update: variant, where: { id: variantId } };
      }),
    },
  };

  if (shouldUpdateCategory) {
    productUpdateData.category_id = parsedData.category_id;
  }
  if (parsedData.should_update_released_at) {
    productUpdateData.released_at = currentTime;
  }
  if (parsedData.price_type === PriceType.PAID) {
    productUpdateData.price_type = PriceType.PAID;
    hasPriceType = true;
  }

  return {
    hasPriceType,
    operation: pjmeDBPrismaClient.Product.update({
      where: { id: parsedData.id },
      data: productUpdateData,
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
    }),
  };
}

function getDiscountOperation({ discount, hasPriceType, productId }) {
  if (!hasPriceType) return [];

  if (discount.id) {
    if (discount.value) {
      return [
        pjmeDBPrismaClient.ProductDiscount.update({
          where: { id: discount.id },
          data: {
            discount: discount.value,
            expired_at: BigInt(discount.expired_at),
          },
          select: { id: true },
        }),
      ];
    }

    return [
      pjmeDBPrismaClient.ProductDiscount.delete({
        where: { id: discount.id },
        select: { id: true },
      }),
    ];
  }

  if (discount.value) {
    return [
      pjmeDBPrismaClient.ProductDiscount.create({
        data: {
          product_id: productId,
          discount: discount.value,
          expired_at: BigInt(discount.expired_at),
        },
        select: { id: true },
      }),
    ];
  }
  return [];
}

function getCouponOperation({ coupon, hasPriceType, productId}) {
  if (!hasPriceType) return [];

  if (coupon.id) {
    if (coupon.code) {
      return [
        pjmeDBPrismaClient.ProductCoupon.update({
          where: { id: coupon.id },
          data: {
            code: coupon.code,
            discount: coupon.discount,
            expired_at: BigInt(coupon.expired_at),
          },
          select: { id: true },
        }),
      ];
    }

    return [
      pjmeDBPrismaClient.ProductCoupon.delete({
        where: { id: coupon.id },
        select: { id: true },
      }),
    ];
  }

  if (coupon.code) {
    return [
      pjmeDBPrismaClient.ProductCoupon.create({
        data: {
          product_id: productId,
          code: coupon.code,
          discount: coupon.discount,
          expired_at: BigInt(coupon.expired_at),
        },
        select: { id: true },
      }),
    ];
  }

  return [];
}

export async function updateProduct({
  id,
  name,
  category_id,
  license_id,
  owner_id,
  download_link,
  translationId,
  description,
  changelog,
  variants,
  images,
  discount,
  coupon,
  price_type,
  should_update_released_at,
}) {
  const session = await verifySession();
  if (!session) throw new Error('Unauthenticated');

  try {
    const parsedData = editProductSchema.parse({
      id,
      name,
      category_id,
      license_id,
      owner_id,
      download_link,
      translationId,
      description,
      changelog,
      variants,
      images,
      discount,
      coupon,
      price_type,
      should_update_released_at,
    });

    const product = await pjmeDBPrismaClient.Product.findUnique({
      where: { id: parsedData.id },
      select: {
        category: {
          select: {
            slug: true,
          },
        },
      },
    });
    const newCategory = await pjmeDBPrismaClient.category.findUnique({
      where: { id: parsedData.category_id },
      select: { slug: true },
    });

    const shouldUpdateCategory = product.category.slug !== 'application' && newCategory.slug !== 'application';

    const { operation, hasPriceType } = getProductOperationWithPriceFlag(parsedData, shouldUpdateCategory);
    let transactionItems = [
      operation,
      ...getDiscountOperation({ discount: parsedData.discount, hasPriceType, productId: parsedData.id }),
      ...getCouponOperation({ coupon: parsedData.coupon, hasPriceType, productId: parsedData.id }),
    ];

    const results = await pjmeDBPrismaClient.$transaction(transactionItems);

    // update product name in sceret-key table
    await updateAppName({ product_id: parsedData.id, name: parsedData.name });

    const productFormData = mapProductToFormData(
      {
        ...results[0],
        discount: parsedData.discount?.value ? results[1] : null,
        coupon: parsedData.coupon?.code ? results[2] ?? results[1] : null,
      },
      'updateProduct',
    );

    return productFormData;
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('Product not found.');
    }

    console.error(err);
    throw new UnknownError();
  }
}

export async function getDriveFileInfo(fileId) {
  try {
    const auth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=name,size`;
    const res = await auth.fetch(url);
    return res.data;
  } catch (err) {
    if (err.code === 404) {
      throw new NotFoundError('File not found. Please check the Google Drive file ID.');
    }

    console.error(err);
    throw new UnknownError();   
  }
}
