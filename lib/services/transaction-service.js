import 'server-only';

import pjmeDBPrismaClient from '../pjme-prisma-client';
import UnknownError from '../errors/UnknownError';
import verifySession from '../verifySession';
import UnauthenticatedError from '../errors/UnauthenticatedError';
import { filtersSchema } from '../validators/transaction-validator';
import { searchKeySchema } from '../validators/base-validator';
import { transactionIdSchema } from '../validators/transction-validator';
import { getSubtotal } from '../utils';

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
      total_amount: transaction.total_amount.toNumber(),
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
      total_amount: transaction.total_amount.toNumber(),
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

export async function getTransactionDetails(id) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  const idResult = transactionIdSchema.safeParse(id);
  if (!idResult.success) return null;
  const parsedId = idResult.data;

  try {
    const transaction = await pjmeDBPrismaClient.Transaction.findUnique({
      where: { id: parsedId },
      select: {
        code: true,
        status: true,
        created_at: true,
        updated_at: true,
        currency_code: true,
        total_amount: true,
        customer_name: true,
        customer_email: true,
        customer_phone_number: true,

        invoices: {
          select: {
            id: true,
            invoice_number: true,
            status: true,
            issued_at: true,
            voided_at: true,
          },
        },
        details: {
          select: {
            id: true,
            quantity: true,

            product_name: true,
            product_version: true,
            product_drive_file_id: true,
            product_download_link: true,

            product_variant: true,
            variant_download_link: true,
            variant_file_access_password: true,

            product_currency_code: true,
            product_price: true,
            product_discount: true,
            product_coupon_code: true,
            product_coupon_discount: true,

            share_method: true,
            shared_at: true,
          },
        },
      },
    });

    if (transaction) {
      transaction.total_amount = transaction.total_amount.toNumber();
      transaction.created_at = transaction.created_at.toString();
      transaction.updated_at = transaction.updated_at.toString();
      transaction.details = transaction.details.map(detail => ({
        ...detail,
        product_price: detail.product_price.toNumber(),
        subtotal: getSubtotal({
          price: detail.product_price,
          qty: detail.quantity,
          discount: detail.product_discount,
          couponDiscount: detail.product_coupon_discount,
        }),
      }));
    }
    
    return transaction;
  } catch (err) {
    console.error(err);
    throw new UnknownError();   
  }
}
