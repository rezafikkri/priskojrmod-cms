import 'server-only';

import { Prisma } from '@/prisma/generated/client';
import UnknownError from '../errors/UnknownError';
import verifySession from '../verifySession';
import {
  filtersSchema,
  refundNoteSchema,
  transactionIdSchema,
  transactionStatusSchema,
} from '../validators/transaction-validator';
import { currencyCodeSchema, searchKeySchema } from '../validators/base-validator';
import { getSubtotalBreakdown, getUnixTimestamp, toTitleCase } from '../utils';
import { ShareMethod, TransactionStatus, InvoiceStatus, CurrencyCode } from '@/constants/enums';
import NotAllowedError from '../errors/NotAllowedError';
import { v7 as uuidv7 } from 'uuid';
import {
  createLicenseKeys,
  deleteLicenseKeys,
  generateLicenseKeyCode,
  updateLicenseKeys,
  updateLicenseKeysRevokeStatus,
} from './license-key-service';
import { getDriveFileInfo } from './product-service';
import { generateDocumentCode } from '../generate-document-code';
import { getGoogleDriveClient } from '../google-client';
import { stringify } from 'csv-stringify';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import 'dayjs/locale/id';
import 'dayjs/locale/en';
import { BRAND_NAME, BRAND_URL } from '@/constants/brand';
import prisma from '../prisma';
import { APPLICATION_CATEGORY_SLUG } from '@/constants/categories';
import { formatUtcDateTime } from '../format-date';

dayjs.extend(utc);

const dayJsLocale = process.env.NEXT_PUBLIC_LOCALE.split('-')[0];

dayjs.locale(dayJsLocale);

// Select object for get and search transactions for data-table
const DEFAULT_SELECT = {
  id: true,
  code: true,
  status: true,
  totalAmount: true,
  currencyCode: true,
  adminName: true,
  adminEmail: true,
  customerName: true,
  customerEmail: true,
  createdAt: true,
  paidAt: true,
  refundedAt: true,
  updatedAt: true,
  customerId: true,
  customer: {
    select: { isBanned: true },
  },
  invoices: {
    select: {
      invoiceNumber: true,
    },
    take: 1,
    orderBy: { issuedAt: 'desc' },
  },
};

function buildFilterWhereClause(filters) {
  let where;
  
  const parsedFilters = filtersSchema.parse(filters);

  if (parsedFilters?.status) where = { status: parsedFilters.status };
  if (parsedFilters?.searchKey) where = { code: parsedFilters.searchKey, ...where };

  return where;
}

export async function getTransactions({ pageIndex, pageSize, filters }) {
  await verifySession();

  try {
    const transactions = await prisma.transaction.findMany({
      select: DEFAULT_SELECT,
      take: pageSize,
      skip: pageSize * pageIndex,
      where: buildFilterWhereClause(filters),
      orderBy: { updatedAt: 'desc' },
    });

    return transactions.map((transaction) => ({
      ...transaction,
      totalAmount: transaction.totalAmount.toNumber(),
    }));  
  } catch (err) {
    console.error(err);
    throw new UnknownError();   
  }
}

export const countTransactions = async (filters) => {
  try {
    return await prisma.transaction.count({
      where: buildFilterWhereClause(filters),
    });
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function getTransactionDetails(id) {
  await verifySession();

  const idResult = transactionIdSchema.safeParse(id);
  if (!idResult.success) return null;
  const parsedId = idResult.data;

  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: parsedId },
      select: {
        code: true,
        status: true,
        createdAt: true,
        paidAt: true,
        refundedAt: true,
        updatedAt: true,
        currencyCode: true,
        totalAmount: true,
        adminEmail: true,
        adminName: true,
        adminWhatsappPhoneNumber: true,
        customerName: true,
        customerEmail: true,
        customerPhoneNumber: true,
        refundNote: true,

        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            issuedAt: true,
            voidedAt: true,
          },
          orderBy: { issuedAt: 'desc' },
        },
        details: {
          select: {
            id: true,
            quantity: true,

            productCategorySlug: true,
            productName: true,
            productVersion: true,
            productDriveFileId: true,
            productDownloadUrl: true,

            productVariant: true,
            variantDownloadUrl: true,
            variantFileAccessPassword: true,

            productCurrencyCode: true,
            productPrice: true,
            productDiscount: true,
            productCouponCode: true,
            productCouponDiscount: true,

            shareMethod: true,
            sharedAt: true,
          },
        },
      },
    });

    if (transaction) {
      const {
        adminEmail,
        adminName,
        adminWhatsappPhoneNumber,
        customerEmail,
        customerName,
        customerPhoneNumber,
        totalAmount,
        details,
        ...rest
      } = transaction;

      return {
        ...rest,
        totalAmount: totalAmount.toNumber(),
        details: details.map(detail => {
          const { subtotal, discountPrice, couponPrice } = getSubtotalBreakdown({
            price: detail.productPrice,
            qty: detail.quantity,
            currencyCode: detail.productCurrencyCode,
            discount: detail.productDiscount,
            couponDiscount: detail.productCouponDiscount,
          });
          const result = {
            ...detail,
            productPrice: detail.productPrice.toNumber(),
            subtotal,
          };

          if (discountPrice) result.discountPrice = discountPrice;
          if (couponPrice) result.couponPrice = couponPrice;

          return result;
        }),
        parties: {
          adminEmail,
          adminName,
          adminWhatsappPhoneNumber,
          customerEmail,
          customerName,
          customerPhoneNumber,
        },
      };
    }
    
    return null;
  } catch (err) {
    console.error(err);
    throw new UnknownError();   
  }
}

