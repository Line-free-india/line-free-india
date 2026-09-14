import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'Line Free India',
        short_name: 'LFIndia',
        description: 'Skip the queue, save your time',
        theme_color: '#1e1b4b',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        launch_handler: {
          client_mode: 'focus-existing'
        },
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icon-384.png', sizes: '384x384', type: 'image/png', purpose: 'any maskable' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ],
        screenshots: [
          {
            src: '/screenshot-1.png',
            sizes: '1080x2400',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Skip Hospital & Salon Queues'
          },
          {
            src: '/screenshot-2.png',
            sizes: '1080x2400',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Live Token Tracking'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024 // 6MB limit for large bundles
      }
    })
  ],

  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['lucide-react']
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          'motion-vendor': ['framer-motion'],
          'lucide': ['lucide-react']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },

  // 🔥 IMPORTANT (ngrok fix)
  server: {
    host: true
  }
});
