import assert from 'node:assert/strict'
import { decimalToHundredths, formatHundredths, macroProgress, nutritionTotals } from './nutrition.ts'

assert.equal(decimalToHundredths('12.34'), 1234)
assert.deepEqual(nutritionTotals([
  { calories: 100, protein_g: 0.1, carbs_g: 10.25, fat_g: 2 },
  { calories: 250, protein_g: 0.2, carbs_g: 20.25, fat_g: 3.5 },
]), { calories: 350, protein: 30, carbs: 3050, fat: 550 })
assert.equal(formatHundredths(3050), '30,5')
assert.equal(macroProgress(3000, 60), 0.5)
assert.equal(macroProgress(3000, null), 0)

console.log('nutrition: OK')
