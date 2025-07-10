import jwt from 'jsonwebtoken';
import { faker } from '@faker-js/faker';
import { PrismaClient as PjmaDBPrismaClient } from '../prisma-pjma-db/pjma-db-client/index.js';
import { PrismaClient as PjmeDBPrismaClient } from '../prisma-pjme-db/pjme-db-client/index.js';

const pjmaDBPrismaClient = new PjmaDBPrismaClient();
const pjmeDBPrismaClient = new PjmeDBPrismaClient();
const SECRET = '36b5d3c2f8cf596ffc0bdb8d5ced264f9d6e1728ef61db686414f16aa3007a95'; 

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

function generateJwtKey(payload) {
  return jwt.sign(payload, SECRET);
}

async function main() {
  // seed license keys
  const secretKeyId = 1n;
  const licenseKeys = [];

  for (let i = 0; i < 124; i++) {
    const email = faker.internet.email().toLowerCase();
    const currentTime = BigInt(Math.floor((Date.now() / 1000) - (60 * 60 * 24 * i)));
    const payload = generateLicenseKeyPayload(email);
    const key = generateJwtKey(payload);

    licenseKeys.push({
      email,
      key,
      secret_key_id: secretKeyId,
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
