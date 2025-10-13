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
import { ShareMethod, TransactionStatus, InvoiceStatus, CurrencyCode } from '@/constants/enums';
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

function assertNormalTransactionAllowed({
  dbStatus,
  targetStatus,
  isCustomerBanned,
}) {
  if (isCustomerBanned) {
    throw new NotAllowedError(`The customer owning this transaction is banned, so the transaction status cannot be changed to ${targetStatus}.`);
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

  throw new NotAllowedError('Status change not allowed for this transaction in normal flow.');
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
      params: {
        sendNotificationEmail: true,
      },
      data: {
        role,
        type: 'user',
        emailAddress: email,
        emailMessage: 'Thank you for your purchase! Here is your access to the file.',
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
    return await pjmeDBPrismaClient.$transaction(async (tx) => {
      const existingActiveInvoice = await tx.Invoice.findFirst({
        where: { transaction_id: transactionId, status: 'active' },
        select: { id: true, invoice_number: true },
      });

      let invoiceId;
      let invoiceNumber;
      if (!existingActiveInvoice) {
        invoiceNumber = generateDocumentCode('INV');
        const invoiceResult = await tx.Invoice.create({
          data: {
            transaction_id: transactionId,
            invoice_number: invoiceNumber,
            status: InvoiceStatus.ACTIVE,
            issued_at: currentTime,
          },
          select: { id: true },
        });
        invoiceId = invoiceResult.id;
      } else {
        invoiceId = existingActiveInvoice.id;
        invoiceNumber = existingActiveInvoice.invoice_number;
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
}) {
  const currentTime = BigInt(Math.floor(new Date().getTime() / 1000));

  const newLicenseKeys = [];
  const licenseKeysToUnrevoke = [];
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
        licenseKeysToUnrevoke.push(detailLicenseKey[0].id);
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
  if (licenseKeysToUnrevoke.length > 0) {
    await updateLicenseKeysRevokeStatus({
      ids: licenseKeysToUnrevoke,
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

      if (newLicenseKeys.length > 0) {
        await deleteLicenseKeys({ ids: newLicenseKeys.map(nlk => nlk.id) });
      }

      for (const sharedFile of sharedFiles) {
        await deleteDriveFilePermission(sharedFile.fileId, sharedFile.permissionId);
      }
    },
  });

  const result = {
    invoices: [{ invoice_number: processResult.invoiceNumber }],
    updated_at: currentTime.toString(),
    message: `Status successfully changed to ${targetStatus}.`,
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
  const currentTime = BigInt(Math.floor(new Date().getTime() / 1000));

  const licenseKeysToRevoke = [];
  const transactionDetailUpdates = [];
  let isManualUnshareRequired = false;

  for (const detail of transaction.details) {
    if (detail.share_method === ShareMethod.DRIVE_SHARE) {
      // remove permission
      if (detail.drive_permission_id) {
        const isPermissionDeleted = await deleteDriveFilePermission(
          detail.product_drive_file_id,
          detail.drive_permission_id,
        );
        transactionDetailUpdates.push({
          id: detail.id,
          drive_permission_id: null,
        });

        if (!isPermissionDeleted) {
          isManualUnshareRequired = true;
        }
      }
    } else if (detail.share_method === ShareMethod.DOWNLOAD_LINK) {
      const detailSecretKey = secretKeyMap.get(detail.product_id);
      const detailLicenseKey = detailSecretKey.license_key;

      // revoke license key
      if (detailLicenseKey.length > 0 && !detailLicenseKey[0].is_revoked) {
        licenseKeysToRevoke.push(detailLicenseKey[0].id);
      }
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

  await pjmeDBPrismaClient.$transaction(async (tx) => {
    const existingActiveInvoice = await tx.Invoice.findFirst({
      where: { transaction_id: transaction.id, status: 'active' },
      select: { id: true },
    });

    if (existingActiveInvoice) {
      await tx.Invoice.update({
        where: {
          id: existingActiveInvoice.id,
        },
        data: {
          status: InvoiceStatus.VOID,
          voided_at: currentTime,
        },
        select: { id: true },
      });
    }

    await tx.Transaction.update({
      where: { id: transaction.id },
      data: {
        status: TransactionStatus.REFUND,
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
  });

  const result = {
    updated_at: currentTime.toString(),
    message: `Status successfully changed to ${targetStatus}.`,
  };

  if (isManualUnshareRequired) {
    result.message += ' Some products require manual unsharing or permission checks (see details).';
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
            drive_permission_id: true,
            share_method: true,
          },
        },
      },
    });
    
    // validate status that want to change
    assertNormalTransactionAllowed({
      dbStatus: transaction.status,
      targetStatus: parsedStatus,
      isCustomerBanned: transaction.customer.is_banned,
    });
    
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
    const currentTime = BigInt(Math.floor(new Date().getTime() / 1000));
    await pjmeDBPrismaClient.Transaction.update({
      where: { id: parsedId },
      data: {
        status: parsedStatus,
        updated_at: currentTime,
      },
    });

    return {
      updated_at: currentTime.toString(),
      message: `Status successfully changed to ${parsedStatus}.`,
    };
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

Halo ${transaction.customer_name},

Terima kasih atas pembelian Anda.

Berikut detail penyerahan untuk produk yang telah Anda beli:`;

  for (const [index, detail] of transaction.details.entries()) {
    message += `\n${index + 1}. ${detail.product_name}: `;

    if (detail.share_method === ShareMethod.DOWNLOAD_LINK) {
      message += 'Lisensi aplikasi Anda sudah aktif. Buka halaman My Products di akun Anda untuk melihat license-key. Pastikan perangkat terkoneksi internet saat pertama kali menjalankan aplikasi.\n';
    } else if (detail.share_method === ShareMethod.DRIVE_SHARE) {
      message += `Kami telah memberikan akses file ke Google Drive Anda (${transaction.customer_email}). Silakan cek folder "Shared with me".\n`;
    } else if (detail.share_method === ShareMethod.MANUAL_REQUIRED) {
      message += 'File dan semua yang terkait produk ini akan dikirim secara manual. Silakan cek email/WhatsApp Anda untuk petunjuk lebih lanjut.\n';
    }
  }

  const aboutUsUrl = new URL('/about-us', process.env.NEXT_PUBLIC_BRAND_URL);
  message += `\n\nJika Anda mengalami kendala, balas pesan ini atau hubungi kami melalui kontak yang tersedia di ${aboutUsUrl}.\n\nSalam,\nTim ${process.env.NEXT_PUBLIC_BRAND_NAME}`;

  return message;
}

function composeConfirmationMessageEN(transaction) {
  let message = `Subject: [${transaction.code}] Your Digital Product

Body:

Hi ${transaction.customer_name},

Thank you for your purchase.

Here are the delivery details for your purchased products:`;

  for (const [index, detail] of transaction.details.entries()) {
    message += `\n${index + 1}. ${detail.product_name}: `;

    if (detail.share_method === ShareMethod.DOWNLOAD_LINK) {
      message += 'Your application license has been activated. Please visit the My Products page in your account to view your license key. Make sure your device is connected to the internet the first time you run the application.\n';
    } else if (detail.share_method === ShareMethod.DRIVE_SHARE) {
      message += `We've shared the files with your Google Drive account (${transaction.customer_email}). Please check the "Shared with me" folder.\n`;
    } else if (detail.share_method === ShareMethod.MANUAL_REQUIRED) {
      message += `The files and all related materials for this product will be delivered manually. Please check your email or WhatsApp for further instructions.\n`;
    }
  }

  const aboutUsUrl = new URL('/about-us', process.env.NEXT_PUBLIC_BRAND_URL);
  message += `\n\nIf you experience any issues, please reply to this message or contact us through ${aboutUsUrl}.\n\nBest regards,\n${process.env.NEXT_PUBLIC_BRAND_NAME} Team`;

  return message;
}

export async function generateConfirmationMessage(id) {
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    const parsedId = transactionIdSchema.parse(id);
    const transaction = await pjmeDBPrismaClient.Transaction.findUnique({
      where: { id: parsedId },
      select: {
        code: true,
        currency_code: true,
        customer_name: true,
        customer_email: true,
        details: {
          select: {
            product_name: true,
            share_method: true,
          },
        },
      },
    });

    const isIndonesianMessage = transaction.currency_code === CurrencyCode.IDR;
    if (isIndonesianMessage) {
      return composeConfirmationMessageID(transaction);
    }

    return composeConfirmationMessageEN(transaction);
  } catch (err) {
    console.error(err);
    throw new UnknownError();   
  }
}
