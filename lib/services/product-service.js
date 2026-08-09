import 'server-only';

import verifySession from '../verifySession';
import UnknownError from '../errors/UnknownError';
import NotFoundError from '../errors/NotFoundError';
import DuplicateError from '../errors/DuplicateError';
import {
  createProductSchema,
  productIdSchema,
  productDiscountIdSchema,
  productUpgradeCouponIdSchema,
  productVariantIdSchema,
  productImageIdSchema,
  editProductSchema,
  productStatusSchema,
  isPinnedSchema,
  filtersSchema,
  withDownloadUrlRefine,
  withVersionRefine,
  withChangelogSuperRefine,
} from '../validators/product-validator';
import {
  UserRole,
  Language,
  PriceType,
  ProductStatus,
  TransactionStatus,
} from '@/constants/enums';
import PinLimitExceededError from '../errors/PinLimitExceededError';
import { mapTranslationsToObject, getUnixTimestamp } from '../utils';
import { v4, v7 } from 'uuid';
import NotAllowedError from '../errors/NotAllowedError';
import UnavailableError from '../errors/UnavailableError';
import { getGoogleDriveClient } from '../google-client';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { cmsConfig } from '@/config/cms';
import prisma from '../prisma';
import { hasAccess } from '../authorization';
import { APPLICATION_CATEGORY_SLUG } from '@/constants/categories';
import { isLicenseKeyExpired } from './license-key-service';

