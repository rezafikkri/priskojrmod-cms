import 'server-only';

import pjmeDBPrismaClient from '../pjme-prisma-client';
import UnknownError from '../errors/UnknownError';
import verifySession from '../verifySession';
import UnauthenticatedError from '../errors/UnauthenticatedError';
import {
  filtersSchema,
  transactionIdSchema,
  transactionStatusSchema,
} from '../validators/transaction-validator';
import { searchKeySchema } from '../validators/base-validator';
import { getSubtotal } from '../utils';
import { ShareMethod, TransactionStatus, InvoiceStatus } from '@/constants/enums';
import NotAllowedError from '../errors/NotAllowedError';
import pjmaDBPrismaClient from '../pjma-prisma-client';
import { v7 as uuidv7 } from 'uuid';
import {
  createLicenseKeys,
  deleteLicenseKeys,
  generateLicenseKeyCode,
  updateLicenseKeysRevokeStatus,
} from './license-key-service';
import { getDriveFileInfo } from './product-service';
import { generateDocumentCode } from '../generate-document-code.mjs';
import { Prisma as EcommercePrisma } from '@/prisma-pjme-db/pjme-db-client';
import { getGoogleDriveClient } from '../google-client';

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
      transaction.invoices = transaction.invoices.map(invoice => ({
        ...invoice,
        issued_at: invoice.issued_at && invoice.issued_at.toString(),
        voided_at: invoice.voided_at && invoice.voided_at.toString(),
      }));
      transaction.details = transaction.details.map(detail => ({
        ...detail,
        shared_at: detail.shared_at && detail.shared_at.toString(),
        product_price: detail.product_price.toNumber(),
        subtotal: getSubtotal({
          price: detail.product_price,
          qty: detail.quantity,
          discount: detail.product_discount ?? 0,
          couponDiscount: detail.product_coupon_discount ?? 0,
        }),
      }));
    }
    
    return transaction;
  } catch (err) {
    console.error(err);
    throw new UnknownError();   
  }
}

function checkUpdateStatus(dbStatus, status) {
  if (
    (
      (status === TransactionStatus.PAID || status === TransactionStatus.CANCELLED) &&
      dbStatus === TransactionStatus.PENDING
    ) ||
    (
      status === TransactionStatus.REFUND &&
      dbStatus === TransactionStatus.PAID
    )
  ) {
    return true;
  }

  return false;
}

function isApplicationCategory(productCategoryId, appCategoryId) {
  if (productCategoryId === appCategoryId) return true;
  return false;
}

async function checkDriveFile({
  fileId,
  detailProduct,
  sharedFiles,
}) {
  try {
    await getDriveFileInfo(fileId);
    return true;
  } catch (err) {
    if (err.name === 'UnavailableError' || err.name === 'NotFoundError') {
      // rollback shared files by remove permission
      if (sharedFiles.length > 0) {
        for (const sharedFile of sharedFiles) {
          await deleteDriveFilePermission(sharedFile.fileId, sharedFile.permissionId);
        }
      }

      throw new NotAllowedError(`Product ${detailProduct.name} has no accessible file. Google Drive file is missing or in trash.`);
    }

    console.error(err);
    return false;
  }
}

