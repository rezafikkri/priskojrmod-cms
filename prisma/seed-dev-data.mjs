import jwt from 'jsonwebtoken';
import { faker } from '@faker-js/faker';
import { PrismaClient as PjmaDBPrismaClient } from '../prisma-pjma-db/pjma-db-client/index.js';
import { PrismaClient as PjmeDBPrismaClient } from '../prisma-pjme-db/pjme-db-client/index.js';
import { v7 as uuidv7 } from 'uuid';

const pjmaDBPrismaClient = new PjmaDBPrismaClient();
const pjmeDBPrismaClient = new PjmeDBPrismaClient();

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

export default async function seedDevData() {
  // seed customers
  const customers = [];
  const customerIds = [];
  for (let i = 0; i < 70; i++) {
    const currentTime = BigInt(Math.floor((Date.now() / 1000) - (60 * 60 * 24 * i)));
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

  for (let i = 0; i < 70; i++) {
    const email = faker.internet.email().toLowerCase();
    const currentTime = BigInt(Math.floor((Date.now() / 1000) - (60 * 60 * 24 * i)));
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

  // seed admin
  const admin = await pjmeDBPrismaClient.admin.findFirst({
    where: { id: '117467377036271286193' },
    select: { id: true },
  });
  if (!admin) {
    await pjmeDBPrismaClient.admin.create({
      data: {
        id: '117467377036271286193',
        email: 'fikkri.reza@gmail.com',
        picture: 'https://res.cloudinary.com/priskojrmod/image/upload/q_auto/IIC_1795_owpaav.jpg',
        first_name: 'Reza',
        last_name: 'Sariful Fikri',
        whatsapp_phone_number: '+6285758438583',
      },
      select: { id: true },
    });
    console.log(`✅ Seeded admin fikkri.reza@gmail.com`);
  }
}
