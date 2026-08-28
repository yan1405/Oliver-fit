import assert from 'node:assert/strict'
import { isValidReminderTime, sortReminderTimes, subscriptionToRow, urlBase64ToUint8Array } from './push.ts'

assert.equal(isValidReminderTime('08:00'), true)
assert.equal(isValidReminderTime('23:59'), true)
assert.equal(isValidReminderTime('24:00'), false)
assert.equal(isValidReminderTime('8:00'), false)
assert.equal(isValidReminderTime('lembrete'), false)

assert.deepEqual(sortReminderTimes(['20:00', '08:00', '08:00', 'inválido']), ['08:00', '20:00'])

const key = urlBase64ToUint8Array('BEngAP9R8I23kTX4zfMI3PH07BjwS03l2VbR9wGIq-1cxwETBGrf8o-Y0wYcKfCqmN9yBBpCyYwN9DQKbTe4PzY')
assert.ok(key instanceof Uint8Array)
assert.equal(key.length, 65) // ponto EC não comprimido: 0x04 + 32 bytes x + 32 bytes y

assert.deepEqual(
  subscriptionToRow({ endpoint: 'https://push.example/abc', keys: { p256dh: 'p', auth: 'a' } }, 'user-1'),
  { user_id: 'user-1', endpoint: 'https://push.example/abc', p256dh: 'p', auth: 'a' },
)
assert.equal(subscriptionToRow({ endpoint: 'https://push.example/abc' }, 'user-1'), null)

console.log('push: OK')
