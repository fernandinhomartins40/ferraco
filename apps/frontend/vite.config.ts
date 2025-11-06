import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core vendor chunk (~150kb)
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],

          // UI vendor chunk - Radix UI components (~200kb)
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-popover',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-label',
            '@radix-ui/react-switch',
            '@radix-ui/react-avatar',
            '@radix-ui/react-accordion',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-separator',
            '@radix-ui/react-progress',
            '@radix-ui/react-scroll-area',
          ],

          // Chart vendor chunk (~100kb)
          'chart-vendor': ['recharts', 'chart.js', 'react-chartjs-2'],

          // Form vendor chunk (~80kb)
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],

          // Utils vendor chunk (~60kb)
          'utils-vendor': ['axios', 'date-fns', 'clsx', 'tailwind-merge'],

          // Query vendor chunk (~50kb)
          'query-vendor': ['@tanstack/react-query'],

          // DnD vendor chunk (~40kb)
          'dnd-vendor': ['@hello-pangea/dnd', 'react-beautiful-dnd'],

          // Animation vendor chunk (~30kb)
          'animation-vendor': ['framer-motion'],

          // ✅ FASE 4: WhatsApp chunk (code splitting)
          'whatsapp-vendor': ['socket.io-client'],
        },
      },
    },
    chunkSizeWarningLimit: 500,
    sourcemap: mode === 'development',
    minify: mode === 'production' ? 'esbuild' : false,
    // ✅ FASE 4: Otimizações de build
    target: 'es2015',
    cssCodeSplit: true,
    assetsInlineLimit: 4096, // 4kb
  },
  // ✅ FASE 4: Otimizações para development
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'socket.io-client',
      'date-fns',
      'axios',
    ],
    exclude: ['@wppconnect-team/wppconnect'], // Backend only
  },
  // ✅ FASE 4: Performance hints
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
}));
