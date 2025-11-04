import { PrismaClient as PjmeDBPrismaClient } from '../prisma-pjme-db/pjme-db-client/index.js';

const pjmeDBPrismaClient = new PjmeDBPrismaClient();

export default async function seedCategory() {
  // check if category Application exist or not
  const name = 'Application';
  const slug = 'application';
  const currentTime = Math.floor(new Date().getTime() / 1000);

  try {
    await pjmeDBPrismaClient.category.upsert({
      where: { slug },
      update: {},
      create: {
        name,
        slug,
        created_at: currentTime,
        updated_at: currentTime,
      },
    });

    console.log(`✅ Seeded "Application" category successfully.`);
  } catch (err) {}
}
