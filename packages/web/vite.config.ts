import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

/**
 * Подставляет уникальный BUILD_ID в скопированный в dist Service Worker
 * (`public/sw.js`). Имя кэша в sw.js меняется на каждый релиз, поэтому старый
 * кэш удаляется на `activate` и пользователь не застревает на прежней версии
 * (тик. 1795152410). Хук closeBundle с enforce:'post' — после того как Vite
 * скопировал publicDir в dist.
 */
function swCacheVersion(): Plugin {
  return {
    name: 'balloo-sw-cache-version',
    apply: 'build',
    enforce: 'post',
    closeBundle() {
      const swPath = path.resolve(__dirname, 'dist/sw.js');
      if (!fs.existsSync(swPath)) return;
      const buildId = Date.now().toString(36);
      const src = fs.readFileSync(swPath, 'utf8');
      if (!src.includes('__BUILD_ID__')) return;
      fs.writeFileSync(swPath, src.replace(/__BUILD_ID__/g, buildId));
    },
  };
}

export default defineConfig({
  plugins: [react(), swCacheVersion()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@balloo/shared': path.resolve(__dirname, '../shared/src'),
      '@balloo/ui': path.resolve(__dirname, '../ui/src'),
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
    // Source maps для продакшена
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
