import 'server-only';

import pjmeDBPrismaClient from '../pjme-prisma-client';
import verifySession from '../verifySession';
import UnknownError from '../errors/UnknownError';
import { categoryIdSchema, categorySchema } from '../validators/category-validator';
import DuplicateError from '../errors/DuplicateError';
import NotFoundError from '../errors/NotFoundError';
import NotAllowedError from '../errors/NotAllowedError';
import UnauthenticatedError from '../errors/UnauthenticatedError';

export async function getCategories(
  select = {
    id: true,
    name: true,
    slug: true,
    created_at: true,
    updated_at: true,
  },
) {
  try {
    return await pjmeDBPrismaClient.Category.findMany({
      select,
      orderBy: { updated_at: 'desc' },
    });
  } catch (err) {
    console.error(err);
    throw new UnknownError();   
  }
}

export async function createCategory({ name }) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedData = categorySchema.parse({ name });
    const currentTime = Math.floor(new Date().getTime() / 1000);
    const slug = parsedData.name.toLowerCase().replace(/\s/g, '-');
    return await pjmeDBPrismaClient.Category.create({
      data: {
        name: parsedData.name,
        slug,
        created_at: currentTime,
        updated_at: currentTime,
      },
      select: { id: true },
    });
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2002') {
      throw new DuplicateError('Category name already exists.');
    }

    console.error(err);
    throw new UnknownError();   
  }
}

export async function deleteCategory(id) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedId = categoryIdSchema.parse(id);

    const appCategory = await pjmeDBPrismaClient.Category.findUnique({
      where: { id: parsedId, slug: 'application' },
      select: { id: true },
    });
    if (appCategory) {
      throw new NotAllowedError();
    }

    return await pjmeDBPrismaClient.Category.delete({
      where: { id: parsedId },
      select: { id: true },
    });
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError') {
      if (err.code === 'P2025') {
        throw new NotFoundError('Category not found, please reload the page and try again.');
      }

      if (err.code === 'P2003') {
        throw new NotAllowedError('Category cannot be deleted because there are still products within this category.');
      }
    }

    if (err.name === 'NotAllowedError') {
      throw err;
    }

    console.error(err);
    throw new UnknownError();
  }
}

export async function getCategory(id) {
  const idResult = categoryIdSchema.safeParse(id);
  if(!idResult.success) return null;
  const parsedId = idResult.data;

  try {
    return await pjmeDBPrismaClient.Category.findUnique({
      where: { id: parsedId },
      select: {
        id: true,
        name: true,
      },
    });
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function updateCategory({
  id,
  name,
}) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedData = categorySchema.parse({
      id,
      name,
    });
    const slug = parsedData.name.toLowerCase().replace(/\s/g, '-');
    const updatedAt = Math.floor(new Date().getTime() / 1000);
    return await pjmeDBPrismaClient.Category.update({
      where: { id: parsedData.id },
      data: {
        name: parsedData.name,
        slug,
        updated_at: updatedAt,
      },
      select: { id: true },
    });
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('Category not found.');
    }   

    console.error(err);
    throw new UnknownError();
  }
}
