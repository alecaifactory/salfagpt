// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import { loadEnv } from 'vite';

// NOTE: Environment loading is handled by scripts/load-env.js
// which runs before this config via "npm run dev"
// It reads .env.project and copies the correct env file to .env

// Load environment variables
const env = loadEnv('', process.cwd(), '');

// Inject into process.env for runtime access
Object.keys(env).forEach(key => {
  if (process.env[key] === undefined) {
    process.env[key] = env[key];
  }
});

console.log('🔧 Config loaded:');
console.log(`   Project: ${process.env.GOOGLE_CLOUD_PROJECT}`);
console.log(`   Port: ${process.env.DEV_PORT}`);
console.log(`   Base URL: ${process.env.PUBLIC_BASE_URL}`);

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
  server: {
    port: parseInt(process.env.DEV_PORT || process.env.PORT || '3000', 10),
    host: process.env.HOST || '0.0.0.0',
  },
  integrations: [
    react(),
    tailwind(),
  ],
  vite: {
    // Make all env vars available to server-side code
    define: {
      'process.env.GOOGLE_CLOUD_PROJECT': JSON.stringify(process.env.GOOGLE_CLOUD_PROJECT),
      'process.env.PUBLIC_BASE_URL': JSON.stringify(process.env.PUBLIC_BASE_URL),
      'process.env.GOOGLE_CLIENT_ID': JSON.stringify(process.env.GOOGLE_CLIENT_ID),
      'process.env.GOOGLE_CLIENT_SECRET': JSON.stringify(process.env.GOOGLE_CLIENT_SECRET),
      'process.env.JWT_SECRET': JSON.stringify(process.env.JWT_SECRET),
      'process.env.GOOGLE_AI_API_KEY': JSON.stringify(process.env.GOOGLE_AI_API_KEY),
    },
    // Cache busting for development
    build: {
      cssCodeSplit: false, // Prevent CSS splitting that causes phantom files - use single CSS bundle
      rollupOptions: {
        output: {
          // Add version hash to filenames to bust browser cache
          entryFileNames: '[name].[hash].js',
          chunkFileNames: '[name].[hash].js',
          assetFileNames: '[name].[hash].[ext]'
        }
      }
    },
    ssr: {
      // Don't bundle Google Cloud packages - they should be external
      external: [
        '@google-cloud/firestore',
        '@google-cloud/bigquery',
        '@google-cloud/storage',
        '@google-cloud/logging',
        '@google-cloud/error-reporting',
      ],
      // Handle whatwg-url ESM issues
      noExternal: ['whatwg-url', 'tr46', 'webidl-conversions'],
    },
  },
});
