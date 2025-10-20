// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import { loadEnv } from 'vite';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// First, load base .env to get CURRENT_PROJECT
const baseEnv = loadEnv('', process.cwd(), '');

// Determine which env file to use
let envFile = '.env';
if (baseEnv.CURRENT_PROJECT === 'SALFACORP' && baseEnv.ENV_SALFACORP) {
  envFile = baseEnv.ENV_SALFACORP;
} else if (baseEnv.CURRENT_PROJECT === 'AIFACTORY' && baseEnv.ENV_AIFACTORY) {
  envFile = baseEnv.ENV_AIFACTORY;
}

// Load the selected env file
let env = baseEnv;
try {
  const envPath = resolve(process.cwd(), envFile);
  const envContent = readFileSync(envPath, 'utf-8');
  
  // Parse env file manually
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      env[key] = value;
    }
  });
  
  console.log(`✅ Loaded environment from: ${envFile}`);
  console.log(`📦 Project: ${env.GOOGLE_CLOUD_PROJECT}`);
  console.log(`🔌 Port: ${env.DEV_PORT || 3000}`);
} catch (error) {
  console.warn(`⚠️ Could not load ${envFile}, using base .env`);
}

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
  server: {
    // Port from loaded environment
    // AI Factory: 3000 (OAuth configured)
    // Salfacorp: 3001
    port: parseInt(env.DEV_PORT || '3000', 10)
  },
  integrations: [
    react(),
    tailwind(),
  ],
});
