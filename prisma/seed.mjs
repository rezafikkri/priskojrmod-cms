import jwt from 'jsonwebtoken';
import { faker } from '@faker-js/faker';
import { PrismaClient as PjmaDBPrismaClient } from '../prisma-pjma-db/pjma-db-client/index.js';
import { PrismaClient as PjmeDBPrismaClient } from '../prisma-pjme-db/pjme-db-client/index.js';
import { v7 } from 'uuid';

const pjmaDBPrismaClient = new PjmaDBPrismaClient();
const pjmeDBPrismaClient = new PjmeDBPrismaClient();

function generateLicenseKeyPayload(email) {
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  return {
    name: faker.person.fullName(),
    email,
    variant_id: '',
    type: 'online',
    exp: Math.floor(expiresAt.getTime() / 1000),
  };
}

function generateJwtKey(payload, secret) {
  return jwt.sign(payload, secret);
}

async function main() {
  // seed license keys
  const licenseKeys = [];

  for (let i = 0; i < 0; i++) {
    const email = faker.internet.email().toLowerCase();
    const currentTime = BigInt(Math.floor((Date.now() / 1000) - (60 * 60 * 24 * i)));
    const secret = await pjmaDBPrismaClient.secretKeyLicense.findFirst({
      select: { id: true, key: true },
    });
    const payload = generateLicenseKeyPayload(email);
    const key = generateJwtKey(payload, secret.key);

    licenseKeys.push({
      email,
      key,
      customer_id: v7(),
      secret_key_id: secret.id,
      used_for_activate: false,
      used_for_download: false,
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

  // seed customers
  const customers = [];
  for (let i = 0; i < 4; i++) {
    const currentTime = BigInt(Math.floor((Date.now() / 1000) - (60 * 60 * 24 * i)));
    const createData = {
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
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await pjmaDBPrismaClient.$disconnect();
    await pjmeDBPrismaClient.$disconnect();
  });
