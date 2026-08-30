import assert from 'node:assert/strict'
import { cn } from './cn.ts'

assert.equal(
  cn('text-heading-3 text-primary-foreground'),
  'text-heading-3 text-primary-foreground',
)
assert.equal(cn('text-body text-caption'), 'text-caption')

console.log('cn: OK')
