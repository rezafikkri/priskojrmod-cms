import { PrismaClient } from './generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { seedAdmin, seedCategory } from './seed-base';
import {
  seedCustomers,
  seedLicenseKeys,
  seedTransactions,
} from './seed-sample';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  await seedAdmin(prisma);
  await seedCategory(prisma);

  if (process.env.NODE_ENV === 'development') {
    // const customers = await seedCustomers(prisma,100);
    // await seedLicenseKeys(prisma, customers);
    await seedTransactions(prisma, 1);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