async function addDriveFilePermission(fileId, email, role = 'reader') {
  const driveClient = getGoogleDriveClient();

  try {
    const res = await driveClient.request({
      method: 'POST',
      url: `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
      data: {
        role,
        type: 'user',
        emailAddress: email,
        emailMessage: 'Thank you for your purchase! Here is your access to the file.',
      }
    }); 
    return res.data.id;
  } catch (err) {
    console.error(err);
    return false;
  } 
}

async function deleteDriveFilePermission(fileId, permissionId) {
  const driveClient = getGoogleDriveClient();

  try {
    await driveClient.request({
      method: 'DELETE',
      url: `https://www.googleapis.com/drive/v3/files/${fileId}/permissions/${permissionId}`
    }); 
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

async function processTransactionPaidUpdate({
  transactionId,
  transactionDetailUpdates,
  currentTime,
  rollback,
}) {
  try {
    return await pjmeDBPrismaClient.$transaction(async (tx) => {
      const existingActiveInvoice = await tx.Invoice.findFirst({
        where: { transaction_id: transactionId, status: 'active' },
        select: { id: true },
      });

      let invoiceId;
      if (!existingActiveInvoice) {
        const invoiceResult = await tx.Invoice.create({
          data: {
            transaction_id: transactionId,
            invoice_number: generateDocumentCode('INV'),
            status: InvoiceStatus.ACTIVE,
            issued_at: currentTime,
          },
          select: { id: true },
        });
        invoiceId = invoiceResult.id;
      } else {
        invoiceId = existingActiveInvoice.id;
      }

      await tx.Transaction.update({
        where: { id: transactionId },
        data: {
          status: TransactionStatus.PAID,
          updated_at: currentTime,
          details: {
            update: transactionDetailUpdates.map(({ id, ...rest }) => ({
              data: { ...rest },
              where: { id },
            })),
          },
        }, 
        select: { id: true },
      });

      return { invoiceId };
    });
  } catch (err) {
    if (rollback) {
      try { await rollback() } catch (rErr) {}
    }

    console.error(err);
    throw new UnknownError();
  }
}

async function changeTransactionToPaid({
  transaction,
  productMap,
  secretKeyMap,
  appCategory,
  targetStatus,
}) {
  const currentTime = BigInt(Math.floor(new Date().getTime() / 1000));

  const newLicenseKeys = [];
  const unrevokedLicenseKeys = [];
  const transactionDetailUpdates = [];
  const sharedFiles = [];
  let isManualShareRequired = false;

  for (const detail of transaction.details) {
    const detailProduct = productMap.get(detail.product_id);

    if (isApplicationCategory(detailProduct.category_id, appCategory.id)) {
      if (!secretKeyMap.has(detailProduct.id)) {
        // rollback shared files by remove permission
        if (sharedFiles.length > 0) {
          for (const sharedFile of sharedFiles) {
            await deleteDriveFilePermission(sharedFile.fileId, sharedFile.permissionId);
          }
        }

        throw new NotAllowedError(`Product ${detailProduct.name} has no secret key. License key cannot be created.`);
      }

      const detailSecretKey = secretKeyMap.get(detailProduct.id);
      const detailLicenseKey = detailSecretKey.license_key;

      // if license key doesn't exist
      if (detailLicenseKey.length <= 0) {
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        const exp = Math.floor(expiresAt.getTime() / 1000);
        const licenseKeyId = uuidv7();

        newLicenseKeys.push({
          id: licenseKeyId,
          code: generateLicenseKeyCode({
            payload: {
              licenseKeyId,
              name: transaction.customer_name,
              email: transaction.customer_email,
              exp,
            },
            secretKey: detailSecretKey.key,
          }),
          secret_key_id: detailSecretKey.id,
          customer_id: transaction.customer_id,
          email: transaction.customer_email,
          created_at: currentTime,
          updated_at: currentTime,
        });
      } else if (detailLicenseKey[0].is_revoked) {
        // if license key revoked, then unrevoke it
        unrevokedLicenseKeys.push(detailLicenseKey[0].id);
      }

      // add data to transactionDetailUpdates
      transactionDetailUpdates.push({
        id: detail.id,
        share_method: ShareMethod.DOWNLOAD_LINK,
        shared_at: currentTime,
      });
    } else if (detail.product_drive_file_id) {
      const isDriveFileAccessible = await checkDriveFile({
        fileId: detail.product_drive_file_id,
        detailProduct,
        sharedFiles,
      });

      if (isDriveFileAccessible) {
        // share file to customer email
        const permissionId = await addDriveFilePermission(
          detail.product_drive_file_id,
          transaction.customer_email,
        );

        if (permissionId) {
          sharedFiles.push({
            fileId: detail.product_drive_file_id,
            permissionId,
          });
          // add data to transactionDetailUpdates
          transactionDetailUpdates.push({
            id: detail.id,
            share_method: ShareMethod.DRIVE_SHARE,
            shared_at: currentTime,
            drive_permission_id: permissionId,
          });
        } else {
          // manual required
          isManualShareRequired = true;
          transactionDetailUpdates.push({
            id: detail.id,
            share_method: ShareMethod.MANUAL_REQUIRED,
          });
        }
      } else {
        // manual required
        isManualShareRequired = true;
        transactionDetailUpdates.push({
          id: detail.id,
          share_method: ShareMethod.MANUAL_REQUIRED,
        });
      }
    } else {
      // manual required
      isManualShareRequired = true;
      transactionDetailUpdates.push({
        id: detail.id,
        share_method: ShareMethod.MANUAL_REQUIRED,
      });
    }
  }

  // create license-keys
  if (newLicenseKeys.length > 0) {
    await createLicenseKeys({
      codes: newLicenseKeys,
      rollback: async () => {
        for (const sharedFile of sharedFiles) {
          await deleteDriveFilePermission(sharedFile.fileId, sharedFile.permissionId);
        }
      },
    });
  }
  // unrevoke licenseKeys
  if (unrevokedLicenseKeys.length > 0) {
    await updateLicenseKeysRevokeStatus({
      ids: unrevokedLicenseKeys,
      isRevoked: false,
      rollback: async () => {
        if (newLicenseKeys.length > 0) {
          await deleteLicenseKeys({ ids: newLicenseKeys.map(nlk => nlk.id) });
        }

        for (const sharedFile of sharedFiles) {
          await deleteDriveFilePermission(sharedFile.fileId, sharedFile.permissionId);
        }
      },
    });
  }
  // create invoices and update transaction status and transaction details
  await processTransactionPaidUpdate({
    transactionId: transaction.id,
    transactionDetailUpdates,
    currentTime,
    rollback: async () => {
      if (unrevokedLicenseKeys.length > 0) {
        await updateLicenseKeysRevokeStatus({
          ids: unrevokedLicenseKeys,
          isRevoked: true,
          silent: true,
        });
      }

      if (newLicenseKeys.length > 0) {
        await deleteLicenseKeys({ ids: newLicenseKeys.map(nlk => nlk.id) });
      }

      for (const sharedFile of sharedFiles) {
        await deleteDriveFilePermission(sharedFile.fileId, sharedFile.permissionId);
      }
    },
  });

  const result = {
    updated_at: currentTime.toString(),
    message: `Status successfully changed to ${targetStatus}.`,
  };

  if (isManualShareRequired) {
    result.message = `${result.message} Some products require manual sharing (see details).`;
  }

  return result;
}

export async function updateTransactionStatus({
  id,
  status,
}) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedId = transactionIdSchema.parse(id);
    const parsedStatus = transactionStatusSchema.parse(status);
    const transaction = await pjmeDBPrismaClient.Transaction.findUnique({
      where: { id: parsedId },
      select: {
        id: true,
        customer_id: true,
        status: true,
        customer_name: true,
        customer_email: true,
        updated_at: true,
        customer: {
          select: {
            is_banned: true,
          },
        },
        details: {
          select: {
            id: true,
            product_id: true,
            product_drive_file_id: true,
            share_method: true,
          },
        },
      },
    });
    
    // validate status that want to change
    if (!checkUpdateStatus(transaction.status, parsedStatus)) {
      throw new NotAllowedError();
    } else if (transaction.customer.is_banned) {
      throw new NotAllowedError(`The customer owning this transaction is banned, so the transaction status cannot be changed to ${parsedStatus}.`);
    }

    const productIds = transaction.details.map(detail => detail.product_id);
    const products = await pjmeDBPrismaClient.Product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        category_id: true,
        name: true,
      },
    });
    const productMap = new Map(products.map(product => [product.id, product]));
    const appCategory = await pjmeDBPrismaClient.Category.findUnique({
      where: { slug: 'application' },
      select: { id: true },
    });
    const applicationProductIds = products
      .filter(product => isApplicationCategory(product.category_id, appCategory.id))
      .map(product => product.id);

    let secretKeyMap;
    if (applicationProductIds.length > 0) {
      const secretKeys = await pjmaDBPrismaClient.SecretKeyLicense.findMany({
        where: { product_id: { in: applicationProductIds } },
        select: {
          id: true,
          product_id: true,
          key: true,
          license_key: {
            where: { customer_id: transaction.customer_id },
            select: {
              id: true,
              is_revoked: true,
            },
          },
        },
      });
      secretKeyMap = new Map(secretKeys.map(secretKey => [secretKey.product_id, secretKey]));
    }

    if (parsedStatus === TransactionStatus.PAID) {
      return await changeTransactionToPaid({
        transaction,
        secretKeyMap,
        productMap,
        appCategory,
        targetStatus: parsedStatus,
      });
    }

    if (parsedStatus === TransactionStatus.REFUND) {

    }
  } catch (err) {
    if (err.name === 'NotAllowedError') {
      throw err;
    }

    console.error(err);
    throw new UnknownError();   
  }
}