function assertNormalTransactionAllowed(transaction, targetStatus) {
  const dbStatus = transaction.status;

  if (
    (
      (targetStatus === TransactionStatus.PAID || targetStatus === TransactionStatus.CANCELLED) &&
      dbStatus === TransactionStatus.PENDING
    ) ||
    (
      targetStatus === TransactionStatus.REFUND &&
      dbStatus === TransactionStatus.PAID
    )
  ) {
    return true;
  }

  throw new NotAllowedError('Transaction status cannot be changed because the selected status is not allowed in the normal flow.');
}

function assertCorrectTransactionAllowed(transaction, targetStatus) {
  const dbStatus = transaction.status;

  if (
    (
      (dbStatus === TransactionStatus.CANCELLED || dbStatus === TransactionStatus.REFUND) &&
      targetStatus === TransactionStatus.PAID
    ) ||
    (
      dbStatus === TransactionStatus.PAID &&
      targetStatus === TransactionStatus.CANCELLED
    )
  ) {
    return true;
  }

  throw new NotAllowedError('Transaction status cannot be corrected because the selected status is not allowed in the correction flow.');
}

function isApplicationCategory(productCategorySlug) {
  if (productCategorySlug === APPLICATION_CATEGORY_SLUG) return true;
  return false;
}

async function checkDriveFile(fileId) {
  try {
    await getDriveFileInfo(fileId);
    return true;
  } catch (err) {
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
      },
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
  shouldUpdatePaidAt = false,
  shouldClearRefundFields = false,
}) {
  try {
    return await prisma.$transaction(async (tx) => {
      const existingActiveInvoice = await tx.invoice.findFirst({
        where: { transactionId: transactionId, status: 'active' },
        select: { id: true, invoiceNumber: true },
      });

      let invoiceId;
      let invoiceNumber;
      if (!existingActiveInvoice) {
        invoiceNumber = generateDocumentCode('INV');
        const invoiceResult = await tx.invoice.create({
          data: {
            transactionId: transactionId,
            invoiceNumber: invoiceNumber,
            status: InvoiceStatus.ACTIVE,
            issuedAt: currentTime,
          },
          select: { id: true },
        });
        invoiceId = invoiceResult.id;
      } else {
        invoiceId = existingActiveInvoice.id;
        invoiceNumber = existingActiveInvoice.invoiceNumber;
      }

      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: TransactionStatus.PAID,
          ...(shouldUpdatePaidAt ? { paidAt: currentTime } : {}),
          ...(shouldClearRefundFields
            ? { refundNote: null, refundedAt: null }
            : {}),
          updatedAt: currentTime,
          details: {
            update: transactionDetailUpdates.map(({ id, ...rest }) => ({
              data: { ...rest },
              where: { id },
            })),
          },
        }, 
        select: { id: true },
      });

      return { invoiceId, invoiceNumber };
    });
  } catch (err) {
    if (rollback) {
      try { await rollback() } catch (rErr) {}
    }

    console.error(err);
    throw new UnknownError();
  }
}

function formatList(items) {
  if (items.length === 1) return items[0];
  if (items.length === 2) return items.join(' and ');
  if (items.length > 2) {
    return items
      .slice(0, items.length - 1)
      .join(', ') + ' and ' + items.at(-1);
  }
}

/**
 * Generate message for products that required manual action
 *
 * @param {'sharing' | 'unsharing'} actionType
 */
function generateManualActionMessage(products, actionType) {
  return `Manual ${actionType} required for product${products.length > 1 ? 's' : ''}: ${formatList(products)} (see details).`;
}

