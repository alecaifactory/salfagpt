import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    include: [
      'react', 
      'react-dom',
      'lucide-react',
      'react-markdown',
      'remark-gfm',
      'rehype-raw',
      'react-syntax-highlighter',
    ],
    exclude: [
      '@google-cloud/firestore',
      'google-gax',
      'node-fetch',
      'whatwg-url',
      'tr46',
      'webidl-conversions',
    ],
    esbuildOptions: {
      // Explicitly exclude whatwg-url from client bundle
      external: ['whatwg-url', 'node-fetch'],
    },
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  build: {
    rollupOptions: {
      external: ['whatwg-url', 'node-fetch'],
    },
  },
  server: {
    fs: {
      strict: false, // Allow serving files outside of root
    },
  },
});

