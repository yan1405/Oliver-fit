export const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const

export type SessionSummary = { id: string; session_date: string }
export type LoadLog = { session_id: string; exercise_id: string; load_kg: number | null }

export function setProgress(completed: number, target: number) {
  if (target <= 0) return 0
  return Math.max(0, Math.min(completed / target, 1))
}

export function formatTimer(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function loadHistory(sessions: SessionSummary[], logs: LoadLog[], exerciseId: string) {
  const dates = new Map(sessions.map((session) => [session.id, session.session_date]))
  const maximumByDate = new Map<string, number>()

  logs.forEach((log) => {
    const date = dates.get(log.session_id)
    if (!date || log.exercise_id !== exerciseId || log.load_kg === null) return
    maximumByDate.set(date, Math.max(maximumByDate.get(date) ?? log.load_kg, log.load_kg))
  })

  return [...maximumByDate].sort(([a], [b]) => a.localeCompare(b)).map(([date, load]) => ({ date, load }))
}
