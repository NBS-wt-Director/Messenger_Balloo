import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@balloo/shared': path.resolve(__dirname, '../shared/src'),
      '@balloo/ui': path.resolve(__dirname, '../ui/src'),
    },
  },
  build: {
    target: 'es2020',
    sourcemap: true,
  },
  server: {
    port: 5176,
    proxy: {
      '/api': {
        target: 'http://localhost:3100',
        changeOrigin: true,
      },
    },
  },
});
