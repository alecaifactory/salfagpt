import { defineConfig } from 'vite';

export default defineConfig({
  // MINIMAL CONFIG - No optimizations that can break
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  server: {
    fs: {
      strict: false,
    },
  },
});

