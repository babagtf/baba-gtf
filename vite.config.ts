import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'BABA GTF — Controle de Mensalidades',
        short_name: 'BABA GTF',
        description: 'Controle de mensalidades e caixa do grupo BABA GTF',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0a2e0a',
        theme_color: '#1b5e20',
        lang: 'pt-BR',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            // Firestore: cache "network-first" (sempre tenta rede, cai pra cache se offline)
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firestore-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 1 dia
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true, // testar PWA no dev local (útil pra debugar)
      },
    }),
  ],
  base: './', // essencial pro GitHub Pages funcionar
});