// For validate additional rules when create and edit product
// but specify for authorization rules
function validateProductAuthorizationRules({ parsedData, userRole }) {
  // when admin access rights are owner, then admin must not empty
  if (!parsedData.adminId && hasAccess(userRole, UserRole.OWNER)) {
    throw new NotAllowedError('Admin cannot be empty');
  }
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

  try {
    const applicationCategory = await prisma.category.findUnique({
      where: { slug: APPLICATION_CATEGORY_SLUG },
      select: { id: true, },
    });

    let schema = withDownloadUrlRefine({
      schema: createProductSchema,
      applicationCategoryId: applicationCategory.id,
    });
    schema = withVersionRefine({ schema, applicationCategoryId: applicationCategory.id });

    const parsedData = schema.parse({
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

    validateProductAuthorizationRules({ parsedData, userRole: session.userRole });

    const currentTime = getUnixTimestamp();
    const slug = parsedData.name.toLowerCase().replace(/\s/g, '-');
    let createData = {
      categoryId: parsedData.categoryId,
      adminId: hasAccess(session.userRole, UserRole.OWNER) ? parsedData.adminId : session.userId,
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
      throw new DuplicateError('Product cannot be created because a product with the same name already exists.');
    }

    if (err.name === 'NotAllowedError') {
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
    if (!hasAccess(session?.user?.role, UserRole.OWNER)) {
      where.adminId = session?.user?.id;

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
                price: item.price.toString(),
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
 * Get all application products for selectable, like select input
 */
export async function getSelectableProducts() {
  const session = await getServerSession(authOptions);
  const select = { id: true, name: true, adminId: true };

  try {
    // don't select adminId when is owner
    if (hasAccess(session?.user?.role, UserRole.OWNER)) delete select.adminId;

    const products = await prisma.product.findMany({
      where: {
        priceType: 'paid',
        category: {
          slug: APPLICATION_CATEGORY_SLUG,
        },
        secretKey: null,
        status: { not: 'inactive' },
      },
      select,
      orderBy: { name: 'asc' },
    });

    return products.map(({ adminId, ...product}) => ({
      ...product,
      isAssignedToCurrentAdmin: adminId === session?.user?.id,
    }));
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function updateProductStatus(id, status) {
  const session = await verifySession();

  try {
    const parsedId = productIdSchema.parse(id);
    const parsedStatus = productStatusSchema.parse(status);
    
    return await prisma.product.update({
      where: {
        id: parsedId,
        // if is not owner, then only allow update product that assigned to this admin
        ...(!hasAccess(session.userRole, UserRole.OWNER) ? { adminId: session.userId } : {}),
      },
      data: {
        status: parsedStatus,
        updatedAt: getUnixTimestamp(),
      },
      select: { id: true, updatedAt: true },
    });
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      const actionLabel = {
        [ProductStatus.INACTIVE]: 'deactivate',
        [ProductStatus.PUBLISHED]: 'publish',
        [ProductStatus.UNPUBLISHED]: 'unpublish',
      };
      throw new NotFoundError(`Failed to ${actionLabel[status]} the product because it was not found. Please refresh the table and try again.`);
    }

    console.error(err);
    throw new UnknownError();
  }
}

export async function updateProductPinned(id, isPinned) {
  const session = await verifySession();

  if (!hasAccess(session.userRole, UserRole.OWNER)) throw new NotAllowedError();

  try {
    const parsedId = productIdSchema.parse(id);
    const parsedIsPinned = isPinnedSchema.parse(isPinned);

    // check the number of products pinned
    const pinnedCount = await prisma.product.count({
      where: { isPinned: true },
    });
    const pinnedLimit = cmsConfig.product.pinnedLimit;
    if (isPinned && pinnedCount >= pinnedLimit) {
      throw new PinLimitExceededError(`Product cannot be pinned because you have reached the limit of ${pinnedLimit} pinned products.`);
    }

    return await prisma.product.update({
      where: { id: parsedId },
      data: {
        isPinned: parsedIsPinned,
        updatedAt: getUnixTimestamp(),
      },
      select: { id: true, updatedAt: true },
    });
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      const actionLabel = isPinned ? 'pin' : 'unpin';
      throw new NotFoundError(`Failed to ${actionLabel} the product because it was not found. Please refresh the table and try again.`);
    } else if (err.name === 'PinLimitExceededError') {
      throw err;
    }

    console.error(err);
    throw new UnknownError();
  }
}

export async function deleteProduct(id) {
  const session = await verifySession();

  try {
    const parsedId = productIdSchema.parse(id);
    const product = await prisma.product.findUnique({
      where: { id: parsedId },
      select: {
        isPinned: true,
        status: true,
        category: {
          select: { slug: true },
        },
      },
    });

    // if product not found
    if (!product) {
      throw new NotFoundError('Failed to delete the product because it was not found. Please refresh the table and try again.');
    }
    
    // if product is still pinned or published 
    if (product.isPinned || product.status === ProductStatus.PUBLISHED) {
      throw new NotAllowedError('Product cannot be deleted because it is still pinned or published.');
    }

    // if there is transaction pending associated with the product
    const hasPendingTransaction = await prisma.transactionDetail.count({
      where: {
        productId: parsedId,
        transaction: {
          status: TransactionStatus.PENDING,
        },
      },
    });

    if (hasPendingTransaction > 0) {
      throw new NotAllowedError('Product cannot be deleted because there are still pending transactions for this product. Please resolve them first.');
    }

    // if category = application
    if (product.category.slug === APPLICATION_CATEGORY_SLUG) {
      const secretKey = await prisma.secretKey.findUnique({
        where: {
          productId: parsedId,
        },
        select: {
          key: true,
          licenseKey: {
            select: {
              code: true,
              lastUsedAt: true,
            },
          },
        },
      });
      const licenseKeys = secretKey?.licenseKey;

      if (licenseKeys && licenseKeys.length > 0) {
        const showInactiveOption = product.status !== ProductStatus.INACTIVE;

        // if there are license keys that are not yet expired or were used within the last year
        for (const licenseKey of licenseKeys) {
          if (licenseKey.lastUsedAt) {
            const oneYearAfterLastUsed = new Date(licenseKey.lastUsedAt * 1000);
            oneYearAfterLastUsed.setFullYear(oneYearAfterLastUsed.getFullYear() + 1);
            const oneYearAfterLastUsedEpoch = Math.floor(oneYearAfterLastUsed.getTime() / 1000);

            if (getUnixTimestamp() <= oneYearAfterLastUsedEpoch) {
              throw new NotAllowedError(`Product cannot be deleted because there are still license keys for this product that were used within the last year${showInactiveOption ? '. You can mark it as inactive for now.' : ''}`);
            }
          }

          if (!isLicenseKeyExpired(licenseKey.code, secretKey.key)) {
            throw new NotAllowedError(`Product cannot be deleted because there are still license keys for this product that have not yet expired${showInactiveOption ? '. You can mark it as inactive for now.' : ''}`);
          }
        }
      }
    }

    const result = await prisma.product.delete({
      where: {
        id: parsedId,
        // if is not owner, then only allow delete product that assigned to this admin
        ...(!hasAccess(session.userRole, UserRole.OWNER) ? { adminId: session.userId } : {}),
      },
      select: { id: true },
    });

    // revalidate Router cache, Data cache and Full Route cache
    revalidatePath('/secret-key/new');

    return result;
  } catch (err) {
    if (err instanceof NotFoundError || err instanceof NotAllowedError) {
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
        currencies: variant.prices.map(item => ({ ...item, price: item.price.toString() })),
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
    if (product.upgradeCoupon) {
      pricing = {
        ...pricing,
        upgradeCoupon: product.upgradeCoupon,
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
      upgradeCoupon: product.upgradeCoupon ?? { code: '', discount: '', expiredAt: '' },
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
    const isNotOwnerAdmin = !hasAccess(session?.user?.role, UserRole.OWNER);
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
        upgradeCoupon: {
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

  try {
    const parsedProductId = productIdSchema.parse(productId);

    const deleteWhere = { id };
    const updateWhere = { id: parsedProductId };

    // if admin role not owner, then force add where adminId
    if (!hasAccess(session.userRole, UserRole.OWNER)) {
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
      throw new NotFoundError(`Failed to delete the ${entityLabel} because it was not found. Please reload the page and try again.`);
    }

    console.error(err);
    throw new UnknownError();
  }
}

export async function deleteProductVariant(id, productId) {
  const parsedId = productVariantIdSchema.parse(id);
  
  return deleteProductChild({
    entityName: 'productVariant',
    entityLabel: 'variant',
    id: parsedId,
    productId,
  });
}

export async function deleteProductImage(id, productId) {
  const parsedId = productImageIdSchema.parse(id);
  
  return deleteProductChild({
    entityName: 'productImage',
    entityLabel: 'image',
    id: parsedId,
    productId,
  });
}

export async function deleteProductDiscount(id, productId) {
  const parsedId = productDiscountIdSchema.parse(id);
  
  return deleteProductChild({
    entityName: 'productDiscount',
    entityLabel: 'discount',
    id: parsedId,
    productId,
  });
}

export async function deleteProductUpgradeCoupon(id, productId) {
  const parsedId = productUpgradeCouponIdSchema.parse(id);
  
  return deleteProductChild({
    entityName: 'productUpgradeCoupon',
    entityLabel: 'upgrade coupon',
    id: parsedId,
    productId,
  });
}

function getProductOperationWithPriceFlag({ parsedData, isVersionChanged }) {
  const currentTime = getUnixTimestamp();
  const slug = parsedData.name.toLowerCase().replace(/\s/g, '-');

  let hasPriceType = false;
  // generate product table update data
  let updateData = {
    categoryId: parsedData.categoryId,
    adminId: parsedData.adminId,
    ownerId: parsedData.ownerId,
    licenseId: parsedData.licenseId,
    name: parsedData.name,
    slug,
    downloadUrl: parsedData.downloadUrl || null,
    driveFileId: parsedData.driveFileId || null,
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
          downloadUrl: variant.downloadUrl || null,
          fileAccessPassword: variant.downloadUrl ? variant.fileAccessPassword : null,
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

  if (isVersionChanged) {
    updateData.versions = {
      create: {
        version: parsedData.version,
        releasedAt: currentTime,
        translations: {
          create: [
            { language: Language.ID, changelog: parsedData.changelog.id },
            { language: Language.EN, changelog: parsedData.changelog.en },
          ],
        },
      },
    };
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

  // Only checking one field (out of 2 for discount: value and expired at) is enough,
  // since Zod validation already guarantees just 2 possible states: all empty or all filled
  if (discount.value) {
    if (discount?.id) {
      return [
        prisma.productDiscount.update({
          where: { id: discount.id, productId },
          data: {
            discount: discount.value,
            expiredAt: discount.expiredAt,
          },
          select: { id: true },
        }),
      ];
    }

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

function getUpgradeCouponOperation({ upgradeCoupon, hasPriceType, productId, isVersionChanged}) {
  if (!hasPriceType) return [];

  if (upgradeCoupon?.id) {
    // Only checking one field (out of 3 for upgrade coupon: code, discount and expired at) is enough,
    // since Zod validation already guarantees just 2 possible states: all empty or all filled
    if (!isVersionChanged && upgradeCoupon.code) {
      return [
        prisma.productUpgradeCoupon.update({
          where: { id: upgradeCoupon.id, productId },
          data: {
            code: upgradeCoupon.code,
            discount: upgradeCoupon.discount,
            expiredAt: upgradeCoupon.expiredAt,
          },
          select: { id: true },
        }),
      ];
    } 

    if (isVersionChanged) {
      return [
        prisma.productUpgradeCoupon.delete({
          where: { id: upgradeCoupon.id, productId },
          select: { id: true },
        }),
      ];
    }
  }

  if (upgradeCoupon?.code) {
    return [
      prisma.productUpgradeCoupon.create({
        data: {
          productId,
          code: upgradeCoupon.code,
          discount: upgradeCoupon.discount,
          expiredAt: upgradeCoupon.expiredAt,
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
  upgradeCoupon,
}) {
  const session = await verifySession();

  try {
    const applicationCategory = await prisma.category.findUnique({
      where: { slug: APPLICATION_CATEGORY_SLUG },
      select: { id: true, },
    });
    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        categoryId: true,
        adminId: true,
        versions: {
          orderBy: [
            { releasedAt: 'desc' },
            { id: 'desc' },
          ],
          take: 1,
          select: {
            version: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundError('Failed to update the product because it was not found.');
    }

    const isOwner = hasAccess(session.userRole, UserRole.OWNER);

    // if admin tried to update product that was not his right
    if (!isOwner && product.adminId !== session.userId) {
      throw new NotAllowedError('Product cannot be updated because it is not assigned to you.');
    }

    let schema = withDownloadUrlRefine({
      schema: editProductSchema,
      applicationCategoryId: applicationCategory.id,
    });
    schema = withVersionRefine({ schema, applicationCategoryId: applicationCategory.id });
    schema = withChangelogSuperRefine({
      schema,
      version,
      dbVersion: product.versions[0].version,
    });

    const parsedData = schema.parse({
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
      upgradeCoupon,
    });

    validateProductAuthorizationRules({ parsedData, userRole: session.userRole });

    // non owner admin cannot edit adminId
    if (!isOwner && parsedData.adminId !== undefined) {
      throw new NotAllowedError('Only admin with the owner role can change the product admin.');
    }
    
    const isCurrentCategoryApplication = product.categoryId === applicationCategory.id;
    const isNewCategoryApplication = parsedData.categoryId === applicationCategory.id;

    // product with category = application, can't be changed to another category, and vice versa
    if (!isCurrentCategoryApplication && isNewCategoryApplication) {
      throw new NotAllowedError('Product with a category other than application cannot be changed to application.');
    } else if (isCurrentCategoryApplication && !isNewCategoryApplication) {
      throw new NotAllowedError('Product with category application cannot be changed to another category.');
    }

    const isVersionChanged = product.versions[0].version !== parsedData.version;

    const { operation, hasPriceType } = getProductOperationWithPriceFlag({
      parsedData,
      isVersionChanged,
    });
    let transactionItems = [
      operation,
      ...getDiscountOperation({ discount: parsedData.discount, hasPriceType, productId: parsedData.id }),
      ...getUpgradeCouponOperation({
        upgradeCoupon: parsedData.upgradeCoupon,
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
        upgradeCoupon: parsedData.upgradeCoupon?.code ? results[2] ?? results[1] : null,
      },
      'updateProduct',
    );

    // revalidate Router cache, Data cache and Full Route cache
    revalidatePath('/secret-key/new');
    revalidatePath('/secret-key');

    return productFormData;
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2002') {
      throw new DuplicateError(`Product cannot be updated because version ${version} already exists for this product.`);
    }

    if (err instanceof NotAllowedError || err instanceof NotFoundError) {
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
      throw new UnavailableError('Failed to get file information because it is in the trash. Please restore it from the trash in Google Drive first.');
    }

    return res.data;
  } catch (err) {
    if (err.code === 404) {
      throw new NotFoundError('Failed to get file information because it was not found. Please check the Google Drive file ID.');
    }

    if (err instanceof UnavailableError) {
      throw err;
    }

    console.error(err);
    throw new UnknownError();   
  }
}
