import seedCategory from './seed-category.mjs';
import seedDevData from './seed-dev-data.mjs';

import { PrismaClient as PjmaDBPrismaClient } from '../prisma-pjma-db/pjma-db-client/index.js';
import { PrismaClient as PjmeDBPrismaClient } from '../prisma-pjme-db/pjme-db-client/index.js';

const pjmaDBPrismaClient = new PjmaDBPrismaClient();
const pjmeDBPrismaClient = new PjmeDBPrismaClient();

async function main() {
  await seedCategory();

  if (process.env.NODE_ENV === 'development') {
    await seedDevData();
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
