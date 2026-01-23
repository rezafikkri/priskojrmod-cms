import 'server-only';

import prisma from '../prisma';
import verifySession from '../verifySession';
import UnknownError from '../errors/UnknownError';
import { categoryIdSchema, categorySchema } from '../validators/category-validator';
import DuplicateError from '../errors/DuplicateError';
import NotFoundError from '../errors/NotFoundError';
import NotAllowedError from '../errors/NotAllowedError';
import { revalidatePath } from 'next/cache';

export async function getCategories() {
  try {
    return await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  } catch (err) {
    console.error(err);
    throw new UnknownError();   
  }
}

export async function getSelectableCategories() {
  try {
    return await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: { name: 'asc' },
    });
  } catch (err) {
    console.error(err);
    throw new UnknownError();   
  }
}

export async function createCategory({ name }) {
  await verifySession();

  try {
    const parsedData = categorySchema.parse({ name });
    const currentTime = Math.floor(new Date().getTime() / 1000);
    const slug = parsedData.name.toLowerCase().replace(/\s/g, '-');
    const result = await prisma.category.create({
      data: {
        name: parsedData.name,
        slug,
        createdAt: currentTime,
        updatedAt: currentTime,
      },
      select: { id: true },
    });

    // revalidate Router cache, Data cache and Full Route cache
    revalidatePath('/category');
    revalidatePath('/product/new');

    return result;
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2002') {
      throw new DuplicateError('Category name already exists');
    }

    console.error(err);
    throw new UnknownError();   
  }
}

export async function deleteCategory(id) {
  await verifySession();

  try {
    const parsedId = categoryIdSchema.parse(id);

    const appCategory = await prisma.category.findUnique({
      where: { id: parsedId, slug: 'application' },
      select: { id: true },
    });
    if (appCategory) {
      throw new NotAllowedError();
    }

    const result = await prisma.category.delete({
      where: { id: parsedId },
      select: { id: true },
    });

    // revalidate Router cache, Data cache and Full Route cache
    revalidatePath('/category');
    revalidatePath('/product/new');

    return result;
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError') {
      if (err.code === 'P2025') {
        throw new NotFoundError('Category not found. Please reload the page and try again.');
      }

      if (err.code === 'P2003') {
        throw new NotAllowedError('Category cannot be deleted because there are still products within this category');
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
    return await prisma.category.findUnique({
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
  await verifySession();

  try {
    const parsedData = categorySchema.parse({
      id,
      name,
    });
    const slug = parsedData.name.toLowerCase().replace(/\s/g, '-');
    const updatedAt = Math.floor(new Date().getTime() / 1000);
    const result = await prisma.category.update({
      where: { id: parsedData.id },
      data: {
        name: parsedData.name,
        slug,
        updatedAt: updatedAt,
      },
      select: { id: true },
    });

    // revalidate Router cache, Data cache and Full Route cache
    revalidatePath('/category');
    revalidatePath('/product/new');

    return result;
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('Category not found');
    }   

    console.error(err);
    throw new UnknownError();
  }
}
