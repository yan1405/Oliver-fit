// Oliver Fit — send-reminders (Fase 8)
//
// Disparada a cada minuto por pg_cron + pg_net (ver bloco "Agendamento do
// disparo" em docs/schema.sql). Para cada perfil com reminder_times
// configurado, verifica se o horário atual — calculado no fuso do próprio
// perfil (profiles.timezone) — bate com um dos horários definidos pelo
// usuário. Se bater e o treino e/ou a dieta do dia ainda não estiverem
// concluídos (trail_days), envia um Web Push para cada inscrição do usuário.
//
// Secrets necessários (Supabase → Edge Functions → send-reminders → Secrets):
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto: ou https:),
//   CRON_SECRET (mesmo valor armazenado no Vault para o pg_cron)
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já são injetados automaticamente
// pelo runtime do Supabase, não precisam ser configurados manualmente.
import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!
const vapidSubject = Deno.env.get('VAPID_SUBJECT') ?? 'https://github.com/yan1405/Oliver-fit'
const cronSecret = Deno.env.get('CRON_SECRET')
const defaultTimezone = 'America/Sao_Paulo'

webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
const supabase = createClient(supabaseUrl, serviceRoleKey)

function currentHourMinute(timeZone: string, at: Date) {
  return new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(at)
}

function localDateKey(timeZone: string, at: Date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(at)
}

Deno.serve(async (request) => {
  if (!cronSecret || request.headers.get('x-cron-secret') !== cronSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }

  const now = new Date()

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id,timezone,reminder_times')

  if (profilesError) {
    return new Response(JSON.stringify({ error: profilesError.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }

  const due = (profiles ?? []).filter((profile) => {
    const hhmm = currentHourMinute(profile.timezone || defaultTimezone, now)
    return (profile.reminder_times ?? []).includes(hhmm)
  })

  let sent = 0

  for (const profile of due) {
    const today = localDateKey(profile.timezone || defaultTimezone, now)

    const { data: trailDay } = await supabase
      .from('trail_days')
      .select('workout_completed,diet_completed')
      .eq('user_id', profile.id)
      .eq('trail_date', today)
      .maybeSingle()

    const workoutDone = trailDay?.workout_completed ?? false
    const dietDone = trailDay?.diet_completed ?? false
    if (workoutDone && dietDone) continue

    const pending = [!workoutDone && 'o treino', !dietDone && 'a dieta'].filter(Boolean).join(' e ')
    const payload = JSON.stringify({ title: 'Oliver Fit', body: `Ainda falta registrar ${pending} de hoje.`, url: '/' })

    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('id,endpoint,p256dh,auth')
      .eq('user_id', profile.id)

    for (const subscription of subscriptions ?? []) {
      try {
        await webpush.sendNotification(
          { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
          payload,
        )
        sent += 1
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode
        // 404/410 = inscrição expirada ou revogada pelo navegador — remove
        // para não tentar de novo no próximo minuto.
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', subscription.id)
        }
      }
    }
  }

  return new Response(JSON.stringify({ checked: profiles?.length ?? 0, due: due.length, sent }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
