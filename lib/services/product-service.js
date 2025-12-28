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
import { isOwnerAdmin, isSemverFormat, mapTranslationsToObject } from '../utils';
import { v4, v7 } from 'uuid';
import { updateAppName } from './secret-key-service';
import NotAllowedError from '../errors/NotAllowedError';
import { contentCustomSchema } from '../validators/base-validator';
import UnauthenticatedError from '../errors/UnauthenticatedError';
import UnavailableError from '../errors/UnavailableError';
import { getGoogleDriveClient } from '../google-client';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { cmsConfig } from '@/config/cms';

// For validate additional rules when create and edit product
function validateProductRules({ parsedData, isApplicationCategory, adminRole }) {
  // if category is application or price type is free, and download_url is empty, then throw error
  if (isApplicationCategory || parsedData.price_type === PriceType.FREE) {
    if (!parsedData.download_url) {
      throw new NotAllowedError('Download URL cannot be empty');
    }
  }

  // if category is application and version format is not in semver format, then throw error
  if (isApplicationCategory && !isSemverFormat(parsedData.version)) {
    throw new NotAllowedError('Version must follow simplified semantic versioning');
  }

  // when admin access rights are owner, then admin_id must exist
  if (!parsedData.admin_id && isOwnerAdmin(adminRole)) {
    throw new NotAllowedError('Admin ID cannot be empty');
  }

  parsedData.variants.forEach(variant => {
    // if variant download_url exist and file_access_password doesn't exist, then throw error
    if (variant.download_url && !variant.file_access_password) {
      throw new NotAllowedError('File access password cannot be empty');
    }

    if (parsedData.price_type === PriceType.PAID && variant.prices) {
      // if currencyCode = IDR then only integer, if USD allow decimal
      variant.prices.forEach(price => {
        if (price.currency_code === CurrencyCode.IDR && !Number.isInteger(price.price)) {
          throw new NotAllowedError('IDR price cannot contain decimals');
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
  admin_id,
  price_type,
  drive_file_id,
  download_url,
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
      admin_id,
      price_type,
      drive_file_id,
      download_url,
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

    validateProductRules({ parsedData, isApplicationCategory, adminRole: session.userRole });

    const currentTime = Math.floor(new Date().getTime() / 1000);
    const slug = parsedData.name.toLowerCase().replace(/\s/g, '-');
    let createData = {
      category_id: parsedData.category_id,
      admin_id: isOwnerAdmin(session.userRole) ? parsedData.admin_id : session.userId,
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
          if (!variant.download_url) {
            delete variant.download_url;
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

    if (parsedData.download_url) {
      createData.download_url = parsedData.download_url;
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

    const result = await pjmeDBPrismaClient.Product.create({
      data: createData,
      select: { id: true },
    });

    // revalidate Router cache, Data cache and Full Route cache
    revalidatePath('/secret-key/new');

    return result;
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2002') {
      throw new DuplicateError('Product name already exists');
    }

    if (err.name === 'NotAllowedError') {
      console.error(err.message);
      err.message = 'Action is not allowed.';
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
    category: {
      select: {
        name: true,
      },
    },
    admin: {
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
      },
    },
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
  const session = await getServerSession(authOptions);

  try {
    // if is not owner, then get only products that assigned to this admin
    if (!isOwnerAdmin(session?.user?.role)) {
      filters.admin_id = session?.user?.id;

      // don't select admin data
      if (select.admin) delete select.admin;
    }
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

    return [...pinnedProducts, ...unpinnedProducts].map(({ admin, variants, ...product}) => {
      if (admin) {
        if (admin.id === session?.user?.id) {
          product.admin = { isCurrentUser: true };
        } else {
          product.admin = admin;
        }
      }

      if (variants) {
        product.variants = variants.map(variant => {
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
  session,
}) {
  try {
    const parsedId = productIdSchema.parse(id);
    const parsedValue = productStatusSchema.parse(value);
    
    return await pjmeDBPrismaClient.Product.update({
      where: {
        id: parsedId,
        // if is not owner, then only allow update product that assigned to this admin
        ...(!isOwnerAdmin(session.userRole) ? { admin_id: session.userId } : {}),
      },
      data: {
        [field]: parsedValue,
        updated_at: Math.floor(new Date().getTime() / 1000),
      },
      select: { id: true, updated_at: true },
    });
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('Product not found. Please reload the page and try again.');
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
    const pinnedLimit = cmsConfig.product.pinnedLimit;
    if (isPinned && pinnedCount >= pinnedLimit) {
      throw new PinLimitExceededError(`You can only pin up to ${pinnedLimit} products`);
    }

    return await updateProductStatus({
      id,
      field: 'is_pinned',
      value: isPinned,
      session,
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
    session,
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

    const result = await pjmeDBPrismaClient.Product.delete({
      where: {
        id: parsedId,
        // if is not owner, then only allow delete product that assigned to this admin
        ...(!isOwnerAdmin(session.userRole) ? { admin_id: session.userId } : {}),
      },
      select: { id: true },
    });

    // revalidate Router cache, Data cache and Full Route cache
    revalidatePath('/secret-key/new');

    return result;
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('Product not found. Please reload the page and try again.');
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
      download_url: variant.download_url ?? '',
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
      download_url: '',
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

  const formStoreData = {
    form: {
      basic: {
        id: product.id,
        name: product.name,
        category_id: product.category_id,
        owner_id: product.owner_id,
        license_id: product.license_id,
        drive_file_id: product.drive_file_id ?? '',
        download_url: product.download_url ?? '',
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

  if (product.admin_id) {
    formStoreData.form.basic.admin_id = product.admin_id;
  }

  return formStoreData;
}

export async function getProduct(id) {
  const idResult = productIdSchema.safeParse(id);
  if (!idResult.success) return null;
  const parsedId = idResult.data;

  const session = await getServerSession(authOptions);

  try {
    const isNotOwnerAdmin = !isOwnerAdmin(session?.user?.role);
    const product = await pjmeDBPrismaClient.Product.findUnique({
      where: {
        id: parsedId,
        // if is not owner, then only get product that assigned to this admin
        ...(isNotOwnerAdmin ? { admin_id: session?.user?.id } : {}),
      },
      select: {
        id: true,
        category_id: true,
        owner_id: true,
        // if is not owner, then don't select admin_id
        ...(isNotOwnerAdmin ? {} : { admin_id: true }),
        license_id: true,
        drive_file_id: true,
        download_url: true,
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
            download_url: true,
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

    const deleteWhere = { id: parsedId };
    const updateWhere = { id: productId };

    if (!isOwnerAdmin(session.userRole)) {
      deleteWhere.product = { admin_id: session.userId };
      updateWhere.admin_id = session.userId;
    }

    return await pjmeDBPrismaClient.$transaction([
      pjmeDBPrismaClient.ProductVariant.delete({
        where: deleteWhere,
        select: { id: true },
      }),
      pjmeDBPrismaClient.Product.update({
        where: updateWhere,
        data: {
          updated_at: Math.floor(Date.now() / 1000),
        },
        select: { id: true },
      }),
    ]);
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('Variant not found. Please reload the page and try again.');
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

    const deleteWhere = { id: parsedId };
    const updateWhere = { id: productId };

    if (!isOwnerAdmin(session.userRole)) {
      deleteWhere.product = { admin_id: session.userId };
      updateWhere.admin_id = session.userId;
    }

    return await pjmeDBPrismaClient.$transaction([
      pjmeDBPrismaClient.ProductImage.delete({
        where: deleteWhere,
        select: { id: true },
      }),
      pjmeDBPrismaClient.Product.update({
        where: updateWhere,
        data: {
          updated_at: Math.floor(Date.now() / 1000),
        },
        select: { id: true },
      }),
    ]);
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('Image not found. Please reload the page and try again.');
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

    const deleteWhere = { id: parsedId };
    const updateWhere = { id: productId };

    if (!isOwnerAdmin(session.userRole)) {
      deleteWhere.product = { admin_id: session.userId };
      updateWhere.admin_id = session.userId;
    }

    return await pjmeDBPrismaClient.$transaction([
      pjmeDBPrismaClient.ProductDiscount.delete({
        where: deleteWhere,
        select: { id: true },
      }),
      pjmeDBPrismaClient.Product.update({
        where: updateWhere,
        data: {
          updated_at: Math.floor(Date.now() / 1000),
        },
        select: { id: true },
      }),
    ]);
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('Discount not found. Please reload the page and try again.');
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

    const deleteWhere = { id: parsedId };
    const updateWhere = { id: productId };

    if (!isOwnerAdmin(session.userRole)) {
      deleteWhere.product = { admin_id: session.userId };
      updateWhere.admin_id = session.userId;
    }

    return await pjmeDBPrismaClient.$transaction([
      pjmeDBPrismaClient.ProductCoupon.delete({
        where: deleteWhere,
        select: { id: true },
      }),
      pjmeDBPrismaClient.Product.update({
        where: updateWhere,
        data: {
          updated_at: Math.floor(Date.now() / 1000),
        },
        select: { id: true },
      }),
    ]);
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('Coupon not found. Please reload the page and try again.');
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
  session,
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
    download_url: normalizeToNull(parsedData.download_url),
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
          download_url: normalizeToNull(variant.download_url),
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

  // if admin is owner, then allow update admin_id
  if (isOwnerAdmin(session.userRole)) {
    updateData.admin_id = parsedData.admin_id;
  }

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
            download_url: true,
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
  admin_id,
  price_type,
  drive_file_id,
  download_url,
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
      admin_id,
      price_type,
      drive_file_id,
      download_url,
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
      where: {
        id: parsedData.id,
        // if is not owner, then only select product that assigned to this admin
        ...(!isOwnerAdmin(session.userRole) ? { admin_id: session.userId } : {}),
      },
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

    // if product = null, then admin tried to update product that was not his right
    if (!product) throw new NotAllowedError();

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
      session,
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

    // revalidate Router cache, Data cache and Full Route cache
    revalidatePath('/secret-key/new');
    revalidatePath('/secret-key');

    return productFormData;
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError') {
      if (err.code === 'P2025') {
        throw new NotFoundError('Product not found');
      } else if (err.code === 'P2002') {
        throw new DuplicateError(`Version ${version} already exists for this product`);
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
