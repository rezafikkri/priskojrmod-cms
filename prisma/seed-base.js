import 'dotenv/config';

/** @typedef {import('./generated/client').PrismaClient} PrismaClient */

/**
 * seed admin is only for seeding admin with role "owner", for other admin
 * use admin management feature
 * 
 * @param {PrismaClient} prisma
 */
export async function seedAdmin(prisma) {
  const admin = await prisma.admin.findFirst({
    where: { google_user_id: process.env.ADMIN_GOOGLE_ID },
    select: { id: true },
  });
  if (!admin) {
    const currentTime = Math.floor(new Date().getTime() / 1000);
    await prisma.admin.create({
      data: {
        role: 'owner',
        google_user_id: process.env.ADMIN_GOOGLE_ID,
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

/**
 * seed "Application" category, this is default category
 * that will cannot edited and deleted
 *
 * @param {PrismaClient} prisma
 */
export async function seedCategory(prisma) {
  const name = 'Application';
  const slug = 'application';
  const currentTime = Math.floor(new Date().getTime() / 1000);

  // check if category Application exist or not
  const appCategory = await prisma.category.findUnique({
    where: { slug },
  });

  if (!appCategory) {
    await prisma.category.create({
      data: {
        name,
        slug,
        created_at: currentTime,
        updated_at: currentTime,
      },
    });

    console.log(`✅ Seeded "Application" category successfully.`);
  }
}
