import assert from 'node:assert/strict'
import { calorieSummary, workoutStatusLabel } from './dashboard.ts'

assert.deepEqual(calorieSummary([350, 650], 2000), { consumed: 1000, remaining: 1000 })
assert.deepEqual(calorieSummary([1200], 1000), { consumed: 1200, remaining: -200 })
assert.deepEqual(calorieSummary([], null), { consumed: 0, remaining: null })
assert.deepEqual(calorieSummary([100], 0), { consumed: 100, remaining: null })
assert.equal(workoutStatusLabel('completed'), 'Concluído')
assert.equal(workoutStatusLabel(null), 'Pendente')

console.log('dashboard: OK')
