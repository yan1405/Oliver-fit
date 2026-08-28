import { useCallback, useEffect, useState } from 'react'
import { subscriptionToRow, urlBase64ToUint8Array } from '../lib/push'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined
const isSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

export function usePush() {
  const { session } = useAuth()
  const [permission, setPermission] = useState<NotificationPermission>(isSupported ? Notification.permission : 'denied')
  const [subscribed, setSubscribed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isSupported || !session) return
    navigator.serviceWorker.ready.then(async (registration) => {
      const existing = await registration.pushManager.getSubscription()
      setSubscribed(Boolean(existing))
    })
  }, [session])

  const subscribe = useCallback(async () => {
    if (!isSupported || !session || !vapidPublicKey) {
      setError('Notificações push não são suportadas neste navegador.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const permissionResult = await Notification.requestPermission()
      setPermission(permissionResult)
      if (permissionResult !== 'granted') {
        setError('Permissão de notificação negada.')
        return
      }
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })
      const keys = subscription.toJSON().keys as { p256dh: string; auth: string } | undefined
      const row = subscriptionToRow({ endpoint: subscription.endpoint, keys }, session.user.id)
      if (!row) throw new Error('Inscrição sem chaves de criptografia.')
      const { error: upsertError } = await supabase.from('push_subscriptions').upsert(row, { onConflict: 'user_id,endpoint' })
      if (upsertError) throw upsertError
      setSubscribed(true)
    } catch {
      setError('Não foi possível ativar as notificações. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }, [session])

  const unsubscribe = useCallback(async () => {
    if (!isSupported || !session) return
    setBusy(true)
    setError('')
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await supabase.from('push_subscriptions').delete().eq('user_id', session.user.id).eq('endpoint', subscription.endpoint)
        await subscription.unsubscribe()
      }
      setSubscribed(false)
    } catch {
      setError('Não foi possível desativar as notificações.')
    } finally {
      setBusy(false)
    }
  }, [session])

  const sendTestNotification = useCallback(async () => {
    if (!isSupported) return
    const registration = await navigator.serviceWorker.ready
    await registration.showNotification('Oliver Fit', {
      body: 'Notificação de teste — está funcionando.',
      icon: '/pwa-192x192.png',
    })
  }, [])

  return { isSupported, permission, subscribed, busy, error, subscribe, unsubscribe, sendTestNotification }
}
