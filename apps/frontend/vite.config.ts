import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 3000,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
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
        }
      }
    },
    chunkSizeWarningLimit: 500,
    sourcemap: mode === 'development',
    minify: mode === 'production' ? 'esbuild' : false,
  },
  // Optimization for development
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
    ],
  },
}));
