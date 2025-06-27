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
} from '../validators/product-validator';
import pjmeDBPrismaClient from '../pjme-prisma-client';
import { Language } from '@/constants/enums';
import PinLimitExceededError from '../errors/PinLimitExceededError';

export async function createProduct({
  name,
  category_id,
  license_id,
  owner_id,
  download_link,
  description,
  variants,
  images,
  discount,
  coupon,
  is_published,
  price_type,
}) {
  const session = await verifySession();
  if (!session) throw new Error('Unauthenticated');

  try {
    const parsedData = createProductSchema.parse({
      name,
      category_id,
      license_id,
      owner_id,
      download_link,
      description,
      variants,
      images,
      discount,
      coupon,
      is_published,
      price_type,
    });
    const currentTime = BigInt(Math.floor(new Date().getTime() / 1000));
    const slug = parsedData.name.toLowerCase().replace(/\s/g, '-');
    let createData = {
      category_id: parsedData.category_id,
      admin_id: session.userId,
      owner_id: parsedData.owner_id,
      license_id: parsedData.license_id,
      name: parsedData.name,
      slug,
      price_type: parsedData.price_type,
      is_published: parsedData.is_published,
      created_at: currentTime,
      released_at: currentTime,
      updated_at: currentTime,
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
          }
          if (variant.prices) {
            return {
              ...variant,
              prices: {
                create: variant.prices,
              },
            };
          }
          return variant;
        }),
      },
    };

    if (parsedData.download_link) {
      createData.download_link = parsedData.download_link;
    }
    if (parsedData.discount.value) {
      createData.discount = {
        create: {
          discount: parsedData.discount.value,
          expired_at: BigInt(parsedData.discount.expired_at),
        },
      };
    }
    if (parsedData.coupon.code) {
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

export async function getProducts() {
  try {
    const select = {
      id: true,
      name: true,
      price_type: true,
      is_published: true,
      is_pinned: true,
      created_at: true,
      released_at: true,
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
    };
    const pinnedProducts = await pjmeDBPrismaClient.Product.findMany({
      where: { is_pinned: true },
      select,
      orderBy: { updated_at: 'desc' },
    });
    const unpinnedProducts = await pjmeDBPrismaClient.Product.findMany({
      where: { is_pinned: false },
      select,
      orderBy: { updated_at: 'desc' },
    });
    return [...pinnedProducts, ...unpinnedProducts].map(product => ({
      ...product,
      created_at: product.created_at.toString(),
      released_at: product.released_at.toString(),
      updated_at: product.updated_at.toString(),
    }));
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
