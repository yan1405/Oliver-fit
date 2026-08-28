import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // injectManifest (em vez de generateSW): o service worker é o nosso
      // próprio código-fonte (src/sw.js), necessário para tratar os eventos
      // "push" e "notificationclick" da Fase 8. O plugin ainda injeta o
      // pré-cache do build no lugar de self.__WB_MANIFEST.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,png,svg,webmanifest}'],
      },
      manifest: {
        name: 'Oliver Fit',
        short_name: 'OliverFit',
        description: 'Seu acompanhamento de treinos e dieta.',
        theme_color: '#007AFF',
        background_color: '#F2F2F7',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        lang: 'pt-BR',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
