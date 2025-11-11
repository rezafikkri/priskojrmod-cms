import { PrismaClient as PjmeDBPrismaClient } from '../prisma-pjme-db/pjme-db-client/index.js';
import 'dotenv/config';

const pjmeDBPrismaClient = new PjmeDBPrismaClient();

// seed admin is only for seeding admin with role "owner", for other admin
// use admin management feature
export async function seedAdmin() {
  const admin = await pjmeDBPrismaClient.admin.findFirst({
    where: { auth_id: process.env.ADMIN_ID },
    select: { id: true },
  });
  if (!admin) {
    const currentTime = Math.floor(new Date().getTime() / 1000);
    await pjmeDBPrismaClient.admin.create({
      data: {
        role: 'owner',
        auth_id: process.env.ADMIN_ID,
        email: 'fikkri.reza@gmail.com',
        picture: 'https://res.cloudinary.com/priskojrmod/image/upload/q_auto/IIC_1795_owpaav.jpg',
        first_name: 'Reza',
        last_name: 'Sariful Fikri',
        whatsapp_phone_number: '+6285758438583',
        created_at: currentTime,
        updated_at: currentTime,
      },
      select: { id: true },
    });
    console.log(`✅ Seeded admin fikkri.reza@gmail.com`);
  }
}
