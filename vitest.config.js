import { defineConfig } from 'vitest/config';
import { config } from 'dotenv';

config({ path: '.env.test' });

export default defineConfig({
  test: {
    alias: {
      '@/components/': new URL('./components/', import.meta.url).pathname,
      '@/hooks/': new URL('./hooks/', import.meta.url).pathname,
      '@/lib/': new URL('./lib/', import.meta.url).pathname,
      '@/constants/': new URL('./constants/', import.meta.url).pathname,
    },
    env: process.env,
  },
});
