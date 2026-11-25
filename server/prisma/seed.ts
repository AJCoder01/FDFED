import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { seedDatabase } from './seed-data';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Seeding ServiceHub PostgreSQL database...');
  await seedDatabase(prisma);
  console.log('[Seed] Done.');
}

main()
  .catch((error) => {
    console.error('[Seed] Failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
