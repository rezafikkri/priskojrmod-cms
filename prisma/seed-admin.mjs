import { PrismaClient as PjmeDBPrismaClient } from '../prisma-pjme-db/pjme-db-client/index.js';
import 'dotenv/config';

const pjmeDBPrismaClient = new PjmeDBPrismaClient();

// seedAdmin dikhususkan untuk seed admin with role owner
export async function seedAdmin() {
  // seed admin
  const admin = await pjmeDBPrismaClient.admin.findFirst({
    where: { id: '117467377036271286193' },
    select: { id: true },
  });
  if (!admin) {
    await pjmeDBPrismaClient.admin.create({
      data: {
        id: process.env.ADMIN_ID,
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
