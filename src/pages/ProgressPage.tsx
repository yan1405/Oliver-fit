import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { MeasurementChart } from '../components/features/MeasurementChart'
import { BottomSheet } from '../components/ui/BottomSheet'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { List, ListItem } from '../components/ui/List'
import { useAuth } from '../hooks/useAuth'
import { chartSeries, formatDelta, measurementDelta, measurementFields, photoAngles, photoStoragePath, type MeasurementField } from '../lib/measurements'
import { supabase } from '../lib/supabase'
import { localDateKey } from '../lib/trail'
import type { Database } from '../types/database'

type Row<Table extends keyof Database['public']['Tables']> = Database['public']['Tables'][Table]['Row']
type Measurement = Row<'measurements'>
type ProgressPhoto = Row<'progress_photos'>
type Tab = 'measurements' | 'photos'
type Angle = ProgressPhoto['angle']

const emptyMeasurement = Object.fromEntries(measurementFields.map(([name]) => [name, ''])) as Record<MeasurementField, string>
const bucket = 'progress-photos'

export function ProgressPage() {
  const { session } = useAuth()
  const [tab, setTab] = useState<Tab>('measurements')
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [photos, setPhotos] = useState<ProgressPhoto[]>([])
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({})
  const [chartField, setChartField] = useState<MeasurementField>('weight_kg')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const today = localDateKey(new Date())

  const [measurementDate, setMeasurementDate] = useState(today)
  const [measurementForm, setMeasurementForm] = useState(emptyMeasurement)
  const [measurementNotes, setMeasurementNotes] = useState('')
  const [measurementId, setMeasurementId] = useState('')
  const [measurementSheet, setMeasurementSheet] = useState(false)

  const [photoDate, setPhotoDate] = useState(today)
  const [photoAngle, setPhotoAngle] = useState<NonNullable<Angle>>('front')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [uploadSheet, setUploadSheet] = useState(false)
  const [openPhoto, setOpenPhoto] = useState<ProgressPhoto | null>(null)
  const [compareIds, setCompareIds] = useState<string[]>([])

  const loadData = useCallback(async () => {
    if (!session) return
    setLoading(true)
    setError('')

    const [measurementResult, photoResult] = await Promise.all([
      supabase.from('measurements').select('*').order('measured_at'),
      supabase.from('progress_photos').select('*').order('taken_at', { ascending: false }),
    ])

    if (measurementResult.error || photoResult.error) {
      setError('Não foi possível carregar suas medidas e fotos.')
      setLoading(false)
      return
    }

    const loadedPhotos = photoResult.data ?? []
    if (loadedPhotos.length) {
      const { data: signedUrls, error: signError } = await supabase.storage
        .from(bucket)
        .createSignedUrls(loadedPhotos.map((photo) => photo.storage_path), 3600)
      if (signError) {
        setError('As fotos foram carregadas, mas as imagens não puderam ser exibidas.')
      } else {
        setPhotoUrls(Object.fromEntries((signedUrls ?? []).filter((item) => item.signedUrl).map((item) => [item.path, item.signedUrl!])))
      }
    } else {
      setPhotoUrls({})
    }

    setMeasurements(measurementResult.data ?? [])
    setPhotos(loadedPhotos)
    setLoading(false)
  }, [session])

  useEffect(() => { void loadData() }, [loadData])

  const latest = measurements.at(-1) ?? null
  const first = measurements[0] ?? null
  const series = useMemo(() => chartSeries(measurements, chartField), [measurements, chartField])
  const chartUnit = measurementFields.find(([name]) => name === chartField)![2]

  function openNewMeasurement() {
    setMeasurementId('')
    setMeasurementDate(today)
    setMeasurementForm(emptyMeasurement)
    setMeasurementNotes('')
    setMeasurementSheet(true)
  }

  function openEditMeasurement(entry: Measurement) {
    setMeasurementId(entry.id)
    setMeasurementDate(entry.measured_at)
    setMeasurementForm(Object.fromEntries(measurementFields.map(([name]) => [name, String(entry[name] ?? '')])) as Record<MeasurementField, string>)
    setMeasurementNotes(entry.notes ?? '')
    setMeasurementSheet(true)
  }

  async function saveMeasurement(event: FormEvent) {
    event.preventDefault()
    if (!session) return
    setSaving(true)
    setError('')
    const values = {
      user_id: session.user.id,
      measured_at: measurementDate,
      notes: measurementNotes.trim() || null,
      ...Object.fromEntries(measurementFields.map(([name]) => [name, measurementForm[name] ? Number(measurementForm[name]) : null])),
    }
    const result = measurementId
      ? await supabase.from('measurements').update(values).eq('id', measurementId)
      : await supabase.from('measurements').upsert(values, { onConflict: 'user_id,measured_at' })
    setSaving(false)
    if (result.error) return setError('Não foi possível salvar a medição.')
    setMeasurementSheet(false)
    await loadData()
  }

  async function deleteMeasurement() {
    if (!measurementId || !window.confirm('Excluir esta medição?')) return
    setSaving(true)
    const { error: deleteError } = await supabase.from('measurements').delete().eq('id', measurementId)
    setSaving(false)
    if (deleteError) return setError('Não foi possível excluir a medição.')
    setMeasurementSheet(false)
    await loadData()
  }

  async function uploadPhoto(event: FormEvent) {
    event.preventDefault()
    if (!session || !photoFile) return
    setSaving(true)
    setError('')
    const extension = photoFile.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = photoStoragePath(session.user.id, photoDate, photoAngle, extension)
    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, photoFile, { contentType: photoFile.type })
    if (uploadError) {
      setSaving(false)
      return setError('Não foi possível enviar a foto.')
    }
    const { error: insertError } = await supabase.from('progress_photos').insert({
      user_id: session.user.id,
      taken_at: photoDate,
      storage_path: path,
      angle: photoAngle,
    })
    setSaving(false)
    if (insertError) {
      await supabase.storage.from(bucket).remove([path])
      return setError('Não foi possível registrar a foto. Tente novamente.')
    }
    setUploadSheet(false)
    setPhotoFile(null)
    await loadData()
  }

  async function deletePhoto(photo: ProgressPhoto) {
    if (!window.confirm('Excluir esta foto de progresso?')) return
    setSaving(true)
    const { error: removeError } = await supabase.storage.from(bucket).remove([photo.storage_path])
    const { error: deleteError } = await supabase.from('progress_photos').delete().eq('id', photo.id)
    setSaving(false)
    if (removeError || deleteError) return setError('Não foi possível excluir a foto.')
    setOpenPhoto(null)
    setCompareIds((current) => current.filter((id) => id !== photo.id))
    await loadData()
  }

  function toggleCompare(id: string) {
    setCompareIds((current) => {
      if (current.includes(id)) return current.filter((value) => value !== id)
      if (current.length < 2) return [...current, id]
      return [current[1], id]
    })
  }

  const comparePhotos = compareIds.map((id) => photos.find((photo) => photo.id === id)).filter((photo): photo is ProgressPhoto => Boolean(photo))

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground">
      <div className="mx-auto w-full max-w-app">
        <header>
          <p className="mb-2 text-overline font-semibold uppercase text-muted-foreground">Progresso</p>
          <h1 className="font-display text-heading-1 font-bold">Medidas e fotos</h1>
        </header>

        <div className="mt-6 grid grid-cols-2 rounded-medium bg-muted p-1" role="tablist" aria-label="Seções de progresso">
          {([['measurements', 'Medidas'], ['photos', 'Fotos']] as const).map(([value, label]) => (
            <button key={value} className={`min-h-10 rounded-small px-2 text-body-small font-semibold ${tab === value ? 'bg-card text-card-foreground shadow-low' : 'text-muted-foreground'}`} type="button" role="tab" aria-selected={tab === value} onClick={() => setTab(value)}>{label}</button>
          ))}
        </div>

        {error && <p className="mt-5 border-l-2 border-error pl-3 text-body-small" role="alert">{error}</p>}
        {loading ? <p className="py-16 text-center text-body text-muted-foreground">Carregando progresso…</p> : (
          <>
            {tab === 'measurements' && (
              <section className="mt-6" aria-labelledby="measurements-title">
                <Card variant="glass">
                  <div className="flex items-end justify-between gap-4 text-foreground">
                    <div>
                      <p className="text-overline font-semibold uppercase">Peso atual</p>
                      <strong className="mt-2 block font-mono text-display font-bold tabular-nums">{latest?.weight_kg ?? '—'}</strong>
                      <p className="mt-1 text-body-small">kg</p>
                    </div>
                    <p className="max-w-32 text-right text-body-small font-semibold">{formatDelta(measurementDelta(first?.weight_kg ?? null, latest?.weight_kg ?? null), 'kg')} desde o início</p>
                  </div>
                </Card>

                <div className="mt-6 flex items-center justify-between gap-4">
                  <h2 className="text-heading-2 font-bold" id="measurements-title">Registros</h2>
                  <Button className="px-4" onClick={openNewMeasurement}>Registrar</Button>
                </div>

                <Card className="mt-4">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-heading-3 font-semibold">Evolução</h3>
                    <select className="max-w-32 rounded-small bg-muted px-3 py-2 text-body-small text-card-foreground" aria-label="Medida do gráfico" value={chartField} onChange={(event) => setChartField(event.target.value as MeasurementField)}>
                      {measurementFields.map(([name, label]) => <option key={name} value={name}>{label}</option>)}
                    </select>
                  </div>
                  <div className="mt-5"><MeasurementChart points={series} unit={chartUnit} /></div>
                </Card>

                <List className="mt-6">
                  {[...measurements].reverse().map((entry) => {
                    const details = measurementFields.filter(([name]) => entry[name] !== null).map(([name, label, unit]) => `${label} ${entry[name]}${unit}`).join(' · ')
                    return <ListItem key={entry.id} label={new Date(`${entry.measured_at}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })} detail={details || 'Sem valores registrados'} onClick={() => openEditMeasurement(entry)} />
                  })}
                </List>
                {!measurements.length && <p className="py-12 text-center text-body text-muted-foreground">Nenhuma medição registrada.</p>}
              </section>
            )}

            {tab === 'photos' && (
              <section className="mt-6" aria-labelledby="photos-title">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-heading-2 font-bold" id="photos-title">Fotos</h2>
                  <Button className="px-4" onClick={() => setUploadSheet(true)}>Adicionar</Button>
                </div>
                {!!photos.length && <p className="mt-2 text-body-small text-muted-foreground">Toque em duas fotos para comparar lado a lado.</p>}

                {comparePhotos.length === 2 && (
                  <Card className="mt-4">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-heading-3 font-semibold">Comparação</h3>
                      <button className="text-body-small font-semibold text-primary" type="button" onClick={() => setCompareIds([])}>Limpar</button>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {comparePhotos.map((photo) => (
                        <figure key={photo.id}>
                          <img className="aspect-[3/4] w-full rounded-medium object-cover" src={photoUrls[photo.storage_path]} alt={`Foto de progresso — ${photoAngles.find(([value]) => value === photo.angle)?.[1] ?? photo.angle}`} />
                          <figcaption className="mt-2 text-center text-caption text-muted-foreground">{new Date(`${photo.taken_at}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</figcaption>
                        </figure>
                      ))}
                    </div>
                  </Card>
                )}

                <div className="mt-5 grid grid-cols-3 gap-2">
                  {photos.map((photo) => {
                    const selected = compareIds.includes(photo.id)
                    return (
                      <button key={photo.id} className={`relative aspect-square overflow-hidden rounded-medium bg-muted ${selected ? 'ring-2 ring-primary' : ''}`} type="button" onClick={() => setOpenPhoto(photo)} onDoubleClick={() => toggleCompare(photo.id)} aria-label={`Foto de ${new Date(`${photo.taken_at}T12:00:00`).toLocaleDateString('pt-BR')}`}>
                        {photoUrls[photo.storage_path] && <img className="size-full object-cover" src={photoUrls[photo.storage_path]} alt="" loading="lazy" />}
                        <span className="absolute inset-x-0 bottom-0 bg-foreground/85 px-2 py-1 text-left text-caption font-semibold text-background">{new Date(`${photo.taken_at}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                      </button>
                    )
                  })}
                </div>
                {!photos.length && <p className="py-12 text-center text-body text-muted-foreground">Nenhuma foto enviada.</p>}
              </section>
            )}
          </>
        )}
      </div>

      <BottomSheet open={measurementSheet} title={measurementId ? 'Editar medição' : 'Registrar medição'} onClose={() => setMeasurementSheet(false)}>
        <form className="grid gap-5" onSubmit={saveMeasurement}>
          <Input label="Data" type="date" value={measurementDate} max={today} onChange={(event) => setMeasurementDate(event.target.value)} required />
          <div className="grid grid-cols-2 gap-3">
            {measurementFields.map(([name, label, unit]) => <Input key={name} label={label} suffix={unit} type="number" min="0" step="0.01" inputMode="decimal" value={measurementForm[name]} onChange={(event) => setMeasurementForm((current) => ({ ...current, [name]: event.target.value }))} />)}
          </div>
          <label className="grid gap-2 text-body-small font-semibold">Observações<textarea className="w-full rounded-medium bg-muted px-4 py-4 text-body text-foreground outline-none focus:ring-2 focus:ring-primary" rows={3} value={measurementNotes} onChange={(event) => setMeasurementNotes(event.target.value)} /></label>
          <Button disabled={saving} type="submit">Salvar medição</Button>
          {measurementId && <Button disabled={saving} type="button" variant="ghost" onClick={deleteMeasurement}>Excluir medição</Button>}
        </form>
      </BottomSheet>

      <BottomSheet open={uploadSheet} title="Adicionar foto" onClose={() => { setUploadSheet(false); setPhotoFile(null) }}>
        <form className="grid gap-5" onSubmit={uploadPhoto}>
          <Input label="Data" type="date" value={photoDate} max={today} onChange={(event) => setPhotoDate(event.target.value)} required />
          <fieldset>
            <legend className="text-body-small font-semibold">Ângulo</legend>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {photoAngles.map(([value, label]) => <label key={value} className={`grid min-h-12 place-items-center rounded-small text-body-small font-semibold ${photoAngle === value ? 'bg-card text-card-foreground ring-2 ring-primary' : 'bg-muted text-card-foreground'}`}><input className="sr-only" type="radio" name="angle" checked={photoAngle === value} onChange={() => setPhotoAngle(value)} />{label}</label>)}
            </div>
          </fieldset>
          <label className="grid gap-2 text-body-small font-semibold text-card-foreground">Foto
            <input className="rounded-medium bg-muted px-4 py-4 text-body-small text-foreground file:mr-3 file:rounded-small file:border-0 file:bg-card file:px-3 file:py-2 file:text-caption file:font-semibold file:text-card-foreground" type="file" accept="image/*" onChange={(event) => setPhotoFile(event.target.files?.[0] ?? null)} required />
          </label>
          <Button disabled={saving || !photoFile} type="submit">{saving ? 'Enviando…' : 'Enviar foto'}</Button>
        </form>
      </BottomSheet>

      <BottomSheet open={Boolean(openPhoto)} title={openPhoto ? new Date(`${openPhoto.taken_at}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : ''} onClose={() => setOpenPhoto(null)}>
        {openPhoto && (
          <div className="grid gap-5">
            <img className="aspect-[3/4] w-full rounded-medium object-cover" src={photoUrls[openPhoto.storage_path]} alt={`Foto de progresso — ${photoAngles.find(([value]) => value === openPhoto.angle)?.[1] ?? openPhoto.angle}`} />
            <p className="text-body-small text-muted-foreground">{photoAngles.find(([value]) => value === openPhoto.angle)?.[1] ?? 'Ângulo não informado'}</p>
            <Button variant="secondary" onClick={() => toggleCompare(openPhoto.id)}>{compareIds.includes(openPhoto.id) ? 'Remover da comparação' : 'Selecionar para comparar'}</Button>
            <Button disabled={saving} variant="ghost" onClick={() => deletePhoto(openPhoto)}>Excluir foto</Button>
          </div>
        )}
      </BottomSheet>
    </main>
  )
}
