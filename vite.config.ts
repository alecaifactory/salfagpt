import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
});

