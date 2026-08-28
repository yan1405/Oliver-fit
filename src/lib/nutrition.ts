export type NutritionValues = {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

export function decimalToHundredths(value: number | string) {
  const [whole, fraction = ''] = String(value).split('.')
  return Number(whole) * 100 + Number(`${fraction}00`.slice(0, 2))
}

export function nutritionTotals(meals: NutritionValues[]) {
  return meals.reduce((totals, meal) => ({
    calories: totals.calories + meal.calories,
    protein: totals.protein + decimalToHundredths(meal.protein_g),
    carbs: totals.carbs + decimalToHundredths(meal.carbs_g),
    fat: totals.fat + decimalToHundredths(meal.fat_g),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
}

export function formatHundredths(value: number) {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value / 100)
}

export function macroProgress(consumedHundredths: number, goal: number | null) {
  const goalHundredths = goal === null ? 0 : decimalToHundredths(goal)
  return goalHundredths > 0 ? consumedHundredths / goalHundredths : 0
}
