// Service worker do Oliver Fit (Fase 8). Fonte do injectManifest do
// vite-plugin-pwa — o build substitui self.__WB_MANIFEST pela lista real de
// arquivos a pré-cachear. Fica em .js (não .ts) de propósito: assim o `tsc -b`
// do build do app não tenta type-checar um arquivo com globals de
// ServiceWorkerGlobalScope, que conflitam com o "DOM" lib do resto do src/.
import { precacheAndRoute } from 'workbox-precaching'

precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = { title: 'Oliver Fit', body: event.data ? event.data.text() : '' }
  }

  const title = payload.title || 'Oliver Fit'
  const options = {
    body: payload.body || '',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data: { url: payload.url || '/' },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const existing = windows.find((client) => new URL(client.url).pathname === targetUrl)
      if (existing) return existing.focus()
      return self.clients.openWindow(targetUrl)
    }),
  )
})
