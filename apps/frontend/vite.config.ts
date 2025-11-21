import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from 'vite-plugin-pwa';
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
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Ferraco CRM - Painel Administrativo',
        short_name: 'Ferraco CRM',
        description: 'Painel administrativo do Ferraco CRM com gestão de leads e WhatsApp',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/login',
        scope: '/',
        orientation: 'portrait',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        categories: ['business', 'productivity'],
        shortcuts: [
          {
            name: 'Dashboard',
            short_name: 'Dashboard',
            description: 'Abrir dashboard',
            url: '/admin',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'Leads',
            short_name: 'Leads',
            description: 'Gerenciar leads',
            url: '/admin/leads',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'WhatsApp',
            short_name: 'Chat',
            description: 'Abrir WhatsApp',
            url: '/admin/whatsapp',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        // Estratégias de cache
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 ano
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 5 // 5 minutos
              },
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 dias
              }
            }
          }
        ],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true
      },
      devOptions: {
        enabled: mode === 'development',
        type: 'module'
      }
    })
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
