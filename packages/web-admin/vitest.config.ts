// Vitest-конфиг пакета web-admin (тикет 1793187702).
// Алиасы повторяют vite.config.ts: экраны админки живут в этом пакете, а
// сервисы/сторы переиспользуются из packages/web через '@' -> ../web/src.
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../web/src'),
      '@balloo/shared': path.resolve(__dirname, '../shared/src'),
      '@balloo/ui': path.resolve(__dirname, '../ui/src'),
    },
    // Экраны админки лежат в этом пакете, а их сервисы/сторы — в packages/web
    // (алиас '@'). Без dedupe react резолвится дважды (18.3.1 из web-admin и
    // 18.3.0 из web) и React-контекст роутера становится null.
    dedupe: ['react', 'react-dom', 'react-router', 'react-router-dom'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['../web/src/__tests__/setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    css: false,
  },
});
