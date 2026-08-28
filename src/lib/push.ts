// Helpers puros para o fluxo de Web Push (Fase 8). A parte que fala com
// navigator.serviceWorker/PushManager fica no hook usePush (efeito colateral,
// não testável por unit test simples) — aqui só o que é lógica pura.

const reminderTimePattern = /^([01]\d|2[0-3]):[0-5]\d$/

export function isValidReminderTime(value: string) {
  return reminderTimePattern.test(value)
}

export function sortReminderTimes(times: string[]) {
  return [...new Set(times)].filter(isValidReminderTime).sort()
}

// A chave pública VAPID chega em base64url; PushManager.subscribe espera um
// Uint8Array (applicationServerKey). Conversão padrão da própria documentação
// do Web Push (não há utilitário nativo do browser para isso).
export function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)))
}

type SubscriptionKeys = { p256dh: string; auth: string }
type SubscriptionLike = { endpoint: string; keys?: SubscriptionKeys }

export function subscriptionToRow(subscription: SubscriptionLike, userId: string) {
  if (!subscription.keys?.p256dh || !subscription.keys.auth) return null
  return {
    user_id: userId,
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
  }
}
