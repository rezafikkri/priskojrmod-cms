import { PrismaClient as PjmeDBPrismaClient } from '../prisma-pjme-db/pjme-db-client/index.js';

const pjmeDBPrismaClient = new PjmeDBPrismaClient();

export default async function seedCategory() {
  const name = 'Application';
  const slug = 'application';
  const currentTime = Math.floor(new Date().getTime() / 1000);

  // check if category Application exist or not
  const appCategory = await pjmeDBPrismaClient.category.findUnique({
    where: { slug },
  });

  if (!appCategory) {
    await pjmeDBPrismaClient.category.create({
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
