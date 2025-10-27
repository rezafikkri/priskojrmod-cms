import 'server-only';

import verifySession from '../verifySession';
import UnknownError from '../errors/UnknownError';
import NotFoundError from '../errors/NotFoundError';
import DuplicateError from '../errors/DuplicateError';
import {
  createProductSchema,
  productIdSchema,
  productDiscountIdSchema,
  productCouponIdSchema,
  productVariantIdSchema,
  productImageIdSchema,
  editProductSchema,
  productStatusSchema,
} from '../validators/product-validator';
import pjmeDBPrismaClient from '../pjme-prisma-client';
import { CurrencyCode, Language, PriceType } from '@/constants/enums';
import PinLimitExceededError from '../errors/PinLimitExceededError';
import { isSemverFormat, mapTranslationsToObject } from '../utils';
import { v4, v7 } from 'uuid';
import { updateAppName } from './secret-key-service';
import NotAllowedError from '../errors/NotAllowedError';
import { contentCustomSchema } from '../validators/base-validator';
import UnauthenticatedError from '../errors/UnauthenticatedError';
import UnavailableError from '../errors/UnavailableError';
import { getGoogleDriveClient } from '../google-client';

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

  parsedData.variants.forEach(variant => {
    // if variant download_link exist and file_access_password doesn't exist, then throw error
    if (variant.download_link && !variant.file_access_password) {
      throw new NotAllowedError();
    }

    if (parsedData.price_type === PriceType.PAID && variant.prices) {
      // if currencyCode = IDR the only integer, if USD allow decimal
      variant.prices.forEach(price => {
        if (price.currency_code === CurrencyCode.IDR && !Number.isInteger(price.price)) {
          throw new NotAllowedError();
        }
      });
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
  is_published,
}) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

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
      is_published,
    });

    const applicationCategory = await pjmeDBPrismaClient.Category.findUnique({
      where: { id: parsedData.category_id, slug: 'application' },
      select: { id: true, },
    });
    const isApplicationCategory = applicationCategory !== null;

    validateProductRules({ parsedData, isApplicationCategory });

    const currentTime = Math.floor(new Date().getTime() / 1000);
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
          expired_at: parsedData.discount.expired_at,
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
    } else if (err.name === 'NotAllowedError') {
      throw err;
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
      orderBy: [
        { released_at: 'desc' },
        { id: 'desc' },
      ],
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
      if (product.variants) {
        product.variants = product.variants.map(variant => {
          if (variant.prices) {
            return {
              ...variant,
              prices: variant.prices.map(item => ({
                ...item,
                price: item.price.toNumber(),
              })),
            };
          }
          return variant;
        });
      }

      return product;
    });
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

async function updateProductStatus({
  id,
  field,
  value,
}) {
  try {
    const parsedId = productIdSchema.parse(id);
    const parsedValue = productStatusSchema.parse(value);
    
    return await pjmeDBPrismaClient.Product.update({
      where: { id: parsedId },
      data: {
        [field]: parsedValue,
        updated_at: Math.floor(new Date().getTime() / 1000),
      },
      select: { id: true, updated_at: true },
    });
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('Product not found, please reload the page and try again.');
    }

    console.error(err);
    throw new UnknownError();
  }
}

export async function updateProductPinnedStatus(id, isPinned) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    // check the number of products pinned
    const pinnedCount = await pjmeDBPrismaClient.Product.count({
      where: { is_pinned: true },
    });
    const pinnedLimit = parseInt(process.env.PRODUCT_PINNED_LIMIT);
    if (isPinned && pinnedCount >= pinnedLimit) {
      throw new PinLimitExceededError(`You can only pin up to ${pinnedLimit} products.`);
    }

    return await updateProductStatus({
      id,
      field: 'is_pinned',
      value: isPinned,
    });
  } catch (err) {
    if (
      err.name === 'PinLimitExceededError' ||
      err.name === 'NotFoundError' ||
      err.name === 'UnknownError'
    ) {
      throw err;
    }

    console.error(err);
    throw new UnknownError();
  }
}

export async function updateProductPublishedStatus(id, isPublished) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  return await updateProductStatus({
    id,
    field: 'is_published',
    value: isPublished,
  });
}

