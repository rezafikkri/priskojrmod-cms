import jwt from 'jsonwebtoken';
import { faker } from '@faker-js/faker';
import { v7 as uuidv7 } from 'uuid';
import { generateDocumentCode } from '../lib/generate-document-code';
import 'dotenv/config';

/** @typedef {import('./generated/client').PrismaClient} PrismaClient */

export const generateRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function generateLicenseKeyPayload(email, licenseKeyId) {
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  return {
    licenseKeyId,
    name: faker.person.fullName(),
    email,
    exp: Math.floor(expiresAt.getTime() / 1000),
  };
}

function generateLicenseKeyCode(payload, secret) {
  return jwt.sign(payload, secret);
}

/** @param {PrismaClient} prisma */
export async function seedCustomers(prisma, count) {
  // seed customers
  const customers = [];
  for (let i = 0; i < count; i++) {
    const currentTime = Math.floor((Date.now() / 1000) - (60 * 60 * 24 * i));

    const createData = {
      id: uuidv7(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email().toLowerCase(),
      createdAt: currentTime,
      updatedAt: currentTime,
    };

    if (i % 2 === 0) {
      createData.isBanned = true;
    }
    if (i % 3 === 0) {
      createData.phoneNumber = faker.phone.number({ style: 'international' });
    }

    customers.push(createData);
  }

  await prisma.customer.createMany({
    data: customers,
  });

  console.log(`✅ Seeded ${customers.length} customers`);
  return customers;
}

/** @param {PrismaClient} prisma */
export async function seedLicenseKeys(prisma, customers) {
  const licenseKeys = [];
  const secretKeys = await prisma.secretKey.findMany({
    select: { id: true, key: true },
  });
  // if secret is not found, then return
  if (secretKeys.length < 1) {
    console.log('Secret key not found when seeding license keys');
    return;
  }

  for (const [i, customer] of customers.entries()) {
    const currentTime = Math.floor((Date.now() / 1000) - (60 * 60 * 24 * i));

    const licenseKeyId = uuidv7();
    const payload = generateLicenseKeyPayload(customer.email, licenseKeyId);
    const selectedSecretKey = secretKeys[generateRandomInt(0, secretKeys.length - 1)];
    const code = generateLicenseKeyCode(payload, selectedSecretKey.key);

    licenseKeys.push({
      id: licenseKeyId,
      code,
      customerId: customer.id,
      secretKeyId: selectedSecretKey.id,
      createdAt: currentTime,
      updatedAt: currentTime,
    });
  }

  await prisma.licenseKey.createMany({
    data: licenseKeys,
  });

  console.log(`✅ Seeded ${licenseKeys.length} license keys`);
}

function roundToTwoDecimals(value) {
  return Math.round(value * 100) / 100;
}

function getSubtotal({ qty, price, currencyCode, discount, couponDiscount }) {
  let subtotal = price * qty;

  if (discount) {
    let discountPrice = subtotal * (discount / 100);
    if (currencyCode === 'IDR') discountPrice = Math.round(discountPrice);
    if (currencyCode === 'USD') discountPrice = roundToTwoDecimals(discountPrice);

    subtotal -= discountPrice;
  }

  if (couponDiscount) {
    let couponPrice = subtotal * (couponDiscount / 100);
    if (currencyCode === 'IDR') couponPrice = Math.round(couponPrice);
    if (currencyCode === 'USD') couponPrice = roundToTwoDecimals(couponPrice);

    subtotal -= couponPrice;
  }

  if (currencyCode === 'USD') {
    subtotal = roundToTwoDecimals(subtotal);
  }

  return subtotal;
}

function getTransactionDetails({
  max,
  products,
}) {
  const transactionDetails = [];
  for (const product of products) {
    const detail = {
      productId: product.id,
      productPriceId: product.variants[0].prices[0].id,
      quantity: generateRandomInt(2, 5),

      productCategorySlug: product.category.slug,
      productName: product.name,
      productVersion: product.versions[0].version,
      productDriveFileId: product.driveFileId,
      productDownloadUrl: product.downloadUrl,

      productVariant: product.variants[0].name,
      productCurrencyCode: product.variants[0].prices[0].currencyCode,
      productPrice: product.variants[0].prices[0].price.toNumber(),
    };

    if (product.discount) {
      detail.productDiscount = product.discount.discount;
    }

    if (product.coupon) {
      detail.productCouponCode = product.coupon.code;
      detail.productCouponDiscount = product.coupon.discount;
    }

    transactionDetails.push(detail);
    if (transactionDetails.length === max) break;
  }
  return transactionDetails;
}

/** @param {PrismaClient} prisma */
export async function seedTransactions(prisma, count) {
  // seed transaction
  const products = await prisma.product.findMany({
    where: { priceType: 'paid' },
    orderBy: { updatedAt: 'desc' },
    include: {
      category: {
        select: { slug: true },
      },
      versions: {
        orderBy: [
          { releasedAt: 'desc' },
          { id: 'desc' },
        ],
        take: 1,
        select: { version: true },
      },
      variants: {
        include: {
          prices: true,
        },
      },
      discount: true,
      coupon: true,
    },
  });
  const customers = await prisma.customer.findMany({
    where: { isBanned: false },
  });
  const admins = await prisma.admin.findMany();

  if (products.length < 1 || customers.length < 0) return;

  const transactions = [];
  for (let i = 0; i < count; i++) {
    const transactionDetails = getTransactionDetails({ max: 1, products });

    const selectedCustomer = customers[generateRandomInt(0, customers.length - 1)];
    const selectedAdmin = admins[generateRandomInt(0, admins.length - 1)];
    const currentTime = Math.floor((Date.now() / 1000) - (60 * 60 * 24 * i));

    transactions.push({
      adminId: selectedAdmin.id,
      adminEmail: selectedAdmin.email,
      customerId: selectedCustomer.id,
      status: 'pending',
      code: generateDocumentCode('TRX'),
      currencyCode: transactionDetails[0].productCurrencyCode,
      totalAmount: transactionDetails
        .reduce((total, detail) => {
          const {
            quantity: qty,
            productPrice: price,
            productDiscount: discount = 0,
            productCouponDiscount: couponDiscount = 0,
            productCurrencyCode: currencyCode,
          } = detail;
          const subtotal = getSubtotal({
            qty,
            price,
            currencyCode,
            discount,
            couponDiscount,
          });
          return total + subtotal;
        }, 0),
      customerName: selectedCustomer.firstName + ' ' + selectedCustomer.lastName,
      customerEmail: selectedCustomer.email,
      customerPhoneNumber: selectedCustomer.phoneNumber,
      createdAt: currentTime,
      updatedAt: currentTime,
      details: {
        create: transactionDetails,
      },
    });
  }

  for (let transaction of transactions) {
    await prisma.transaction.create({
      data: transaction,
    });
  }

  console.log(`✅ Seeded ${transactions.length} transactions`);
}
