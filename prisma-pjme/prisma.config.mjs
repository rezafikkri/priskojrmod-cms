import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma-pjme/schema.prisma',
  migrations: {
    path: '',
    seed: 'node prisma/seed.mjs',
  },
});
