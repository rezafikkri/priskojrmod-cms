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
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      email: faker.internet.email().toLowerCase(),
      created_at: currentTime,
      updated_at: currentTime,
    };

    if (i % 2 === 0) {
      createData.is_banned = true;
    }
    if (i % 3 === 0) {
      createData.phone_number = faker.phone.number({ style: 'international' });
    }
    if (i % 4 === 0) {
      createData.picture = 'https://images.pexels.com/photos/29881401/pexels-photo-29881401.jpeg';
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

  for (const customer of customers) {
    const currentTime = Math.floor((Date.now() / 1000) - (60 * 60 * 24 * i));

    const secret = await prisma.secretKey.findFirst({
      select: { id: true, key: true },
    });
    // if secret is not found, then skip
    if (!secret) continue;

    const licenseKeyId = uuidv7();
    const payload = generateLicenseKeyPayload(email, licenseKeyId);
    const code = generateLicenseKeyCode(payload, secret.key);

    licenseKeys.push({
      id: licenseKeyId,
      email: customer.email,
      code,
      customer_id: customer.id,
      secret_key_id: secret.id,
      created_at: currentTime,
      updated_at: currentTime,
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
      product_id: product.id,
      product_price_id: product.variants[0].prices[0].id,
      quantity: generateRandomInt(2, 5),

      product_name: product.name,
      product_version: product.versions[0].version,
      product_drive_file_id: product.drive_file_id,
      product_download_url: product.download_url,

      product_variant: product.variants[0].name,
      product_currency_code: product.variants[0].prices[0].currency_code,
      product_price: product.variants[0].prices[0].price.toNumber(),
    };

    if (product.discount) {
      detail.product_discount = product.discount.discount;
    }

    if (product.coupon) {
      detail.product_coupon_code = product.coupon.code;
      detail.product_coupon_discount = product.coupon.discount;
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
    where: { price_type: 'paid' },
    orderBy: { updated_at: 'desc' },
    include: {
      versions: {
        orderBy: [
          { released_at: 'desc' },
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
    where: { is_banned: false },
  });
  const admins = await prisma.admin.findMany();

  if (products.length < 1 || customers.length < 0) return;

  const transactions = [];
  for (let i = 0; i < count; i++) {
    const transactionDetails = getTransactionDetails({ max: 2, products });

    const selectedCustomer = customers[generateRandomInt(5, customers.length - 1)];
    const selectedAdmin = admins[generateRandomInt(1, admins.length - 1)];
    const currentTime = Math.floor((Date.now() / 1000) - (60 * 60 * 24 * i));

    transactions.push({
      admin_id: selectedAdmin.id,
      admin_email: selectedAdmin.email,
      customer_id: selectedCustomer.id,
      status: 'pending',
      code: generateDocumentCode('TRX'),
      currency_code: transactionDetails[0].product_currency_code,
      total_amount: transactionDetails
        .reduce((total, detail) => {
          const {
            quantity: qty,
            product_price: price,
            product_discount: discount = 0,
            product_coupon_discount: couponDiscount = 0,
            product_currency_code: currencyCode,
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
      customer_name: selectedCustomer.first_name,
      customer_email: selectedCustomer.email,
      customer_phone_number: selectedCustomer.phone_number,
      created_at: currentTime,
      updated_at: currentTime,
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
