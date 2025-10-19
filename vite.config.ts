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
    force: true, // Force re-optimization
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  server: {
    fs: {
      strict: false, // Allow serving files outside of root
    },
  },
});

