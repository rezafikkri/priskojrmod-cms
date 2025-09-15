import 'server-only';

import pjmeDBPrismaClient from '../pjme-prisma-client';
import UnknownError from '../errors/UnknownError';
import verifySession from '../verifySession';
import UnauthenticatedError from '../errors/UnauthenticatedError';
import { filtersSchema } from '../validators/transaction-validator';
import { searchKeySchema } from '../validators/base-validator';

export async function getTransactions({ select, pageIndex, pageSize, filters }) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedFilters = filtersSchema.parse(filters);
    const transactions = await pjmeDBPrismaClient.Transaction.findMany({
      select,
      take: pageSize,
      skip: pageSize * pageIndex,
      where: parsedFilters,
      orderBy: { updated_at: 'desc' },
    });

    return transactions.map((transaction) => ({
      ...transaction,
      created_at: transaction.created_at?.toString(),
      updated_at: transaction.updated_at?.toString(),
    }));  
  } catch (err) {
    console.error(err);
    throw new UnknownError();   
  }
}

export async function searchTransactions({ key, select, limit, filters }) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedFilters = filtersSchema.parse(filters);
    const parsedKey = searchKeySchema.parse(key);
    const transactions = await pjmeDBPrismaClient.Transaction.findMany({
      select,
      where: {
        code: parsedKey,
        ...parsedFilters,
      },
      take: limit + 1,
    });
    return transactions.map((transaction) => ({
      ...transaction,
      created_at: transaction.created_at?.toString(),
      updated_at: transaction.updated_at?.toString(),
    }));
  } catch (err) {
    console.error(err);
    throw new UnknownError();   
  }
}

export const countTransactions = async (filters) => {
  try {
    const parsedFilters = filtersSchema.parse(filters);
    return await pjmeDBPrismaClient.Transaction.count({
      where: parsedFilters,
    });
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}
