type Point = { date: string; value: number }

export function MeasurementChart({ points, unit }: { points: Point[]; unit: string }) {
  if (!points.length) return <p className="py-8 text-center text-body-small text-muted-foreground">Registre uma medição para ver sua evolução.</p>

  const width = 300
  const height = 132
  const padding = 18
  const values = points.map((point) => point.value)
  const minimum = Math.min(...values)
  const maximum = Math.max(...values)
  const spread = maximum - minimum || 1
  const coordinates = points.map((point, index) => ({
    ...point,
    x: points.length === 1 ? width / 2 : padding + index * ((width - padding * 2) / (points.length - 1)),
    y: height - padding - ((point.value - minimum) / spread) * (height - padding * 2),
  }))
  const path = coordinates.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ')
  const number = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

  return (
    <figure>
      <svg className="h-auto w-full" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Evolução da medição em ${unit}`}>
        <path d={path} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {coordinates.map((point) => <circle key={point.date} cx={point.x} cy={point.y} r="4" fill="var(--card)" stroke="var(--primary)" strokeWidth="3" />)}
      </svg>
      <figcaption className="flex justify-between text-caption text-muted-foreground">
        <span>{new Date(`${points[0].date}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
        <strong className="font-mono text-card-foreground">Atual {number.format(points.at(-1)!.value)} {unit}</strong>
        <span>{new Date(`${points.at(-1)!.date}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
      </figcaption>
    </figure>
  )
}
