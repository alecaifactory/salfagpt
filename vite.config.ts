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
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      // Force whatwg-url to not be bundled
      'whatwg-url': 'whatwg-url/lib/public-api.js',
    },
  },
  ssr: {
    // Don't try to bundle these server-side packages
    external: [
      'node-fetch',
      'whatwg-url',
      'tr46', 
      'webidl-conversions',
    ],
    noExternal: [
      // Ensure these are NOT externalized (opposite of above for client)
      'lucide-react',
      'react-markdown',
    ],
  },
  server: {
    fs: {
      strict: false, // Allow serving files outside of root
    },
  },
});

