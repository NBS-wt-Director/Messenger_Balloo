import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@balloo/shared': path.resolve(__dirname, '../shared/src'),
    },
  },
  // --- Bundle optimization ---
  build: {
    // Minify с Terser
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: ['log', 'warn'], // убрать console.log/warn из продакшена
        drop_debugger: true,
      },
    },
    // Rollup options
    rollupOptions: {
      // Externalize больших зависимостей для отдельного кэширования CDN
      output: {
        // Разделение бандла наChunks
        manualChunks: {
          // React и React DOM — редко меняются, долго кэшируются
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // UI-библиотеки
          'ui-vendor': ['zustand', '@tanstack/react-query'],
          // Виртуальный скроллинг
          'scroll-vendor': ['react-virtuoso'],
        },
        // Content hash для filename (long-term caching)
        chunkFileNames: 'assets/chunks/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'index.css') return 'assets/styles/[name]-[hash].css';
          return 'assets/[name]-[hash].[ext]';
        },
      },
    },
    // Target для современных браузеров
    target: 'es2020',
    // CSS code splitting
    cssCodeSplit: true,
    // Source maps для продакшена (для Sentry в будущем)
    sourcemap: true,
    // Module preloading policy
    modulePreload: {
      polyfill: true,
    },
    // Report gzip size
    reportCompressedSize: true,
    // Chunk size warning limit
    chunkSizeWarningLimit: 500, // 500KB warning
  },
  // --- CSS optimization ---
  css: {
    // PostCSS конфигурация (autoprefixer через tsconfig)
    preprocessorOptions: {
      css: {
        additionalData: `@import "@/styles/global.css";`,
      },
    },
  },
  // --- Server ---
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3100',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:3100',
        ws: true,
      },
    },
  },
});
