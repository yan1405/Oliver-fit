import assert from 'node:assert/strict'
import { chartSeries, formatDelta, measurementDelta, photoStoragePath } from './measurements.ts'

const rows = [
  { measured_at: '2026-08-01', weight_kg: 82.5, waist_cm: null },
  { measured_at: '2026-07-20', weight_kg: 84, waist_cm: 90 },
  { measured_at: '2026-08-15', weight_kg: 81.75, waist_cm: 88.5 },
]

assert.deepEqual(chartSeries(rows, 'weight_kg'), [
  { date: '2026-07-20', value: 84 },
  { date: '2026-08-01', value: 82.5 },
  { date: '2026-08-15', value: 81.75 },
])
assert.deepEqual(chartSeries(rows, 'waist_cm'), [
  { date: '2026-07-20', value: 90 },
  { date: '2026-08-15', value: 88.5 },
])

assert.equal(measurementDelta(84, 81.75), -225)
assert.equal(measurementDelta(null, 81.75), null)
assert.equal(formatDelta(-225, 'kg'), '-2,25 kg')
assert.equal(formatDelta(150, 'cm'), '+1,5 cm')
assert.equal(formatDelta(null, 'kg'), 'Sem histórico suficiente')

const path = photoStoragePath('user-1', '2026-08-28', 'front', 'jpg')
assert.match(path, /^user-1\/2026-08-28-front-[0-9a-f-]{36}\.jpg$/)

console.log('measurements: OK')
