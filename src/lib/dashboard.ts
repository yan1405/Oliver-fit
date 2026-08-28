export function calorieSummary(calories: number[], goal: number | null) {
  const consumed = calories.reduce((total, value) => total + value, 0)
  return { consumed, remaining: goal === null || goal <= 0 ? null : goal - consumed }
}

export function workoutStatusLabel(status: 'in_progress' | 'completed' | 'skipped' | null) {
  if (status === 'completed') return 'Concluído'
  if (status === 'in_progress') return 'Em andamento'
  if (status === 'skipped') return 'Pulado'
  return 'Pendente'
}
