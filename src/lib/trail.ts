export type TrailPoint = {
  date: string
  label: string
  x: number
  y: number
  isToday: boolean
}

export type TrailState = 'locked' | 'today' | 'completed'

const xPositions = [80, 150, 220, 150, 80, 150, 220]

export function localDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function buildTrailWindow(today = new Date()): TrailPoint[] {
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  return xPositions.map((x, index) => {
    const date = new Date(base)
    date.setDate(base.getDate() + index - 3)
    return {
      date: localDateKey(date),
      label: new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit' }).format(date).replace('.', ''),
      x,
      y: 64 + index * 112,
      isToday: index === 3,
    }
  })
}

export function serpentinePath(points: Pick<TrailPoint, 'x' | 'y'>[]) {
  if (!points.length) return ''
  return points.slice(1).reduce((path, point, index) => {
    const previous = points[index]
    const middleY = (previous.y + point.y) / 2
    return `${path} C ${previous.x} ${middleY}, ${point.x} ${middleY}, ${point.x} ${point.y}`
  }, `M ${points[0].x} ${points[0].y}`)
}

export function resolveTrailState(isToday: boolean, completed = false): TrailState {
  return completed ? 'completed' : isToday ? 'today' : 'locked'
}