export async function deleteProduct(id) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedId = productIdSchema.parse(id);
    const product = await pjmeDBPrismaClient.Product.findUnique({
      where: { id: parsedId },
      select: {
        is_pinned: true,
        is_published: true,
      },
    });
    if (product.is_pinned || product.is_published) {
      throw new NotAllowedError();
    }

    return await pjmeDBPrismaClient.Product.delete({
      where: { id: parsedId },
      select: { id: true },
    });
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('Product not found, please reload the page and try again.');
    } else if (err.name === 'NotAllowedError') {
      throw err;
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
      file_access_password: variant.file_access_password ?? '',
    });

    if (variant.prices.length > 0) {
      prices.push({
        variantId: variant.id,
        variantName: variant.name,
        currencies: variant.prices.map(item => ({ ...item, price: item.price.toNumber() })),
      });
    }
  }
  // if all variants in db deleted, and admin reload page, the need to add one default variant
  if (variants.length < 1 && mode === 'normal') {
    variants.push({
      id: v4(),
      name: '',
      download_link: '',
      file_access_password: '',
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
      discount: product.discount
        ? {
          id: product.discount.id,
          value: product.discount.discount,
          expired_at: product.discount.expired_at,
        }
        : { value: '', expired_at: '' },
      coupon: product.coupon ?? { code: '', discount: '', expired_at: '' },
    }
  }

  const basic = {
    versionId: product.versions[0].id,
  };

  const content = {};
  if (product.versions[0].translations.id) {
    content.versionTranslationId = {
      id: product.versions[0].translations.id.id,
      en: product.versions[0].translations.id.en,
    };
  }

  const updatedFormData = {
    basic,
    content,
    extras: {
      variants,
      images,
    },
    pricing,
  };

  if (mode === 'updateProduct') {
    return updatedFormData;
  }

  const changelog = product.versions[0].translations.changelog
    ? {
      id: product.versions[0].translations.changelog.id,
      en: product.versions[0].translations.changelog.id,
    }
    : { id: '', en: '' };

  return {
    form: {
      basic: {
        id: product.id,
        name: product.name,
        category_id: product.category_id,
        owner_id: product.owner_id,
        license_id: product.license_id,
        drive_file_id: product.drive_file_id ?? '',
        download_link: product.download_link ?? '',
        price_type: product.price_type,
        version: product.versions[0].version,
        ...basic,
      },
      content: {
        translationId: {
          id: product.translations.id.id,
          en: product.translations.id.en,
        },
        description: {
          id: product.translations.description.id,
          en: product.translations.description.en,
        },
        changelog,
        ...content,
      },
      extras: {
        variants,
        images,
      },
      pricing,
    },
    reference: {
      dbPriceType: product.price_type,
      dbVersion: product.versions[0].version,
      dbChangelog: changelog,
    },
    meta: {
      versionStatus: 'pristine', // pristine | changed | neutralized | rollback
    },
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
          orderBy: [
            { released_at: 'desc' },
            { id: 'desc' },
          ],
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
            file_access_password: true,
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

    return mapProductToFormData(product);
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function deleteProductVariant(id, productId) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

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
          updated_at: Math.floor(Date.now() / 1000),
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
  if (!session) throw new UnauthenticatedError();

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
          updated_at: Math.floor(Date.now() / 1000),
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
  if (!session) throw new UnauthenticatedError();

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
          updated_at: Math.floor(Date.now() / 1000),
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
  if (!session) throw new UnauthenticatedError();

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
          updated_at: Math.floor(Date.now() / 1000),
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

/**
 * Trim a string, return null if empty.
 * @param {string} val
 * @returns {string|null}
 */
const normalizeToNull = (val) => val.trim() || null;

function getProductOperationWithPriceFlag({
  parsedData,
  shouldUpdateCategory,
  isVersionChanged,
  dbVersion,
  isApplicationCategory,
  dbReleasedAt,
}) {
  const currentTime = Math.floor(new Date().getTime() / 1000);
  const slug = parsedData.name.toLowerCase().replace(/\s/g, '-');

  let hasPriceType = false;
  // generate product table update data
  let updateData = {
    owner_id: parsedData.owner_id,
    license_id: parsedData.license_id,
    name: parsedData.name,
    slug,
    download_link: normalizeToNull(parsedData.download_link),
    drive_file_id: normalizeToNull(parsedData.drive_file_id),
    updated_at: currentTime,
    translations: {
      update: [
        {
          data: { description: parsedData.description.id },
          where: { id: parsedData.translationId.id },
        },
        {
          data: { description: parsedData.description.en },
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
        const upsertVariant = {
          name: variant.name,
          download_link: normalizeToNull(variant.download_link),
          file_access_password: normalizeToNull(variant.file_access_password),
        };
        
        if (parsedData.price_type === PriceType.PAID && variant.prices) {
          return {
            create: {
              ...upsertVariant,
              prices: {
                create: variant.prices,
              },
            },
            update: {
              ...upsertVariant,
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

        return {
          create: upsertVariant,
          update: upsertVariant,
          where: { id: variantId },
        };
      }),
    },
  };  

  if (isVersionChanged) {
    updateData.versions = {
      create: {
        version: parsedData.version,
        translations: {
          create: [
            { language: Language.ID, changelog: parsedData.changelog.id },
            { language: Language.EN, changelog: parsedData.changelog.en },
          ],
        },
      },
    };

    // When category is application, when updated version is only patch version,
    // then use prev released at for released at, otherwise, use currentTime for released at
    const prevVersions = dbVersion.split('.');
    const prevPatch = prevVersions[2];
    const prevMajorMinor = `${prevVersions[0]}.${prevVersions[1]}`;

    const currentVersions = parsedData.version.split('.');
    const currentPatch = currentVersions[2];
    const currentMajorMinor = `${currentVersions[0]}.${currentVersions[1]}`;

    const isPatchOnlyUpdate = prevPatch !== currentPatch && prevMajorMinor === currentMajorMinor;
    if (isApplicationCategory && isPatchOnlyUpdate) {
      updateData.versions.create.released_at = dbReleasedAt;
    } else {
      updateData.versions.create.released_at = currentTime;
    }
  } else if (parsedData.versionTranslationId) {
    updateData.versions = {
      update: {
        data: {
          translations: {
            update: [
              {
                data: { changelog: parsedData.changelog.id },
                where: { id: parsedData.versionTranslationId.id },
              },
              {
                data: { changelog: parsedData.changelog.en },
                where: { id: parsedData.versionTranslationId.en },
              },
            ],
          },
        },
        where: { id: parsedData.versionId },
      },
    };
  }

  if (shouldUpdateCategory) {
    updateData.category_id = parsedData.category_id;
  }
  if (parsedData.price_type === PriceType.PAID) {
    updateData.price_type = PriceType.PAID;
    hasPriceType = true;
  }

  return {
    hasPriceType,
    operation: pjmeDBPrismaClient.Product.update({
      where: { id: parsedData.id },
      data: updateData,
      select: {
        versions: {
          orderBy: [
            { released_at: 'desc' },
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
            file_access_password: true,
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

  if (discount?.id) {
    if (discount.value) {
      return [
        pjmeDBPrismaClient.ProductDiscount.update({
          where: { id: discount.id },
          data: {
            discount: discount.value,
            expired_at: discount.expired_at,
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

  if (discount?.value) {
    return [
      pjmeDBPrismaClient.ProductDiscount.create({
        data: {
          product_id: productId,
          discount: discount.value,
          expired_at: discount.expired_at,
        },
        select: { id: true },
      }),
    ];
  }
  return [];
}

function getCouponOperation({ coupon, hasPriceType, productId, isVersionChanged}) {
  if (!hasPriceType) return [];

  if (coupon?.id) {
    if (coupon.code && !isVersionChanged) {
      return [
        pjmeDBPrismaClient.ProductCoupon.update({
          where: { id: coupon.id },
          data: {
            code: coupon.code,
            discount: coupon.discount,
            expired_at: coupon.expired_at,
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

  if (coupon?.code) {
    return [
      pjmeDBPrismaClient.ProductCoupon.create({
        data: {
          product_id: productId,
          code: coupon.code,
          discount: coupon.discount,
          expired_at: coupon.expired_at,
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
  price_type,
  drive_file_id,
  download_link,
  versionId,
  version,
  translationId,
  description,
  versionTranslationId,
  changelog,
  variants,
  images,
  discount,
  coupon,
}) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedData = editProductSchema.parse({
      id,
      name,
      category_id,
      license_id,
      owner_id,
      price_type,
      drive_file_id,
      download_link,
      versionId,
      version,
      translationId,
      description,
      versionTranslationId,
      changelog,
      variants,
      images,
      discount,
      coupon,
    });

    // Main initial reason for select to db is for validate update category
    const newCategory = await pjmeDBPrismaClient.Category.findUnique({
      where: { id: parsedData.category_id },
      select: { slug: true },
    });
    
    const isApplicationCategory = newCategory.slug === 'application';
    validateProductRules({
      parsedData,
      isApplicationCategory,
    });
    
    const product = await pjmeDBPrismaClient.Product.findUnique({
      where: { id: parsedData.id },
      select: {
        name: true,
        versions: {
          orderBy: [
            { released_at: 'desc' },
            { id: 'desc' },
          ],
          take: 1,
          select: {
            released_at: true,
            version: true,
          },
        },
        category: {
          select: {
            slug: true,
          },
        },
      },
    });

    const shouldUpdateCategory = product.category.slug !== 'application' && newCategory.slug !== 'application';
    const isVersionChanged = product.versions[0].version !== parsedData.version;

    // Ensure content must be not empty when version changed
    if (isVersionChanged) {
      const changelogIdResult = contentCustomSchema.safeParse(parsedData.changelog.id);
      const changelogEnResult = contentCustomSchema.safeParse(parsedData.changelog.en);

      if (!changelogIdResult.success || !changelogEnResult.success) {
        throw new NotAllowedError();
      }
    }

    const { operation, hasPriceType } = getProductOperationWithPriceFlag({
      parsedData,
      shouldUpdateCategory,
      isVersionChanged,
      dbVersion: product.versions[0].version,
      isApplicationCategory,
      dbReleasedAt: product.versions[0].released_at,
    });
    let transactionItems = [
      operation,
      ...getDiscountOperation({ discount: parsedData.discount, hasPriceType, productId: parsedData.id }),
      ...getCouponOperation({
        coupon: parsedData.coupon,
        hasPriceType,
        productId: parsedData.id,
        isVersionChanged,
      }),
    ];

    // Update product
    const results = await pjmeDBPrismaClient.$transaction(transactionItems);

    if (product.name !== parsedData.name) {
      // update product name in sceret-key table
      await updateAppName({ product_id: parsedData.id, name: parsedData.name });
    }

    const productFormData = mapProductToFormData(
      {
        ...results[0],
        versions: [{
          id: results[0].versions[0].id,
          translations: mapTranslationsToObject(results[0].versions[0].translations),
        }],
        discount: parsedData.discount?.value ? results[1] : null,
        coupon: parsedData.coupon?.code ? results[2] ?? results[1] : null,
      },
      'updateProduct',
    );

    return productFormData;
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError') {
      if (err.code === 'P2025') {
        throw new NotFoundError('Product not found.');
      } else if (err.code === 'P2002') {
        throw new DuplicateError(`Version ${version} already exists for this product.`);
      }
    } else if (err.name === 'NotAllowedError') {
      throw err;
    }

    console.error(err);
    throw new UnknownError();
  }
}

export async function getDriveFileInfo(fileId) {
  const driveClient = getGoogleDriveClient();

  try {
    const res = await driveClient.request({
      url: `https://www.googleapis.com/drive/v3/files/${fileId}`,
      method: 'GET',
      params: {
        fields: 'name,size,trashed',
      },
    });

    const data = res.data;

    if (data.trashed) {
      throw new UnavailableError('File is in trash. Please restore it from Google Drive.');
    }

    return res.data;
  } catch (err) {
    if (err.code === 404) {
      throw new NotFoundError('File not found. Please check the Google Drive file ID.');
    }

    console.error(err);
    throw new UnknownError();   
  }
}
