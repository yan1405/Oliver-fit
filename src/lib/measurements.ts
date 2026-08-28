import { decimalToHundredths, formatHundredths } from './nutrition.ts'

export const measurementFields = [
  ['weight_kg', 'Peso', 'kg'],
  ['waist_cm', 'Cintura', 'cm'],
  ['chest_cm', 'Peito', 'cm'],
  ['arm_cm', 'Braço', 'cm'],
  ['hip_cm', 'Quadril', 'cm'],
  ['thigh_cm', 'Coxa', 'cm'],
] as const

export type MeasurementField = (typeof measurementFields)[number][0]

export const photoAngles = [
  ['front', 'Frente'],
  ['side', 'Lado'],
  ['back', 'Costas'],
] as const

type MeasurementRow = Record<MeasurementField, number | null> & { measured_at: string }

export function chartSeries(measurements: MeasurementRow[], field: MeasurementField) {
  return measurements
    .filter((row) => row[field] !== null)
    .map((row) => ({ date: row.measured_at, value: row[field] as number }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

// Delta em centésimos, calculado por aritmética inteira para não introduzir
// erro de arredondamento intermediário (mesma abordagem de lib/nutrition.ts).
export function measurementDelta(first: number | null, latest: number | null) {
  if (first === null || latest === null) return null
  return decimalToHundredths(latest) - decimalToHundredths(first)
}

export function formatDelta(deltaHundredths: number | null, unit: string) {
  if (deltaHundredths === null) return 'Sem histórico suficiente'
  const sign = deltaHundredths > 0 ? '+' : ''
  return `${sign}${formatHundredths(deltaHundredths)} ${unit}`
}

export function photoStoragePath(userId: string, takenAt: string, angle: string, extension: string) {
  return `${userId}/${takenAt}-${angle}-${crypto.randomUUID()}.${extension}`
}
