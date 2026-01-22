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
  isPinnedSchema,
  filtersSchema,
} from '../validators/product-validator';
import { AdminRole, CurrencyCode, Language, PriceType, ProductStatus } from '@/constants/enums';
import PinLimitExceededError from '../errors/PinLimitExceededError';
import { isSemverFormat, mapTranslationsToObject } from '../utils';
import { v4, v7 } from 'uuid';
import NotAllowedError from '../errors/NotAllowedError';
import { contentCustomSchema } from '../validators/base-validator';
import UnauthenticatedError from '../errors/UnauthenticatedError';
import UnavailableError from '../errors/UnavailableError';
import { getGoogleDriveClient } from '../google-client';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { cmsConfig } from '@/config/cms';
import prisma from '../prisma';
import { hasAccess } from '../authorization';

// For validate additional rules when create and edit product
function validateProductRules({ parsedData, isApplicationCategory, userRole }) {
  // if category is application or price type is free, and downloadUrl is empty, then throw error
  if (isApplicationCategory || parsedData.priceType === PriceType.FREE) {
    if (!parsedData.downloadUrl) {
      throw new NotAllowedError('Download URL cannot be empty');
    }
  }

  // if category is application and version format is not in semver format, then throw error
  if (isApplicationCategory && !isSemverFormat(parsedData.version)) {
    throw new NotAllowedError('Version must follow simplified semantic versioning');
  }

  // when admin access rights are owner, then adminId must exist
  if (!parsedData.adminId && hasAccess(userRole, AdminRole.OWNER)) {
    throw new NotAllowedError('Admin ID cannot be empty');
  }

  parsedData.variants.forEach(variant => {
    // if variant downloadUrl exist and fileAccessPassword doesn't exist, then throw error
    if (variant.downloadUrl && !variant.fileAccessPassword) {
      throw new NotAllowedError('File access password cannot be empty');
    }

    if (parsedData.priceType === PriceType.PAID && variant.prices) {
      // if currencyCode = IDR then only integer, if USD allow decimal
      variant.prices.forEach(price => {
        if (price.currencyCode === CurrencyCode.IDR && !Number.isInteger(price.price)) {
          throw new NotAllowedError('IDR price cannot contain decimals');
        }
      });
    }
  });
}