async function changeTransactionToPaid({
  transaction,
  secretKeyMap,
  flowType = 'normal',
}) {
  const statusAction = flowType === 'correct' ? 'corrected' : 'changed';

  // check product deleted, secret key missing and customer account deleted
  const deletedProducts = [];
  const productsMissingSecretKey = [];
  
  for (const detail of transaction.details) {
    if (isApplicationCategory(detail.productCategorySlug)) {
      // if customer account deleted
      if (!transaction.customerId) {
        throw new NotAllowedError(`Transaction status cannot be ${statusAction} to paid because this transaction contains application products that require an active customer account, but the customer account has been deleted.`);
      }

      // if product deleted
      if (!detail.productPriceId) {
        deletedProducts.push(detail.productName);
      }

      // if secret key missing
      if (!secretKeyMap.has(detail.productId)) {
        productsMissingSecretKey.push(detail.productName);
      }
    }
  }

  if (deletedProducts.length > 0) {
    throw new NotAllowedError(`Transaction status cannot be ${statusAction} to paid because this transaction contains deleted application products: ${formatList(deletedProducts)}. Please ask the customer to create a new transaction.`);
  }

  if (productsMissingSecretKey.length > 0) {
    throw new NotAllowedError(`Transaction status cannot be ${statusAction} to paid because this transaction includes application products that do not have a secret key: ${formatList(productsMissingSecretKey)}.`);
  }

  // process transaction
  const currentTime = getUnixTimestamp();

  const newLicenseKeys = [];
  const licenseKeysToUpdate = [];
  const transactionDetailUpdates = [];
  const sharedFiles = [];
  const productsRequiringManualAction = [];

  for (const detail of transaction.details) {
    if (isApplicationCategory(detail.productCategorySlug)) {
      const detailSecretKey = secretKeyMap.get(detail.productId);
      const detailLicenseKey = detailSecretKey.licenseKey;
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      const exp = Math.floor(expiresAt.getTime() / 1000);

      // if license key doesn't exist
      if (detailLicenseKey.length <= 0) {
        const licenseKeyId = uuidv7();

        newLicenseKeys.push({
          id: licenseKeyId,
          code: generateLicenseKeyCode({
            payload: {
              licenseKeyId,
              name: transaction.customerName,
              email: transaction.customerEmail,
              exp,
            },
            secretKey: detailSecretKey.key,
          }),
          secretKeyId: detailSecretKey.id,
          customerId: transaction.customerId,
          createdAt: currentTime,
          updatedAt: currentTime,
        });
      } else {
        // replace expired_at license-key and unrevoke it
        const licenseKey = {
          id: detailLicenseKey[0].id,
          code: generateLicenseKeyCode({
            payload: {
              licenseKeyId: detailLicenseKey[0].id,
              name: transaction.customerName,
              email: transaction.customerEmail,
              exp,
            },
            secretKey: detailSecretKey.key,
          }),
          updatedAt: currentTime,
          oldUpdatedAt: detailLicenseKey[0].updatedAt,
          oldCode: detailLicenseKey[0].code,
        };

        if (detailLicenseKey[0].isRevoked) {
          licenseKey.isRevoked = false;
        }

        licenseKeysToUpdate.push(licenseKey);
      }

      // add data to transactionDetailUpdates
      transactionDetailUpdates.push({
        id: detail.id,
        shareMethod: ShareMethod.DOWNLOAD_LINK,
        sharedAt: currentTime,
      });
    } else if (detail.productDriveFileId) {
      const isDriveFileAccessible = await checkDriveFile(detail.productDriveFileId);

      if (isDriveFileAccessible) {
        // share file to customer email
        const permissionId = await addDriveFilePermission(
          detail.productDriveFileId,
          transaction.customerEmail,
        );

        if (permissionId) {
          sharedFiles.push({
            fileId: detail.productDriveFileId,
            permissionId,
          });
          // add data to transactionDetailUpdates
          transactionDetailUpdates.push({
            id: detail.id,
            shareMethod: ShareMethod.DRIVE_SHARE,
            sharedAt: currentTime,
            drivePermissionId: permissionId,
          });
        } else {
          // manual required
          productsRequiringManualAction.push(detail.productName);
          
          transactionDetailUpdates.push({
            id: detail.id,
            shareMethod: ShareMethod.MANUAL_REQUIRED,
          });
        }
      } else {
        // manual required
        productsRequiringManualAction.push(detail.productName);

        transactionDetailUpdates.push({
          id: detail.id,
          shareMethod: ShareMethod.MANUAL_REQUIRED,
        });
      }
    } else {
      // manual required
      productsRequiringManualAction.push(detail.productName);

      transactionDetailUpdates.push({
        id: detail.id,
        shareMethod: ShareMethod.MANUAL_REQUIRED,
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
  // update licenseKeys
  if (licenseKeysToUpdate.length > 0) {
    await updateLicenseKeys({
      codes: licenseKeysToUpdate.map(({ oldCode, oldUpdatedAt, ...rest }) => ({ ...rest })),
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
  const processResult = await processTransactionPaidUpdate({
    transactionId: transaction.id,
    transactionDetailUpdates,
    currentTime,
    rollback: async () => {
      if (licenseKeysToUpdate.length > 0) {
        await updateLicenseKeys({
          codes: licenseKeysToUpdate.map(({ oldCode, code, oldUpdatedAt, ...rest }) => {
            const licenseKey = {
              ...rest,
              code: oldCode,
              updatedAt: oldUpdatedAt,
            };

            if ('isRevoked' in licenseKey) {
              licenseKey.isRevoked = true;
            }

            return licenseKey;
          }),
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
    shouldUpdatePaidAt: true,
  });

  const result = {
    invoices: [{ invoiceNumber: processResult.invoiceNumber }],
    paidAt: currentTime,
    updatedAt: currentTime,
    message: `Status successfully ${statusAction} to ${TransactionStatus.PAID}.`,
  };

  if (productsRequiringManualAction.length > 0) {
    result.message += ` ${generateManualActionMessage(productsRequiringManualAction, 'sharing')}`;
  }

  return result;
}

async function changeTransactionToRefund({
  transaction,
  secretKeyMap,
  refundNote,
}) {
  const parsedRefundNote = refundNoteSchema.parse(refundNote);

  const currentTime = getUnixTimestamp();

  const licenseKeysToRevoke = [];
  const transactionDetailUpdates = [];
  const productsRequiringManualAction = [];

  for (const detail of transaction.details) {
    if (detail.shareMethod === ShareMethod.DRIVE_SHARE) {
      // remove permission
      if (detail.drivePermissionId) {
        const isPermissionDeleted = await deleteDriveFilePermission(
          detail.productDriveFileId,
          detail.drivePermissionId,
        );

        if (!isPermissionDeleted) {
          productsRequiringManualAction.push(detail.productName);
        }
      } else {
        productsRequiringManualAction.push(detail.productName);
      }

      transactionDetailUpdates.push({
        id: detail.id,
        drivePermissionId: null,
        sharedAt: null,
      });
    } else if (detail.shareMethod === ShareMethod.DOWNLOAD_LINK) {
      const detailSecretKey = secretKeyMap?.get(detail.productId);
      const detailLicenseKey = detailSecretKey?.licenseKey;

      // revoke license key
      if (detailLicenseKey && detailLicenseKey.length > 0 && !detailLicenseKey[0].isRevoked) {
        licenseKeysToRevoke.push(detailLicenseKey[0].id);
      }

      transactionDetailUpdates.push({
        id: detail.id,
        sharedAt: null,
      });
    } else {
      // manual unshare required
      productsRequiringManualAction.push(detail.productName);
    }
  }

  if (licenseKeysToRevoke.length > 0) {
    await updateLicenseKeysRevokeStatus({
      ids: licenseKeysToRevoke,
      isRevoked: true,
    });
  }

  await prisma.$transaction(async (tx) => {
    const existingActiveInvoice = await tx.invoice.findFirst({
      where: { transactionId: transaction.id, status: 'active' },
      select: { id: true },
    });

    if (existingActiveInvoice) {
      await tx.invoice.update({
        where: {
          id: existingActiveInvoice.id,
        },
        data: {
          status: InvoiceStatus.VOID,
          voidedAt: currentTime,
        },
        select: { id: true },
      });
    }

    await tx.transaction.update({
      where: { id: transaction.id },
      data: {
        status: TransactionStatus.REFUND,
        refundNote: parsedRefundNote,
        refundedAt: currentTime,
        updatedAt: currentTime,
        details: {
          update: transactionDetailUpdates.map(({ id, ...rest }) => ({
            data: { ...rest },
            where: { id },
          })),
        },
      }, 
      select: { id: true },
    });
  });

  const result = {
    refundedAt: currentTime,
    updatedAt: currentTime,
    message: `Status successfully changed to ${TransactionStatus.REFUND}. Don't forget to transfer the funds.`,
  };

  if (productsRequiringManualAction.length > 0) {
    result.message += ` ${generateManualActionMessage(productsRequiringManualAction, 'unsharing')}`;
  }

  return result;
}

async function prepareTransactionContext({
  id,
  targetStatus,
  assertFn,
}) {
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    select: {
      id: true,
      customerId: true,
      status: true,
      customerName: true,
      customerEmail: true,
      paidAt: true,
      customer: {
        select: {
          isBanned: true,
        },
      },
      details: {
        select: {
          id: true,
          productId: true,
          productPriceId: true,
          productName: true,
          productCategorySlug: true,
          productDriveFileId: true,
          drivePermissionId: true,
          shareMethod: true,
        },
      },
    },
  });

  // validate status that want to change
  assertFn(transaction, targetStatus);

  const transactionProducts = transaction.details.map(detail => ({
    id: detail.productId,
    name: detail.productName,
    isApplicationCategory: isApplicationCategory(detail.productCategorySlug),
  }));
  const applicationProductIds = transactionProducts
    .filter(product => product.isApplicationCategory)
    .map(product => product.id);

  let secretKeyMap;
  if (transaction.customerId && applicationProductIds.length > 0) {
    const secretKeys = await prisma.secretKey.findMany({
      where: { productId: { in: applicationProductIds } },
      select: {
        id: true,
        productId: true,
        key: true,
        licenseKey: {
          where: { customerId: transaction.customerId },
          select: {
            id: true,
            isRevoked: true,
            code: true,
            updatedAt: true,
          },
        },
      },
    });
    secretKeyMap = new Map(secretKeys.map(secretKey => [secretKey.productId, secretKey]));
  }

  return { transaction, secretKeyMap };
}

async function correctTransactionToPaid({
  transaction,
  secretKeyMap,
}) {
  const currentTime = getUnixTimestamp();

  const licenseKeysToUnrevoke = [];
  const transactionDetailUpdates = [];
  const sharedFiles = [];
  const productsRequiringManualAction = [];

  for (const detail of transaction.details) {
    if (detail.shareMethod === ShareMethod.DRIVE_SHARE) {
      // share file to customer email
      const permissionId = await addDriveFilePermission(
        detail.productDriveFileId,
        transaction.customerEmail,
      );

      if (permissionId) {
        sharedFiles.push({
          fileId: detail.productDriveFileId,
          permissionId,
        });
        // add data to transactionDetailUpdates
        transactionDetailUpdates.push({
          id: detail.id,
          sharedAt: currentTime,
          drivePermissionId: permissionId,
        });
      } else {
        // manual required
        productsRequiringManualAction.push(detail.productName);
      }
    } else if (detail.shareMethod === ShareMethod.DOWNLOAD_LINK) {
      const detailSecretKey = secretKeyMap?.get(detail.productId);
      const detailLicenseKey = detailSecretKey?.licenseKey;

      // unrevoke license key
      if (detailLicenseKey && detailLicenseKey.length > 0 && detailLicenseKey[0].isRevoked) {
        licenseKeysToUnrevoke.push(detailLicenseKey[0].id);
      }

      // add data to transactionDetailUpdates
      transactionDetailUpdates.push({
        id: detail.id,
        sharedAt: currentTime,
      });
    } else {
      // manual required
      productsRequiringManualAction.push(detail.productName);
    }
  }

  // unrevoke licenseKeys
  if (licenseKeysToUnrevoke.length > 0) {
    await updateLicenseKeysRevokeStatus({
      ids: licenseKeysToUnrevoke,
      isRevoked: false,
      rollback: async () => {
        for (const sharedFile of sharedFiles) {
          await deleteDriveFilePermission(sharedFile.fileId, sharedFile.permissionId);
        }
      },
    });
  }
  // create invoices, update transaction status, transaction details and clear refund fields
  // because transaction status back to paid
  const shouldUpdatePaidAt = transaction.status === TransactionStatus.CANCELLED;
  const processResult = await processTransactionPaidUpdate({
    transactionId: transaction.id,
    transactionDetailUpdates,
    currentTime,
    rollback: async () => {
      if (licenseKeysToUnrevoke.length > 0) {
        await updateLicenseKeysRevokeStatus({
          ids: licenseKeysToUnrevoke,
          isRevoked: true,
          silent: true,
        });
      }

      for (const sharedFile of sharedFiles) {
        await deleteDriveFilePermission(sharedFile.fileId, sharedFile.permissionId);
      }
    },
    shouldUpdatePaidAt,
    shouldClearRefundFields: transaction.status === TransactionStatus.REFUND,
  });

  const result = {
    invoices: [{ invoiceNumber: processResult.invoiceNumber }],
    ...(shouldUpdatePaidAt ? { paidAt: currentTime } : {}),
    updatedAt: currentTime,
    message: `Status successfully corrected to ${TransactionStatus.PAID}.`,
  };

  if (productsRequiringManualAction.length > 0) {
    result.message += ` ${generateManualActionMessage(productsRequiringManualAction, 'sharing')}`;
  }

  return result;
}

async function correctTransactionToCancelled({
  transaction,
  secretKeyMap,
}) {
  const currentTime = getUnixTimestamp();

  const licenseKeysToRevoke = [];
  const transactionDetailUpdates = [];
  const productsRequiringManualAction = [];

  for (const detail of transaction.details) {
    if (detail.shareMethod === ShareMethod.DRIVE_SHARE) {
      // remove permission
      if (detail.drivePermissionId) {
        const isPermissionDeleted = await deleteDriveFilePermission(
          detail.productDriveFileId,
          detail.drivePermissionId,
        );

        if (!isPermissionDeleted) {
          productsRequiringManualAction.push(detail.productName);
        }
      } else {
        productsRequiringManualAction.push(detail.productName);
      }

      transactionDetailUpdates.push({
        id: detail.id,
        drivePermissionId: null,
        sharedAt: null,
      });
    } else if (detail.shareMethod === ShareMethod.DOWNLOAD_LINK) {
      const detailSecretKey = secretKeyMap?.get(detail.productId);
      const detailLicenseKey = detailSecretKey?.licenseKey;

      // revoke license key
      if (detailLicenseKey && detailLicenseKey.length > 0 && !detailLicenseKey[0].isRevoked) {
        licenseKeysToRevoke.push(detailLicenseKey[0].id);
      }

      transactionDetailUpdates.push({
        id: detail.id,
        sharedAt: null,
      });
    } else {
      // manual unshare required
      productsRequiringManualAction.push(detail.productName);
    }
  }

  if (licenseKeysToRevoke.length > 0) {
    await updateLicenseKeysRevokeStatus({
      ids: licenseKeysToRevoke,
      isRevoked: true,
    });
  }

  await prisma.$transaction(async (tx) => {
    const existingActiveInvoice = await tx.Invoice.findFirst({
      where: { transactionId: transaction.id, status: 'active' },
      select: { id: true },
    });

    if (existingActiveInvoice) {
      await tx.Invoice.update({
        where: {
          id: existingActiveInvoice.id,
        },
        data: {
          status: InvoiceStatus.VOID,
          voidedAt: currentTime,
        },
        select: { id: true },
      });
    }

    // update transaction status, details and clear paidAt
    await tx.Transaction.update({
      where: { id: transaction.id },
      data: {
        status: TransactionStatus.CANCELLED,
        paidAt: null,
        updatedAt: currentTime,
        details: {
          update: transactionDetailUpdates.map(({ id, ...rest }) => ({
            data: { ...rest },
            where: { id },
          })),
        },
      }, 
      select: { id: true },
    });
  });

  const result = {
    updatedAt: currentTime,
    message: `Status successfully corrected to ${TransactionStatus.CANCELLED}.`,
  };

  if (productsRequiringManualAction.length > 0) {
    result.message += ` ${generateManualActionMessage(productsRequiringManualAction, 'unsharing')}`;
  }

  return result;
}

export async function updateTransactionStatus({
  id,
  status,
  refundNote,
}) {
  await verifySession();

  try {
    const parsedId = transactionIdSchema.parse(id);
    const parsedStatus = transactionStatusSchema.parse(status);

    const { transaction, secretKeyMap } = await prepareTransactionContext({
      id: parsedId,
      targetStatus: parsedStatus,
      assertFn: assertNormalTransactionAllowed,
    });

    // change to paid
    if (parsedStatus === TransactionStatus.PAID) {
      return await changeTransactionToPaid({
        transaction,
        secretKeyMap,
      });
    }

    // change to refund
    if (parsedStatus === TransactionStatus.REFUND) {
      return await changeTransactionToRefund({
        transaction,
        secretKeyMap,
        refundNote,
      });
    }

    // change to cancelled
    const currentTime = getUnixTimestamp();
    await prisma.transaction.update({
      where: { id: parsedId },
      data: {
        status: parsedStatus,
        updatedAt: currentTime,
      },
    });

    return {
      updatedAt: currentTime,
      message: `Status successfully changed to ${parsedStatus}.`,
    };
  } catch (err) {
    if (err instanceof NotAllowedError || err instanceof UnknownError) {
      throw err;
    }

    console.error(err);
    throw new UnknownError();
  }
}

export async function correctTransactionStatus({
  id,
  status,
}) {
  await verifySession();

  try {
    const parsedId = transactionIdSchema.parse(id);
    const parsedStatus = transactionStatusSchema.parse(status);

    const { transaction, secretKeyMap } = await prepareTransactionContext({
      id: parsedId,
      targetStatus: parsedStatus,
      assertFn: assertCorrectTransactionAllowed,
    });

    // correct to paid
    if (parsedStatus === TransactionStatus.PAID) {
      if (!transaction.details[0].shareMethod) {
        return await changeTransactionToPaid({
          transaction,
          secretKeyMap,
          flowType: 'correct',
        });
      } else {
        return await correctTransactionToPaid({
          transaction,
          secretKeyMap,
        });
      }
    }

    // correct to cancelled
    if (parsedStatus === TransactionStatus.CANCELLED) {
      return await correctTransactionToCancelled({
        transaction,
        secretKeyMap,
      });
    }
  } catch (err) {
    if (err instanceof NotAllowedError || err instanceof UnknownError) {
      throw err;
    }

    console.error(err);
    throw new UnknownError();   
  }
}

function composeConfirmationMessageID(transaction) {
  let message = `Subject: [${transaction.code}] Produk Digital Anda

Body:

Halo ${transaction.customerName},

Terima kasih atas pembelian Anda.

Berikut detail penyerahan untuk produk yang telah Anda beli:`;

  for (const [index, detail] of transaction.details.entries()) {
    message += `\n${index + 1}. ${detail.productName}: `;

    if (detail.shareMethod === ShareMethod.DOWNLOAD_LINK) {
      message += 'Lisensi aplikasi Anda sudah aktif. Buka halaman My Products di akun Anda untuk melihat license-key. Pastikan perangkat terkoneksi internet saat pertama kali menjalankan aplikasi.\n';
    } else if (detail.shareMethod === ShareMethod.DRIVE_SHARE) {
      message += `Kami telah memberikan akses file ke Google Drive Anda (${transaction.customerEmail}). Silakan cek folder "Shared with me".\n`;
    } else if (detail.shareMethod === ShareMethod.MANUAL_REQUIRED) {
      message += 'File dan semua yang terkait produk ini akan dikirim secara manual. Silakan cek email/WhatsApp Anda untuk petunjuk lebih lanjut.\n';
    }
  }

  const aboutUsUrl = new URL('/about-us', BRAND_URL);
  message += `\n\nJika Anda mengalami kendala, balas pesan ini atau hubungi kami melalui kontak yang tersedia di ${aboutUsUrl}.\n\nSalam,\nTim ${BRAND_NAME}`;

  return message;
}

function composeConfirmationMessageEN(transaction) {
  let message = `Subject: [${transaction.code}] Your Digital Product

Body:

Hi ${transaction.customerName},

Thank you for your purchase.

Here are the delivery details for your purchased products:`;

  for (const [index, detail] of transaction.details.entries()) {
    message += `\n${index + 1}. ${detail.productName}: `;

    if (detail.shareMethod === ShareMethod.DOWNLOAD_LINK) {
      message += 'Your application license has been activated. Please visit the My Products page in your account to view your license key. Make sure your device is connected to the internet the first time you run the application.\n';
    } else if (detail.shareMethod === ShareMethod.DRIVE_SHARE) {
      message += `We've shared the files with your Google Drive account (${transaction.customerEmail}). Please check the "Shared with me" folder.\n`;
    } else if (detail.shareMethod === ShareMethod.MANUAL_REQUIRED) {
      message += `The files and all related materials for this product will be delivered manually. Please check your email or WhatsApp for further instructions.\n`;
    }
  }

  const aboutUsUrl = new URL('/about-us', BRAND_URL);
  message += `\n\nIf you experience any issues, please reply to this message or contact us through ${aboutUsUrl}.\n\nBest regards,\n${BRAND_NAME} Team`;

  return message;
}

export async function generateConfirmationMessage(id) {
  await verifySession();

  try {
    const parsedId = transactionIdSchema.parse(id);
    const transaction = await prisma.transaction.findUnique({
      where: { id: parsedId },
      select: {
        code: true,
        currencyCode: true,
        customerName: true,
        customerEmail: true,
        details: {
          select: {
            productName: true,
            shareMethod: true,
          },
        },
      },
    });

    const isIndonesianMessage = transaction.currencyCode === CurrencyCode.IDR;
    if (isIndonesianMessage) {
      return composeConfirmationMessageID(transaction);
    }

    return composeConfirmationMessageEN(transaction);
  } catch (err) {
    console.error(err);
    throw new UnknownError();   
  }
}

export async function generateTransactionExport({ transactionStatus, currencyCode, searchKey }) {
  await verifySession();

  try {
    const parsedCurrencyCode = currencyCodeSchema.parse(currencyCode);

    const statusCondition = transactionStatus
      ? Prisma.sql`
          AND t.status = ${transactionStatusSchema.parse(transactionStatus)}::transaction_status
        `
      : Prisma.empty;

    const searchKeyCondition = searchKey
      ? Prisma.sql`AND t.code = ${searchKeySchema.parse(searchKey)}`
      : Prisma.empty;
    
    const query = Prisma.sql`
      SELECT
        t.code,
        t.admin_email,
        t.admin_name,
        t.admin_whatsapp_phone_number,
        t.customer_name,
        t.customer_email,
        t.customer_phone_number,
        t.status,
        t.created_at,
        t.updated_at,
        t.paid_at,
        t.refunded_at,
        t.refund_note,
        td.product_name,
        td.product_version,
        td.product_variant,
        td.quantity,
        td.product_price,
        td.product_currency_code,
        td.product_discount,
        td.product_coupon_code,
        td.product_coupon_discount
      FROM transactions AS t
      JOIN transaction_details AS td
        ON t.id = td.transaction_id
      WHERE td.product_currency_code = ${parsedCurrencyCode}::currency_code
        ${statusCondition}
        ${searchKeyCondition}
      ORDER BY t.created_at DESC
    `;

    const transactions = await prisma.$queryRaw(query);

    const encoder = new TextEncoder();

    return new ReadableStream({
      async start(controller) {
        // add BOM (Byte Order Mark) for excel windows, to tell excel that this is UTF-8
        controller.enqueue('\ufeff');

        // notes
        const notes = [
          '# Notes:',
          '"# - Subtotal represents the net price per product item, calculated as (Qty × Unit Price) - Discount - Upgrade Coupon"',
          '"# - Tax is not calculated or included in these figures"',
        ].join('\n') + '\n\n';

        controller.enqueue(encoder.encode(notes));

        // data
        const stringifier = stringify({
          header: true,
          columns: [
            // Transaction
            { key: 'code', header: 'Transaction Code' },
            { key: 'customerName', header: 'Customer Name' },
            { key: 'customerEmail', header: 'Customer Email' },
            { key: 'customerPhoneNumber', header: 'Customer Phone Number' },
            { key: 'adminName', header: 'Admin Name' },
            { key: 'adminEmail', header: 'Admin Email' },
            { key: 'adminWhatsappPhoneNumber', header: 'Admin WhatsApp Phone Number' },
            { key: 'status', header: 'Status' },

            // TransactionDetails
            { key: 'productName', header: 'Product Name' },
            { key: 'productVersion', header: 'Product Version' },
            { key: 'productVariant', header: 'Product Variant' },
            { key: 'productCurrencyCode', header: 'Currency' },
            { key: 'productPrice', header: 'Unit Price' },
            { key: 'quantity', header: 'Qty' },

            { key: 'productDiscount', header: 'Discount %' },
            { key: 'discountAmount', header: 'Discount Amount' },
            
            { key: 'productCouponCode', header: 'Coupon Code' },
            { key: 'productCouponDiscount', header: 'Coupon %' },
            { key: 'upgradeCouponAmount', header: 'Upgrade Coupon Amount' },

            // Subtotal per item
            { key: 'subtotal', header: 'Subtotal' },

            // Timestamp
            { key: 'createdAt', header: 'Created At (UTC)' },
            { key: 'updatedAt', header: 'Updated At (UTC)' },
            { key: 'paidAt', header: 'Paid At (UTC)' },
            { key: 'refundedAt', header: 'Refunded At (UTC)' },

            // refund
            { key: 'refundNote', header: 'Refund Note' },
          ],
        });

        for (const row of transactions) {
          const productPrice = row.product_price.toNumber();
          const { subtotal, discountPrice = '', couponPrice = '' } = getSubtotalBreakdown({
            qty: row.quantity,
            price: productPrice,
            currencyCode: row.product_currency_code,
            discount: row.product_discount,
            couponDiscount: row.product_coupon_discount,
          });

          stringifier.write({
            ...row,
            customerName: row.customer_name,
            customerEmail: row.customer_email,
            customerPhoneNumber: row.customer_phone_number ?? '',
            adminName: row.admin_name,
            adminEmail: row.admin_email,
            adminWhatsappPhoneNumber: row.admin_whatsapp_phone_number,
            productName: row.product_name,
            productVersion: row.product_version,
            productVariant: row.product_variant,
            productCurrencyCode: row.product_currency_code,
            productPrice,
            productDiscount: row.product_discount ?? '',
            discountAmount: discountPrice ? `-${discountPrice}` : '',
            productCouponCode: row.product_coupon_code ?? '',
            productCouponDiscount: row.product_coupon_discount ?? '',
            upgradeCouponAmount: couponPrice ? `-${couponPrice}` : '',
            status: toTitleCase(row.status),
            subtotal,
            createdAt: formatUtcDateTime(row.created_at),
            updatedAt: formatUtcDateTime(row.updated_at),
            paidAt: row.paid_at ? formatUtcDateTime(row.paid_at) : '',
            refundedAt: row.refunded_at ? formatUtcDateTime(row.refunded_at) : '',
            refundNote: row.refund_note ?? '',
          });
        }
        stringifier.end();

        for await (const chunk of stringifier) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      },
    });
  } catch (err) {
    console.error(err);
    throw new UnknownError();   
  }
}
