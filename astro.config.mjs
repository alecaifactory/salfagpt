// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
  server: {
    // Port from environment variable
    // AI Factory (.env): 3000 (OAuth configured)
    // Salfacorp (.env.salfacorp): 3001
    port: parseInt(process.env.DEV_PORT || '3000', 10)
  },
  integrations: [
    react(),
    tailwind(),
  ],
});
