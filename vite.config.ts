import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  server: {
    fs: {
      strict: false,
    },
  },
  ssr: {
    // Keep server-only modules external
    external: [
      '@google-cloud/firestore',
      '@google-cloud/storage',
      'whatwg-url',
      'tr46',
      'webidl-conversions',
    ],
    noExternal: [],
  },
  optimizeDeps: {
    // ✅ CRITICAL: Force React pre-bundling to prevent duplicate instances
    include: ['react', 'react-dom', 'react/jsx-runtime'],
    // Exclude server-only modules from client bundle optimization
    exclude: [
      '@google-cloud/firestore',
      '@google-cloud/storage', 
      'whatwg-url',
      'tr46',
      'webidl-conversions',
      'node-fetch',
      'google-gax',
    ],
  },
});

