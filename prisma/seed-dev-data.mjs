import jwt from 'jsonwebtoken';
import { faker } from '@faker-js/faker';
import { PrismaClient as PjmaDBPrismaClient } from '../prisma-pjma-db/pjma-db-client/index.js';
import { PrismaClient as PjmeDBPrismaClient } from '../prisma-pjme-db/pjme-db-client/index.js';
import { v7 as uuidv7 } from 'uuid';
import { generateDocumentCode } from '../lib/generate-document-code.mjs';
import 'dotenv/config';

const pjmaDBPrismaClient = new PjmaDBPrismaClient();
const pjmeDBPrismaClient = new PjmeDBPrismaClient();

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

async function seedCustomersAndLicenseKeys() {
  // seed customers
  const customers = [];
  const customerIds = [];
  for (let i = 0; i < 0; i++) {
    const currentTime = Math.floor((Date.now() / 1000) - (60 * 60 * 24 * i));
    const customerId = uuidv7();
    customerIds.push(customerId);

    const createData = {
      id: customerId,
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

  await pjmeDBPrismaClient.customer.createMany({
    data: customers,
  });

  console.log(`✅ Seeded ${customers.length} customers`);

  // seed license keys
  const licenseKeys = [];

  for (let i = 0; i < 0; i++) {
    const email = faker.internet.email().toLowerCase();
    const currentTime = Math.floor((Date.now() / 1000) - (60 * 60 * 24 * i));
    const secret = await pjmaDBPrismaClient.secretKeyLicense.findFirst({
      select: { id: true, key: true },
    });

    const licenseKeyId = uuidv7();
    const payload = generateLicenseKeyPayload(email, licenseKeyId);
    const code = generateLicenseKeyCode(payload, secret.key);

    licenseKeys.push({
      id: licenseKeyId,
      email,
      code,
      customer_id: customerIds[i],
      secret_key_id: secret.id,
      created_at: currentTime,
      updated_at: currentTime,
    });
  }

  await pjmaDBPrismaClient.licenseKey.createMany({
    data: licenseKeys,
  });

  console.log(`✅ Seeded ${licenseKeys.length} license keys`);
}

function getTransactionDetails({
  max,
  products,
}) {
  const transactionDetails = [];
  for (const product of products) {
    transactionDetails.push({
      product_id: product.id,
      product_price_id: product.variants[0].prices[0].id,
      quantity: generateRandomInt(2, 5),

      product_name: product.name,
      product_version: product.versions[0].version,
      product_drive_file_id: product.drive_file_id,
      product_download_link: product.download_link,

      product_variant: product.variants[0].name,
      product_currency_code: product.variants[0].prices[1].currency_code,
      product_price: product.variants[0].prices[1].price.toNumber(),
    });
    if (transactionDetails.length === max) break;
  }
  return transactionDetails;
}

export default async function seedDevData() {
  await seedCustomersAndLicenseKeys();

  // seed transaction
  const products = await pjmeDBPrismaClient.product.findMany({
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
    },
  });
  const customers = await pjmeDBPrismaClient.customer.findMany({
    where: { is_banned: false },
  });

  const transactions = [];
  for (let i = 0; i < 1; i++) {
    let transactionDetails = [];
    // if (i % 2 === 0) {
      transactionDetails = getTransactionDetails({ max: 3, products });
    // } else if (i % 3 === 0) {
      // transactionDetails = getTransactionDetails({ max: 2, products });
    // } else {
      // transactionDetails = getTransactionDetails({ max: 1, products });
    // }

    const selectedCustomer = customers[generateRandomInt(5, customers.length - 1)];
    const currentTime = Math.floor((Date.now() / 1000) - (60 * 60 * 24 * i));
    transactions.push({
      admin_id: process.env.ADMIN_ID,
      admin_email: 'fikkri.reza@gmail.com',
      customer_id: selectedCustomer.id,
      status: 'pending',
      code: generateDocumentCode('TRX'),
      currency_code: transactionDetails[0].product_currency_code,
      total_amount: transactionDetails
        .reduce((total, { quantity, product_price }) => total + (product_price * quantity), 0),
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
    await pjmeDBPrismaClient.transaction.create({
      data: transaction,
    });
  }

  console.log(`✅ Seeded ${transactions.length} transactions`);
}
