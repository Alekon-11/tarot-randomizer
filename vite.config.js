import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// База './' — чтобы собранное приложение открывалось из любой папки / на Vercel.
export default defineConfig({
  base: './',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Arcana 78 · Таро',
        short_name: 'Arcana 78',
        description: 'Случайные карты Таро, расклады, карта дня и матрица судьбы.',
        lang: 'ru',
        theme_color: '#140d2c',
        background_color: '#0a0718',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            // изображения карт с Wikimedia — кэшируем для офлайна.
            // CORS-запросы (mode: 'cors', используются для canvas-шеринга) НЕ перехватываем,
            // иначе SW ломает их — пусть идут напрямую в сеть.
            urlPattern: ({ url, request }) =>
              url.hostname.endsWith('wikimedia.org') && request.mode !== 'cors',
            handler: 'CacheFirst',
            options: {
              cacheName: 'wikimedia-images',
              expiration: { maxEntries: 250, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: ({ url }) => url.hostname === 'tarotapi.dev',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'tarot-api', cacheableResponse: { statuses: [0, 200] } }
          },
          {
            // фоновая музыка — кэшируем после первого воспроизведения (для офлайна)
            urlPattern: ({ request, url }) => request.destination === 'audio' || url.pathname.endsWith('.mp3'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio',
              expiration: { maxEntries: 4, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] },
              rangeRequests: true
            }
          }
        ]
      },
      devOptions: { enabled: true }
    })
  ],
  server: { port: 5174, open: true }
})