export async function createProduct({
  name,
  categoryId,
  licenseId,
  ownerId,
  adminId,
  priceType,
  driveFileId,
  downloadUrl,
  version,
  description,
  variants,
  images,
  discount,
  status,
}) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedData = createProductSchema.parse({
      name,
      categoryId,
      licenseId,
      ownerId,
      adminId,
      priceType,
      driveFileId,
      downloadUrl,
      version,
      description,
      variants,
      images,
      discount,
      status,
    });

    const applicationCategory = await prisma.category.findUnique({
      where: { id: parsedData.categoryId, slug: 'application' },
      select: { id: true, },
    });
    const isApplicationCategory = applicationCategory !== null;

    validateProductRules({ parsedData, isApplicationCategory, userRole: session.userRole });

    const currentTime = Math.floor(new Date().getTime() / 1000);
    const slug = parsedData.name.toLowerCase().replace(/\s/g, '-');
    let createData = {
      categoryId: parsedData.categoryId,
      adminId: hasAccess(session.userRole, AdminRole.OWNER) ? parsedData.adminId : session.userId,
      ownerId: parsedData.ownerId,
      licenseId: parsedData.licenseId,

      status: parsedData.status,
      name: parsedData.name,
      slug,
      priceType: parsedData.priceType,

      createdAt: currentTime,
      updatedAt: currentTime,

      versions: {
        create: {
          version: parsedData.version,
          releasedAt: currentTime,
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
          if (!variant.downloadUrl) {
            delete variant.downloadUrl;
            delete variant.fileAccessPassword;
          }
          if (parsedData.priceType === PriceType.PAID && variant.prices) {
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

    if (parsedData.downloadUrl) createData.downloadUrl = parsedData.downloadUrl;
    if (parsedData.driveFileId) createData.driveFileId = parsedData.driveFileId;

    if (parsedData.discount?.value) {
      createData.discount = {
        create: {
          discount: parsedData.discount.value,
          expiredAt: parsedData.discount.expiredAt,
        },
      };
    }

    const result = await prisma.product.create({
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
      err.message = 'Action is not allowed';
      throw err;
    }

    console.error(err);
    throw new UnknownError();
  }
}

export async function getProducts(filters) {
  const session = await getServerSession(authOptions);
  const select = {
    id: true,
    name: true,
    priceType: true,
    status: true,
    isPinned: true,
    createdAt: true,
    updatedAt: true,
    category: {
      select: {
        name: true,
      },
    },
    admin: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    },
    variants: {
      select: {
        prices: {
          select: {
            currencyCode: true,
            price: true,
          },
        },
      },
    },
    versions: {
      orderBy: [
        { releasedAt: 'desc' },
        { id: 'desc' },
      ],
      take: 1,
      select: { releasedAt: true },
    },
  };

  try {
    const parsedFilters = filtersSchema.parse(filters);
    const where = {
      status: parsedFilters.status === 'active'
        ? { not: ProductStatus.INACTIVE }
        : ProductStatus.INACTIVE,
    };

    // if is not owner, then get only products that assigned to this admin
    if (!hasAccess(session.user.role, AdminRole.OWNER)) {
      filters.adminId = session.user.id;

      // don't select admin data
      if (select.admin) delete select.admin;
    }
    const pinnedProducts = await prisma.product.findMany({
      where: { isPinned: true, ...where },
      select,
      orderBy: { updatedAt: 'desc' },
    });
    const unpinnedProducts = await prisma.product.findMany({
      where: { isPinned: false, ...where },
      select,
      orderBy: { updatedAt: 'desc' },
    });

    return [...pinnedProducts, ...unpinnedProducts].map(({ admin, variants, ...product}) => {
      if (admin) {
        if (admin.id === session.user.id) {
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

/*
 * Get all products for selectable, like select input
 */
export async function getSelectableProducts() {
  const session = await getServerSession(authOptions);
  const select = { id: true, name: true, adminId: true };

  try {
    // don't select adminId when is owner
    if (hasAccess(session.user.role, AdminRole.OWNER)) delete select.adminId;

    const products = await prisma.product.findMany({
      where: {
        priceType: 'paid',
        category: {
          slug: 'application',
        },
        secretKey: null,
      },
      select,
      orderBy: { name: 'asc' },
    });

    return products.map(({ adminId, ...product}) => ({
      ...product,
      isAssignedToCurrentAdmin: adminId === session.user.id,
    }));
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function updateProductStatus(id, status) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedId = productIdSchema.parse(id);
    const parsedStatus = productStatusSchema.parse(status);
    
    return await prisma.product.update({
      where: {
        id: parsedId,
        // if is not owner, then only allow update product that assigned to this admin
        ...(!hasAccess(session.userRole, AdminRole.OWNER) ? { adminId: session.userId } : {}),
      },
      data: {
        status: parsedStatus,
        updatedAt: Math.floor(new Date().getTime() / 1000),
      },
      select: { id: true, updatedAt: true },
    });
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('Product not found. Please reload the page and try again.');
    }

    console.error(err);
    throw new UnknownError();
  }
}

export async function updateProductPinned(id, isPinned) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  if (!hasAccess(session.userRole, AdminRole.OWNER)) throw new NotAllowedError();

  try {
    const parsedId = productIdSchema.parse(id);
    const parsedIsPinned = isPinnedSchema.parse(isPinned);

    // check the number of products pinned
    const pinnedCount = await prisma.product.count({
      where: { isPinned: true },
    });
    const pinnedLimit = cmsConfig.product.pinnedLimit;
    if (isPinned && pinnedCount >= pinnedLimit) {
      throw new PinLimitExceededError(`You can only pin up to ${pinnedLimit} products`);
    }

    return await prisma.product.update({
      where: { id: parsedId },
      data: {
        isPinned: parsedIsPinned,
        updatedAt: Math.floor(new Date().getTime() / 1000),
      },
      select: { id: true, updatedAt: true },
    });
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('Product not found. Please reload the page and try again.');
    } else if (err.name === 'PinLimitExceededError') {
      throw err;
    }

    console.error(err);
    throw new UnknownError();
  }
}

export async function deleteProduct(id) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedId = productIdSchema.parse(id);
    const product = await prisma.product.findUnique({
      where: { id: parsedId },
      select: {
        isPinned: true,
        status: true,
      },
    });
    if (product.isPinned || product.status === ProductStatus.PUBLISHED) {
      throw new NotAllowedError();
    }

    const result = await prisma.product.delete({
      where: {
        id: parsedId,
        // if is not owner, then only allow delete product that assigned to this admin
        ...(!hasAccess(session.userRole, AdminRole.OWNER) ? { adminId: session.userId } : {}),
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
      downloadUrl: variant.downloadUrl ?? '',
      fileAccessPassword: variant.fileAccessPassword ?? '',
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
      downloadUrl: '',
      fileAccessPassword: '',
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
          expiredAt: product.discount.expiredAt,
        }
        : { value: '', expiredAt: '' },
      coupon: product.coupon ?? { code: '', discount: '', expiredAt: '' },
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
        categoryId: product.categoryId,
        ownerId: product.ownerId,
        licenseId: product.licenseId,
        driveFileId: product.driveFileId ?? '',
        downloadUrl: product.downloadUrl ?? '',
        priceType: product.priceType,
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
      dbPriceType: product.priceType,
      dbVersion: product.versions[0].version,
      dbChangelog: changelog,
    },
    meta: {
      versionStatus: 'pristine', // pristine | changed | neutralized | rollback
    },
  };

  if (product.adminId) {
    formStoreData.form.basic.adminId = product.adminId;
  }

  return formStoreData;
}

export async function getProduct(id) {
  const idResult = productIdSchema.safeParse(id);
  if (!idResult.success) return null;
  const parsedId = idResult.data;

  const session = await getServerSession(authOptions);

  try {
    const isNotOwnerAdmin = !hasAccess(session.user.role, AdminRole.OWNER);
    const product = await prisma.product.findUnique({
      where: {
        id: parsedId,
        // if is not owner, then only get product that assigned to this admin
        ...(isNotOwnerAdmin ? { adminId: session?.user?.id } : {}),
      },
      select: {
        id: true,
        categoryId: true,
        ownerId: true,
        // if is not owner, then don't select adminId
        ...(isNotOwnerAdmin ? {} : { adminId: true }),
        licenseId: true,
        driveFileId: true,
        downloadUrl: true,
        name: true,
        priceType: true,
        translations: {
          select: {
            id: true,
            language: true,
            description: true,
          },
        },
        versions: {
          orderBy: [
            { releasedAt: 'desc' },
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
            expiredAt: true,
          },
        },
        coupon: {
          select: {
            id: true,
            code: true,
            discount: true,
            expiredAt: true,
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
    if (!product) return null;

    product.translations = mapTranslationsToObject(product.translations);
    product.versions[0].translations = mapTranslationsToObject(product.versions[0].translations);

    return mapProductToFormData(product);
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

async function deleteProductChild({ 
  entityName,      // e.g., 'productVariant', 'productImage'
  entityLabel,     // e.g., 'Variant', 'Image' - for error message
  id, 
  productId 
}) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedProductId = productIdSchema.parse(productId);

    const deleteWhere = { id };
    const updateWhere = { id: parsedProductId };

    if (!hasAccess(session.userRole, AdminRole.OWNER)) {
      deleteWhere.product = { adminId: session.userId };
      updateWhere.adminId = session.userId;
    }

    return await prisma.$transaction([
      prisma[entityName].delete({
        where: deleteWhere,
        select: { id: true },
      }),
      prisma.product.update({
        where: updateWhere,
        data: {
          updatedAt: Math.floor(Date.now() / 1000),
        },
        select: { id: true },
      }),
    ]);
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError(`${entityLabel} not found. Please reload the page and try again.`);
    }

    console.error(err);
    throw new UnknownError();
  }
}

export async function deleteProductVariant(id, productId) {
  const parsedId = productVariantIdSchema.parse(id);
  
  return deleteProductChild({
    entityName: 'productVariant',
    entityLabel: 'Variant',
    id: parsedId,
    productId,
  });
}

export async function deleteProductImage(id, productId) {
  const parsedId = productImageIdSchema.parse(id);
  
  return deleteProductChild({
    entityName: 'productImage',
    entityLabel: 'Image',
    id: parsedId,
    productId,
  });
}

export async function deleteProductDiscount(id, productId) {
  const parsedId = productDiscountIdSchema.parse(id);
  
  return deleteProductChild({
    entityName: 'productDiscount',
    entityLabel: 'Discount',
    id: parsedId,
    productId,
  });
}

export async function deleteProductCoupon(id, productId) {
  const parsedId = productCouponIdSchema.parse(id);
  
  return deleteProductChild({
    entityName: 'productCoupon',
    entityLabel: 'Coupon',
    id: parsedId,
    productId,
  });
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
    ownerId: parsedData.ownerId,
    licenseId: parsedData.licenseId,
    name: parsedData.name,
    slug,
    downloadUrl: normalizeToNull(parsedData.downloadUrl),
    driveFileId: normalizeToNull(parsedData.driveFileId),
    updatedAt: currentTime,
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
          downloadUrl: normalizeToNull(variant.downloadUrl),
          fileAccessPassword: normalizeToNull(variant.fileAccessPassword),
        };
        
        if (parsedData.priceType === PriceType.PAID && variant.prices) {
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
                  create: { price: price.price, currencyCode: price.currencyCode },
                  update: { price: price.price, currencyCode: price.currencyCode },
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

  // if admin is owner, then allow update adminId
  if (hasAccess(session.userRole, AdminRole.OWNER)) {
    updateData.adminId = parsedData.adminId;
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
      updateData.versions.create.releasedAt = dbReleasedAt;
    } else {
      updateData.versions.create.releasedAt = currentTime;
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
    updateData.categoryId = parsedData.categoryId;
  }
  if (parsedData.priceType === PriceType.PAID) {
    updateData.priceType = PriceType.PAID;
    hasPriceType = true;
  }

  return {
    hasPriceType,
    operation: prisma.product.update({
      where: { id: parsedData.id },
      data: updateData,
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
    }),
  };
}

function getDiscountOperation({ discount, hasPriceType, productId }) {
  if (!hasPriceType) return [];

  if (discount?.id) {
    if (discount.value) {
      return [
        prisma.productDiscount.update({
          where: { id: discount.id },
          data: {
            discount: discount.value,
            expiredAt: discount.expiredAt,
          },
          select: { id: true },
        }),
      ];
    }

    return [
      prisma.productDiscount.delete({
        where: { id: discount.id },
        select: { id: true },
      }),
    ];
  }

  if (discount?.value) {
    return [
      prisma.productDiscount.create({
        data: {
          productId,
          discount: discount.value,
          expiredAt: discount.expiredAt,
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
        prisma.productCoupon.update({
          where: { id: coupon.id },
          data: {
            code: coupon.code,
            discount: coupon.discount,
            expiredAt: coupon.expiredAt,
          },
          select: { id: true },
        }),
      ];
    }

    return [
      prisma.productCoupon.delete({
        where: { id: coupon.id },
        select: { id: true },
      }),
    ];
  }

  if (coupon?.code) {
    return [
      prisma.productCoupon.create({
        data: {
          productId,
          code: coupon.code,
          discount: coupon.discount,
          expiredAt: coupon.expiredAt,
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
  categoryId,
  licenseId,
  ownerId,
  adminId,
  priceType,
  driveFileId,
  downloadUrl,
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
      categoryId,
      licenseId,
      ownerId,
      adminId,
      priceType,
      driveFileId,
      downloadUrl,
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
    const newCategory = await prisma.category.findUnique({
      where: { id: parsedData.categoryId },
      select: { slug: true },
    });
    
    const isApplicationCategory = newCategory.slug === 'application';
    validateProductRules({
      parsedData,
      isApplicationCategory,
    });
    
    const product = await prisma.product.findUnique({
      where: {
        id: parsedData.id,
        // if is not owner, then only select product that assigned to this admin
        ...(!hasAccess(session.userRole, AdminRole.OWNER) ? { adminId: session.userId } : {}),
      },
      select: {
        name: true,
        versions: {
          orderBy: [
            { releasedAt: 'desc' },
            { id: 'desc' },
          ],
          take: 1,
          select: {
            releasedAt: true,
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
    if (!product) throw new NotAllowedError('This product is not under your responsibility');

    const shouldUpdateCategory = product.category.slug !== 'application' && newCategory.slug !== 'application';
    const isVersionChanged = product.versions[0].version !== parsedData.version;

    // Ensure changelog must be not empty when version changed
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
      dbReleasedAt: product.versions[0].releasedAt,
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
    const results = await prisma.$transaction(transactionItems);

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
