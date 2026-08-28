import assert from 'node:assert/strict'
import { buildTrailWindow, resolveTrailState, serpentinePath } from './trail.ts'

const points = buildTrailWindow(new Date(2026, 7, 28))

assert.equal(points.length, 7)
assert.equal(points[0].date, '2026-08-31')
assert.equal(points[3].date, '2026-08-28')
assert.equal(points[3].isToday, true)
assert.equal(points[6].date, '2026-08-25')
assert.deepEqual(points.map((point) => point.date), [
  '2026-08-31',
  '2026-08-30',
  '2026-08-29',
  '2026-08-28',
  '2026-08-27',
  '2026-08-26',
  '2026-08-25',
])
assert.match(serpentinePath(points), /^M 80 64 C /)
assert.equal(resolveTrailState(false, false), 'locked')
assert.equal(resolveTrailState(true, false), 'today')
assert.equal(resolveTrailState(false, true), 'completed')

console.log('trail: OK')
