import 'server-only';

import { Prisma } from '@/prisma/generated/client';
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
import { BRAND } from '@/constants/brand';
import prisma from '../prisma';

dayjs.extend(utc);

const dayJsLocale = process.env.NEXT_PUBLIC_LOCALE.split('-')[0];

dayjs.locale(dayJsLocale);

export async function getTransactions({ select, pageIndex, pageSize, filters }) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedFilters = filtersSchema.parse(filters);
    const transactions = await prisma.transaction.findMany({
      select,
      take: pageSize,
      skip: pageSize * pageIndex,
      where: parsedFilters,
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

export async function searchTransactions({ key, select, limit, filters }) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedFilters = filtersSchema.parse(filters);
    const parsedKey = searchKeySchema.parse(key);
    const transactions = await prisma.transaction.findMany({
      select,
      where: {
        code: parsedKey,
        ...parsedFilters,
      },
      take: limit + 1,
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
    const parsedFilters = filtersSchema.parse(filters);
    return await prisma.transaction.count({
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
    const transaction = await prisma.transaction.findUnique({
      where: { id: parsedId },
      select: {
        code: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        currencyCode: true,
        totalAmount: true,
        customerName: true,
        customerEmail: true,
        customerPhoneNumber: true,

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
      transaction.totalAmount = transaction.totalAmount.toNumber();
      transaction.details = transaction.details.map(detail => ({
        ...detail,
        productPrice: detail.productPrice.toNumber(),
        subtotal: getSubtotal({
          price: detail.productPrice,
          qty: detail.quantity,
          currencyCode: detail.productCurrencyCode,
          discount: detail.productDiscount ?? 0,
          couponDiscount: detail.productCouponDiscount ?? 0,
        }),
      }));
    }
    
    return transaction;
  } catch (err) {
    console.error(err);
    throw new UnknownError();   
  }
}

function assertNormalTransactionAllowed({
  dbStatus,
  targetStatus,
  isCustomerBanned,
}) {
  if (isCustomerBanned) {
    throw new NotAllowedError(`The customer owning this transaction is banned, so the transaction status cannot be changed to ${targetStatus}`);
  }

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

  throw new NotAllowedError('Status change not allowed for this transaction in normal flow');
}

function assertCorrectTransactionAllowed({
  dbStatus,
  targetStatus,
  isCustomerBanned,
}) {
  if (isCustomerBanned) {
    throw new NotAllowedError(`The customer owning this transaction is banned, so the transaction status cannot be changed to ${targetStatus}`);
  }

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

  throw new NotAllowedError('Status correction not allowed for this transaction in correction flow');
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

      throw new NotAllowedError(`Product ${detailProduct.name} has no accessible file. Google Drive file is missing or in trash`);
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
}) {
  try {
    return await prisma.$transaction(async (tx) => {
      const existingActiveInvoice = await tx.Invoice.findFirst({
        where: { transactionId: transactionId, status: 'active' },
        select: { id: true, invoiceNumber: true },
      });

      let invoiceId;
      let invoiceNumber;
      if (!existingActiveInvoice) {
        invoiceNumber = generateDocumentCode('INV');
        const invoiceResult = await tx.Invoice.create({
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

      await tx.Transaction.update({
        where: { id: transactionId },
        data: {
          status: TransactionStatus.PAID,
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

async function changeTransactionToPaid({
  transaction,
  productMap,
  secretKeyMap,
  appCategory,
  targetStatus,
  flowType = 'normal',
}) {
  const currentTime = Math.floor(new Date().getTime() / 1000);

  const newLicenseKeys = [];
  const licenseKeysToUpdate = [];
  const transactionDetailUpdates = [];
  const sharedFiles = [];
  let isManualShareRequired = false;

  for (const detail of transaction.details) {
    const detailProduct = productMap.get(detail.productId);

    if (isApplicationCategory(detailProduct.categoryId, appCategory.id)) {
      if (!secretKeyMap.has(detailProduct.id)) {
        // rollback shared files by remove permission
        if (sharedFiles.length > 0) {
          for (const sharedFile of sharedFiles) {
            await deleteDriveFilePermission(sharedFile.fileId, sharedFile.permissionId);
          }
        }

        throw new NotAllowedError(`Product ${detailProduct.name} has no secret key. License key cannot be created`);
      }

      const detailSecretKey = secretKeyMap.get(detailProduct.id);
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
      const isDriveFileAccessible = await checkDriveFile({
        fileId: detail.productDriveFileId,
        detailProduct,
        sharedFiles,
      });

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
          isManualShareRequired = true;
          transactionDetailUpdates.push({
            id: detail.id,
            shareMethod: ShareMethod.MANUAL_REQUIRED,
          });
        }
      } else {
        // manual required
        isManualShareRequired = true;
        transactionDetailUpdates.push({
          id: detail.id,
          shareMethod: ShareMethod.MANUAL_REQUIRED,
        });
      }
    } else {
      // manual required
      isManualShareRequired = true;
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
  });

  const isCorrectFlow = flowType === 'correct';
  const result = {
    invoices: [{ invoiceNumber: processResult.invoiceNumber }],
    updatedAt: currentTime,
    message: `Status successfully ${isCorrectFlow ? 'corrected' : 'changed'} to ${targetStatus}.`,
  };

  if (isManualShareRequired) {
    result.message += ' Some products require manual sharing (see details).';
  }

  return result;
}

async function changeTransactionToRefund({
  transaction,
  secretKeyMap,
  targetStatus,
}) {
  const currentTime = Math.floor(new Date().getTime() / 1000);

  const licenseKeysToRevoke = [];
  const transactionDetailUpdates = [];
  let isManualUnshareRequired = false;

  for (const detail of transaction.details) {
    if (detail.shareMethod === ShareMethod.DRIVE_SHARE) {
      // remove permission
      if (detail.drivePermissionId) {
        const isPermissionDeleted = await deleteDriveFilePermission(
          detail.productDriveFileId,
          detail.drivePermissionId,
        );

        if (!isPermissionDeleted) {
          isManualUnshareRequired = true;
        }
      } else {
        isManualUnshareRequired = true;
      }

      transactionDetailUpdates.push({
        id: detail.id,
        drivePermissionId: null,
        sharedAt: null,
      });
    } else if (detail.shareMethod === ShareMethod.DOWNLOAD_LINK) {
      const detailSecretKey = secretKeyMap.get(detail.productId);
      const detailLicenseKey = detailSecretKey.licenseKey;

      // revoke license key
      if (detailLicenseKey.length > 0 && !detailLicenseKey[0].isRevoked) {
        licenseKeysToRevoke.push(detailLicenseKey[0].id);
      }

      transactionDetailUpdates.push({
        id: detail.id,
        sharedAt: null,
      });
    } else {
      // manual unshare required
      isManualUnshareRequired = true;
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

    await tx.Transaction.update({
      where: { id: transaction.id },
      data: {
        status: TransactionStatus.REFUND,
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
    message: `Status successfully changed to ${targetStatus}.`,
  };

  if (isManualUnshareRequired) {
    result.message += ' Some products may require manual unsharing (see details).';
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
      updatedAt: true,
      customer: {
        select: {
          isBanned: true,
        },
      },
      details: {
        select: {
          id: true,
          productId: true,
          productDriveFileId: true,
          drivePermissionId: true,
          shareMethod: true,
        },
      },
    },
  });

  // validate status that want to change
  assertFn({
    dbStatus: transaction.status,
    targetStatus,
    isCustomerBanned: transaction.customer.isBanned,
  });

  const productIds = transaction.details.map(detail => detail.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      categoryId: true,
      name: true,
    },
  });
  const productMap = new Map(products.map(product => [product.id, product]));
  const appCategory = await prisma.category.findUnique({
    where: { slug: 'application' },
    select: { id: true },
  });
  const applicationProductIds = products
  .filter(product => isApplicationCategory(product.categoryId, appCategory.id))
  .map(product => product.id);

  let secretKeyMap;
  if (applicationProductIds.length > 0) {
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

  return {
    transaction,
    secretKeyMap,
    productMap,
    appCategory,
  };
}

async function correctTransactionToPaid({
  transaction,
  secretKeyMap,
  targetStatus,
}) {
  const currentTime = Math.floor(new Date().getTime() / 1000);

  const licenseKeysToUnrevoke = [];
  const transactionDetailUpdates = [];
  const sharedFiles = [];
  let isManualShareRequired = false;

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
        isManualShareRequired = true;
      }
    } else if (detail.shareMethod === ShareMethod.DOWNLOAD_LINK) {
      const detailSecretKey = secretKeyMap.get(detail.productId);
      const detailLicenseKey = detailSecretKey.licenseKey;

      // unrevoke license key
      if (detailLicenseKey.length > 0 && detailLicenseKey[0].isRevoked) {
        licenseKeysToUnrevoke.push(detailLicenseKey[0].id);
      }

      // add data to transactionDetailUpdates
      transactionDetailUpdates.push({
        id: detail.id,
        sharedAt: currentTime,
      });
    } else {
      // manual required
      isManualShareRequired = true;
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
  // create invoices and update transaction status and transaction details
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
  });

  const result = {
    invoices: [{ invoiceNumber: processResult.invoiceNumber }],
    updatedAt: currentTime,
    message: `Status successfully corrected to ${targetStatus}.`,
  };

  if (isManualShareRequired) {
    result.message += ' Some products require manual sharing (see details).';
  }

  return result;
}

async function correctTransactionToCancelled({
  transaction,
  secretKeyMap,
  targetStatus,
}) {
  const currentTime = Math.floor(new Date().getTime() / 1000);

  const licenseKeysToRevoke = [];
  const transactionDetailUpdates = [];
  let isManualUnshareRequired = false;

  for (const detail of transaction.details) {
    if (detail.shareMethod === ShareMethod.DRIVE_SHARE) {
      // remove permission
      if (detail.drivePermissionId) {
        const isPermissionDeleted = await deleteDriveFilePermission(
          detail.productDriveFileId,
          detail.drivePermissionId,
        );

        if (!isPermissionDeleted) {
          isManualUnshareRequired = true;
        }
      } else {
        isManualUnshareRequired = true;
      }

      transactionDetailUpdates.push({
        id: detail.id,
        drivePermissionId: null,
        sharedAt: null,
      });
    } else if (detail.shareMethod === ShareMethod.DOWNLOAD_LINK) {
      const detailSecretKey = secretKeyMap.get(detail.productId);
      const detailLicenseKey = detailSecretKey.licenseKey;

      // revoke license key
      if (detailLicenseKey.length > 0 && !detailLicenseKey[0].isRevoked) {
        licenseKeysToRevoke.push(detailLicenseKey[0].id);
      }

      transactionDetailUpdates.push({
        id: detail.id,
        sharedAt: null,
      });
    } else {
      // manual unshare required
      isManualUnshareRequired = true;
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

    await tx.Transaction.update({
      where: { id: transaction.id },
      data: {
        status: TransactionStatus.CANCELLED,
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
    message: `Status successfully corrected to ${targetStatus}.`,
  };

  if (isManualUnshareRequired) {
    result.message += ' Some products may require manual unsharing (see details).';
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

    const {
      transaction,
      secretKeyMap,
      productMap,
      appCategory,
    } = await prepareTransactionContext({
      id: parsedId,
      targetStatus: parsedStatus,
      assertFn: assertNormalTransactionAllowed,
    });

    // change to paid
    if (parsedStatus === TransactionStatus.PAID) {
      return await changeTransactionToPaid({
        transaction,
        secretKeyMap,
        productMap,
        appCategory,
        targetStatus: parsedStatus,
      });
    }

    // change to refund
    if (parsedStatus === TransactionStatus.REFUND) {
      return await changeTransactionToRefund({
        transaction,
        secretKeyMap,
        targetStatus: parsedStatus,
      });
    }

    // change to cancelled
    const currentTime = Math.floor(new Date().getTime() / 1000);
    await prisma.transaction.update({
      where: { id: parsedId },
      data: {
        status: parsedStatus,
        updatedAt: currentTime,
      },
    });

    return {
      updatedAt: currentTime,
      message: `Status successfully changed to ${parsedStatus}`,
    };
  } catch (err) {
    if (err.name === 'NotAllowedError') {
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
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedId = transactionIdSchema.parse(id);
    const parsedStatus = transactionStatusSchema.parse(status);

    const {
      transaction,
      secretKeyMap,
      productMap,
      appCategory,
    } = await prepareTransactionContext({
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
          productMap,
          appCategory,
          targetStatus: parsedStatus,
          flowType: 'correct',
        });
      } else {
        return await correctTransactionToPaid({
          transaction,
          secretKeyMap,
          targetStatus: parsedStatus,
        });
      }
    }

    // correct to cancelled
    if (parsedStatus === TransactionStatus.CANCELLED) {
      return await correctTransactionToCancelled({
        transaction,
        secretKeyMap,
        targetStatus: parsedStatus,
      });
    }
  } catch (err) {
    if (err.name === 'NotAllowedError') {
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

  const aboutUsUrl = new URL('/about-us', BRAND.url);
  message += `\n\nJika Anda mengalami kendala, balas pesan ini atau hubungi kami melalui kontak yang tersedia di ${aboutUsUrl}.\n\nSalam,\nTim ${BRAND.name}`;

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

  const aboutUsUrl = new URL('/about-us', BRAND.url);
  message += `\n\nIf you experience any issues, please reply to this message or contact us through ${aboutUsUrl}.\n\nBest regards,\n${BRAND.name} Team`;

  return message;
}

export async function generateConfirmationMessage(id) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

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

export async function generateTransactionExport({ transactionStatus, currencyCode }) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const transactions = await prisma.$queryRaw(Prisma.sql`
      SELECT t.code, t.customer_name, t.customer_email, t.customer_phone_number, t.status, t.created_at, t.updated_at, t.total_amount,
             td.product_name, td.product_version, td.product_variant, td.quantity, td.product_price, td.product_currency_code, td.product_discount, td.product_coupon_code, td.product_coupon_discount
      FROM transactions AS t
      JOIN transaction_details AS td
        ON t.id = td.transaction_id
      WHERE td.product_currency_code = ${currencyCode}::currency_code ${
        transactionStatus !== 'all'
          ? Prisma.sql`AND t.status = ${transactionStatus}::transaction_status`
          : Prisma.sql`AND t.status != ${TransactionStatus.PENDING}::transaction_status`
      }
      ORDER BY t.created_at DESC
    `);

    const encoder = new TextEncoder();

    return new ReadableStream({
      async start(controller) {
        // add BOM (Byte Order Mark) for excel windows, to tell excel that this is UTF-8
        controller.enqueue('\ufeff');

        // notes
        const notes = [
          '# Notes:',
          '"# - Subtotal represents the net price per product item, calculated as (Qty × Unit Price) - Coupon - Discount."',
          '# - Total Amount represents the total value of the entire transaction (sum of all subtotals in the same transaction code)',
          '#   and may appear repeated across multiple rows. Total Amount values exclude taxes.',
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
            { key: 'customerPhoneNumber', header: 'Customer Phone' },
            { key: 'status', header: 'Status' },

            // TransactionDetails
            { key: 'productName', header: 'Product Name' },
            { key: 'productVersion', header: 'Product Version' },
            { key: 'productVariant', header: 'Product Variant' },
            { key: 'quantity', header: 'Qty' },
            { key: 'productPrice', header: 'Unit Price' },
            { key: 'productCurrencyCode', header: 'Currency' },
            { key: 'productDiscount', header: 'Discount %' },
            { key: 'productCouponCode', header: 'Coupon Code' },
            { key: 'productCouponDiscount', header: 'Coupon %' },

            // Subtotal per item
            { key: 'subtotal', header: 'Subtotal' },

            // Total per transaction
            { key: 'totalAmount', header: 'Total Amount' },

            // Timestamp
            { key: 'createdAt', header: 'Created At (UTC)' },
            { key: 'updatedAt', header: 'Updated At (UTC)' },
          ],
        });

        for (const row of transactions) {
          const productPrice = row.product_price.toNumber();

          stringifier.write({
            ...row,
            customerName: row.customer_name,
            customerEmail: row.customer_email,
            customerPhoneNumber: row.customer_phone_number,
            productName: row.product_name,
            productVersion: row.product_version,
            productVariant: row.product_variant,
            productPrice: row.product_price,
            productCurrencyCode: row.product_currency_code,
            productDiscount: row.product_discount,
            productCouponCode: row.product_coupon_code,
            productCouponDiscount: row.product_coupon_discount,
            status: row.status.toUpperCase(),
            subtotal: getSubtotal({
              qty: row.quantity,
              price: productPrice,
              currencyCode: row.product_currency_code,
              discount: row.product_discount,
              couponDiscount: row.product_coupon_discount,
            }),
            totalAmount: row.total_amount.toNumber(),
            productPrice: productPrice,
            createdAt: dayjs.unix(row.created_at).utc().format('YYYY-MM-DD HH:mm:ss'),
            updatedAt: dayjs.unix(row.updated_at).utc().format('YYYY-MM-DD HH:mm:ss'),
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
