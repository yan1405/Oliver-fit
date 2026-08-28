import assert from 'node:assert/strict'
import { formatTimer, loadHistory, setProgress } from './workouts.ts'

assert.equal(setProgress(3, 4), 0.75)
assert.equal(setProgress(5, 4), 1)
assert.equal(setProgress(0, 0), 0)
assert.equal(formatTimer(95), '01:35')
assert.deepEqual(
  loadHistory(
    [{ id: 'a', session_date: '2026-08-27' }, { id: 'b', session_date: '2026-08-28' }],
    [
      { session_id: 'a', exercise_id: 'supino', load_kg: 40 },
      { session_id: 'a', exercise_id: 'supino', load_kg: 42.5 },
      { session_id: 'b', exercise_id: 'supino', load_kg: 45 },
      { session_id: 'b', exercise_id: 'agachamento', load_kg: 80 },
    ],
    'supino',
  ),
  [{ date: '2026-08-27', load: 42.5 }, { date: '2026-08-28', load: 45 }],
)

console.log('workouts: OK')
