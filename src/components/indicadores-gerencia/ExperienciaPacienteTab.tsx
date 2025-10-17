'use client'

import React, { Fragment, useEffect, useState, useCallback } from 'react'
import { Pie, Bar, Radar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  RadarController,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  Title,
} from 'chart.js'
import { Loader2, Plus, X } from 'lucide-react'
import type { TooltipItem, ScriptableContext, ChartOptions, PointStyle } from 'chart.js'
import { Button } from '@/components/ui/button'

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  RadarController,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  Title
)

/* ========= Tipos ========= */
interface EspecialidadData {
  nombre: string
  total: number
}

interface EdadReportData {
  rango: string
  total: number
}

interface ObraSocialRow {
  obraSocial: string
  cantidadPacientes: number
}

interface ExperienciaPacienteTabProps {
  loading: boolean
  especialidades: EspecialidadData[]
  edadData: EdadReportData[]
  dateFrom: string
  dateTo: string
  especialidadChart: {
    labels: string[]
    datasets: Array<{
      data: number[]
      backgroundColor: string[]
      borderWidth: number
    }>
  }
  edadBarChart: {
    labels: string[]
    datasets: Array<{
      data: number[]
      backgroundColor: string[]
      borderWidth: number
    }>
  }
  addDisabled: boolean
  onEditRangos: () => void
  onAgregarRango: () => void
  onApplyPreset: (preset: string) => void
}

interface PatientDto {
  id: string
  nombre: string
  apellido: string
  dni: string | null
}

interface ApiRow {
  obraSocialId?: string | null
  obraSocial: string
  cantidadPacientes: number
  pacientes: PatientDto[]
}

interface DistBarDataset {
  data: number[]
  backgroundColor: string[]
  borderColor?: string[]
  borderWidth?: number
}

interface DistBarChartData {
  labels: string[]
  datasets: DistBarDataset[]
}

/* palette */
const PIE_COLORS = [
  '#2563EB','#059669','#D97706','#DC2626','#7C3AED','#0EA5E9',
  '#65A30D','#EA580C','#BE185D','#374151','#14B8A6','#A855F7',
  '#EF4444','#22C55E','#F59E0B','#3B82F6','#8B5CF6','#06B6D4',
]

const generateColors = (count: number): string[] =>
  Array.from({ length: count }, (_, i) => PIE_COLORS[i % PIE_COLORS.length])

const hexToRgba = (hex: string, alpha = 1) => {
  const h = hex.replace('#', '')
  const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const transparentize = (hex: string, alpha = 0.5) => hexToRgba(hex, alpha)

const formatDateAR = (iso: string): string => {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

const NoData = ({ text, onQuick }: { text: string; onQuick: () => void }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <p className="text-gray-500 text-center mb-4 text-base">{text}</p>
    <Button variant="outline" size="sm" onClick={onQuick}>
      Ver último mes
    </Button>
  </div>
)

export default function ExperienciaPacienteTab({
  loading,
  especialidades,
  edadData,
  dateFrom,
  dateTo,
  especialidadChart,
  edadBarChart,
  addDisabled,
  onEditRangos,
  onAgregarRango,
  onApplyPreset,
}: ExperienciaPacienteTabProps) {
  const [loadingObras, setLoadingObras] = useState<boolean>(false)
  const [, setObrasRows] = useState<ObraSocialRow[] | null>(null)
  const [obraChartData, setObraChartData] = useState<{
    labels: string[]
    datasets: Array<{ data: number[]; backgroundColor: string[] }>
  } | null>(null)

  // modal para ampliar el gráfico
  const [modalOpen, setModalOpen] = useState<boolean>(false)

  useEffect(() => {
    if (!dateFrom || !dateTo) {
      setObrasRows(null)
      setObraChartData(null)
      return
    }

    let mounted = true
    setLoadingObras(true)

    fetch('/api/reportes/obra-sociales/paciente-por-obra', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: dateFrom, endDate: dateTo }),
    })
      .then(async (res) => {
        if (!mounted) return
        const json = await res.json()
        if (!res.ok) {
          console.error('Reporte obras sociales error:', json)
          setObrasRows(null)
          setObraChartData(null)
          return
        }
        if (!Array.isArray(json)) {
          setObrasRows(null)
          setObraChartData(null)
          return
        }

        const rowsApi = json as ApiRow[]

        const merged = new Map<string, { label: string; count: number }>()
        for (const r of rowsApi) {
          const rawLabel = String(r.obraSocial ?? 'Particular').trim()
          const key = rawLabel.toLowerCase()
          const count = Number(r.cantidadPacientes) || 0
          const entry = merged.get(key)
          if (entry) {
            entry.count += count
          } else {
            merged.set(key, { label: rawLabel, count })
          }
        }

        const mergedArr = Array.from(merged.values()).sort((a, b) => b.count - a.count)
        setObrasRows(mergedArr.map(m => ({ obraSocial: m.label, cantidadPacientes: m.count })))

        const labels = mergedArr.map(m => m.label)
        const data = mergedArr.map(m => m.count)
        const colors = generateColors(labels.length)
        const bg = colors.map((c) => transparentize(c, 0.18))
        setObraChartData({ labels, datasets: [{ data, backgroundColor: bg }] })
      })
      .catch((err) => {
        console.error('Fetch obras sociales falló', err)
        if (mounted) {
          setObrasRows(null)
          setObraChartData(null)
        }
      })
      .finally(() => { if (mounted) setLoadingObras(false) })

    return () => { mounted = false }
  }, [dateFrom, dateTo])

  /* --- Radar helpers typed correctamente (sin any) --- */
  function getLineColor(ctx: ScriptableContext<'radar'>): string {
    const idx = ctx.datasetIndex ?? 0
    return generateColors(Math.max(1, idx + 1))[idx] ?? PIE_COLORS[0]
  }

  function alternatePointStyles(ctx: ScriptableContext<'radar'>): PointStyle {
    const index = ctx.dataIndex ?? 0
    return (index % 2 === 0 ? 'circle' : 'rect') as PointStyle
  }

  function makeHalfAsOpaque(ctx: ScriptableContext<'radar'>): string {
    const c = getLineColor(ctx)
    return transparentize(c, 0.5)
  }

  function make20PercentOpaque(ctx: ScriptableContext<'radar'>): string {
    const c = getLineColor(ctx)
    return transparentize(c, 0.2)
  }

  function adjustRadiusBasedOnData(ctx: ScriptableContext<'radar'>): number {
    const v = Number(ctx.raw ?? 0)
    return v < 10 ? 5
      : v < 25 ? 7
      : v < 50 ? 9
      : v < 75 ? 11
      : 15
  }

  const radarOptions: ChartOptions<'radar'> = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: 8 },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
      title: { display: true, text: 'Distribución por Obras Sociales (radar)' },
    },
    elements: {
      line: {
        backgroundColor: make20PercentOpaque,
        borderColor: getLineColor,
        borderWidth: 2,
      },
      point: {
        backgroundColor: getLineColor,
        hoverBackgroundColor: makeHalfAsOpaque,
        radius: adjustRadiusBasedOnData,
        pointStyle: alternatePointStyles,
        hoverRadius: 14,
      },
    },
    scales: {
      r: {
        min: 0,
        pointLabels: {
          font: { size: 12 },
        },
      },
    },
  }

  const radarData = obraChartData
    ? {
        labels: obraChartData.labels,
        datasets: [
          {
            label: 'Pacientes únicos',
            data: obraChartData.datasets[0].data,
            backgroundColor: obraChartData.datasets[0].backgroundColor,
            borderColor: generateColors(1)[0],
            borderWidth: 1,
            pointBackgroundColor: generateColors(obraChartData.labels.length),
          },
        ],
      }
    : { labels: [], datasets: [{ label: '', data: [], backgroundColor: [] }] }

  // --- Distribución Horaria (HU 39) ---
  type DistribRow = { hour: number; count: number }

  const [distLoading, setDistLoading] = useState<boolean>(false)
  const [distData, setDistData] = useState<DistBarChartData | null>(null)

  const [distDate, setDistDate] = useState<string>(dateFrom ?? '')
  const [distEspecialidad, setDistEspecialidad] = useState<string>('Todas')
  const [distDuracion, setDistDuracion] = useState<string>('cualquiera')

  // --- Estados de Citas (HU 37) ---
  interface AppointmentStatusData {
    totals: {
      COMPLETADO: number
      CANCELADO: number
      NO_ASISTIO: number
    }
    totalAppointments: number
    ausentismoRate: number
  }

  const [statusLoading, setStatusLoading] = useState<boolean>(false)
  const [statusData, setStatusData] = useState<AppointmentStatusData | null>(null)
  const [statusEspecialidad, setStatusEspecialidad] = useState<string>('Todas')

  useEffect(() => {
    if (!distDate && dateFrom) setDistDate(dateFrom)
  }, [dateFrom, distDate])

  const fetchDistribucion = useCallback(async () => {
    if (!distDate) return
    setDistLoading(true)
    try {
      const body = {
        date: distDate,
        especialidad: distEspecialidad === 'Todas' ? null : distEspecialidad,
        duracion: distDuracion,
      }
      const res = await fetch('/api/reportes/distribucion-horaria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        setDistData(null)
        return
      }
      const json = await res.json() as DistribRow[]
      const startHour = 8
      const endHour = 18
      const labels = Array.from({ length: endHour - startHour + 1 }, (_, i) => {
        const h = startHour + i
        return `${String(h).padStart(2,'0')}:00`
      })
      const counts = labels.map((_, idx) => {
        const hour = startHour + idx
        const found = json.find(r => r.hour === hour)
        return found ? Number(found.count) : 0
      })
      const colors = labels.map((_, i) => PIE_COLORS[i % PIE_COLORS.length])
      const bg = colors.map(c => transparentize(c, 0.9))
      const borders = labels.map(() => '#000000')
      setDistData({
        labels,
        datasets: [{
          data: counts,
          backgroundColor: bg,
          borderColor: borders,
          borderWidth: 1.5,
        }],
      })
    } catch (err) {
      console.error('Error distribucion horaria', err)
      setDistData(null)
    } finally {
      setDistLoading(false)
    }
  }, [distDate, distEspecialidad, distDuracion])

  useEffect(() => {
    if (distDate) void fetchDistribucion()
  }, [distDate, distEspecialidad, distDuracion, fetchDistribucion])

  // --- Fetch Estados de Citas (HU 37) ---
  const fetchAppointmentStatus = useCallback(async () => {
    if (!dateFrom || !dateTo) return
    setStatusLoading(true)
    try {
      const body = {
        startDate: dateFrom,
        endDate: dateTo,
        especialidad: statusEspecialidad === 'Todas' ? null : statusEspecialidad,
        obraSocial: null,
      }
      const res = await fetch('/api/reportes/appointment-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        setStatusData(null)
        return
      }
      const json = await res.json()
      setStatusData(json)
    } catch (err) {
      console.error('Error estados de citas', err)
      setStatusData(null)
    } finally {
      setStatusLoading(false)
    }
  }, [dateFrom, dateTo, statusEspecialidad])

  useEffect(() => {
    void fetchAppointmentStatus()
  }, [fetchAppointmentStatus])

  return (
    <>
      {loading ? (
        <div className="rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            <span className="ml-2 text-gray-600 text-lg">Cargando reportes...</span>
          </div>
        </div>
      ) : (
        <Fragment>
          {/* SECCIÓN 1: dos gráficos lado a lado (Especialidad y Edad) */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* PASTEL - Consultas por Especialidad */}
            <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl border border-emerald-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <h2 className="text-2xl font-semibold text-gray-900">Consultas por Especialidad</h2>
              <p className="text-base text-gray-500 mb-4">
                Periodo: {formatDateAR(dateFrom)} → {formatDateAR(dateTo)}
              </p>

              {especialidades.length > 0 ? (
                <div className="h-96">
                  <Pie
                    data={especialidadChart}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: { usePointStyle: true, pointStyle: 'circle', font: { size: 12 } },
                        },
                        tooltip: {
                          titleFont: { size: 14 },
                          bodyFont: { size: 13 },
                          callbacks: {
                            label: (ctx: TooltipItem<'pie'>) => {
                              const ds = ctx.dataset.data as number[]
                              const total = ds.reduce((a, b) => a + (b as number), 0)
                              const value = Number(ctx.raw)
                              const pct = total ? (value * 100) / total : 0
                              return `${ctx.label}: ${value} (${pct.toFixed(1)}%)`
                            },
                          },
                        },
                      },
                    }}
                  />
                </div>
              ) : (
                <NoData text="No hay consultas por especialidad para el período seleccionado." onQuick={() => onApplyPreset('ultimo_mes')} />
              )}
            </div>

            {/* BARRAS - Distribución Etaria */}
            <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl border border-emerald-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Distribución demográfica de pacientes</h2>
                  <p className="text-base text-gray-500">Rango mínimo 1 año, máximo 100 años</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={onEditRangos}>Editar rangos</Button>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={onAgregarRango} disabled={addDisabled}>
                    <Plus className="h-4 w-4 mr-1" /> Agregar rango
                  </Button>
                </div>
              </div>

              {edadData.length > 0 ? (
                <div className="h-96">
                  <Bar 
                    data={edadBarChart} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          titleFont: { size: 14 },
                          bodyFont: { size: 13 },
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: { stepSize: 1, font: { size: 12 } },
                          title: { display: true, text: 'Cantidad', font: { size: 14 } },
                        },
                        x: {
                          ticks: { font: { size: 12 } },
                        },
                      },
                    }}
                  />
                </div>
              ) : (
                <NoData text="No hay pacientes por rango etario en este período." onQuick={() => onApplyPreset('ultimo_mes')} />
              )}
            </div>
          </section>

          {/* SECCIÓN 2: Distribución Horaria (izquierda) y Obras Sociales (derecha) - MISMO TAMAÑO */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Columna izquierda: Distribución Horaria */}
            <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl border border-emerald-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Distribución Horaria</h2>
                  <p className="text-base text-gray-500">Carga de citas por franja horaria</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap mb-4">
                <input
                  type="date"
                  value={distDate}
                  onChange={(e) => setDistDate(e.target.value)}
                  className="border rounded p-1.5 text-base"
                />
                <select value={distEspecialidad} onChange={(e) => setDistEspecialidad(e.target.value)} className="border rounded p-1.5 text-base">
                  <option>Todas</option>
                  {especialidades.map((s) => <option key={s.nombre}>{s.nombre}</option>)}
                </select>
                <select value={distDuracion} onChange={(e) => setDistDuracion(e.target.value)} className="border rounded p-1.5 text-base">
                  <option value="cualquiera">Cualquier duración</option>
                  <option value="<=15">≤ 15 min</option>
                  <option value="<=30">≤ 30 min</option>
                  <option value=">30">&gt; 30 min</option>
                </select>
                <Button size="sm" onClick={fetchDistribucion}>Generar</Button>
              </div>

              {distLoading ? (
                <div className="h-96 flex items-center justify-center">
                  <Loader2 className="animate-spin" />
                </div>
              ) : distData ? (
                <div className="h-96">
                  <Bar
                    data={distData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          titleFont: { size: 14 },
                          bodyFont: { size: 13 },
                          callbacks: {
                            label: (ctx) => {
                              const value = Number(ctx.raw) || 0
                              return `${value} turnos`
                            },
                          },
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: { font: { size: 12 } },
                          title: { display: true, text: 'Cantidad de Citas', font: { size: 14 } },
                        },
                        x: {
                          ticks: { font: { size: 12 } },
                        },
                      },
                    }}
                  />
                </div>
              ) : (
                <NoData text="No hay datos para esta selección." onQuick={() => { setDistDate(dateFrom ?? '') }} />
              )}
            </div>

            {/* Columna derecha: Obras Sociales - MISMO TAMAÑO */}
            <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl border border-emerald-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Distribución por obra social</h2>
                  <p className="text-base text-gray-500">Periodo: {formatDateAR(dateFrom)} → {formatDateAR(dateTo)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setModalOpen(true)}>Ampliar</Button>
                </div>
              </div>

              {loadingObras ? (
                <div className="h-96 flex items-center justify-center">
                  <Loader2 className="animate-spin" />
                </div>
              ) : obraChartData && obraChartData.labels.length ? (
                <div className="h-96">
                  <Radar data={radarData} options={radarOptions} />
                </div>
              ) : (
                <NoData text="No se encontraron obras sociales en el periodo seleccionado" onQuick={() => onApplyPreset('ultimo_mes')} />
              )}
            </div>
          </section>

          {/* SECCIÓN 3: Estados de Citas (HU 37) */}
          <section className="mb-6">
            <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Estados de Citas</h2>
                  <p className="text-base text-gray-500">Análisis de completados, cancelados y ausentismo</p>
                </div>
                <div className="flex items-center gap-2">
                  <select 
                    value={statusEspecialidad} 
                    onChange={(e) => setStatusEspecialidad(e.target.value)} 
                    className="border rounded p-1.5 text-base"
                  >
                    <option>Todas</option>
                    {especialidades.map((s) => <option key={s.nombre}>{s.nombre}</option>)}
                  </select>
                </div>
              </div>

              {statusLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin" />
                </div>
              ) : statusData ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Gráfico de dona */}
                  <div className="h-96">
                    <Pie
                      data={{
                        labels: ['Completado', 'Cancelado', 'No Asistió'],
                        datasets: [{
                          data: [
                            statusData.totals.COMPLETADO,
                            statusData.totals.CANCELADO,
                            statusData.totals.NO_ASISTIO,
                          ],
                          backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
                          borderColor: '#fff',
                          borderWidth: 2,
                        }],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                            labels: { usePointStyle: true, pointStyle: 'circle', font: { size: 12 } },
                          },
                          tooltip: {
                            titleFont: { size: 14 },
                            bodyFont: { size: 13 },
                            callbacks: {
                              label: (ctx: TooltipItem<'pie'>) => {
                                const value = Number(ctx.raw)
                                const pct = statusData.totalAppointments 
                                  ? (value * 100) / statusData.totalAppointments 
                                  : 0
                                return `${ctx.label}: ${value} (${pct.toFixed(1)}%)`
                              },
                            },
                          },
                        },
                      }}
                    />
                  </div>

                  {/* Métricas clave */}
                  <div className="flex flex-col justify-center gap-4">
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-200">
                      <p className="text-sm text-gray-600 mb-1">Total de Citas</p>
                      <p className="text-3xl font-bold text-gray-900">{statusData.totalAppointments}</p>
                      <p className="text-xs text-gray-500 mt-1">Periodo: {formatDateAR(dateFrom)} → {formatDateAR(dateTo)}</p>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                      <p className="text-sm text-gray-600 mb-1">Completadas</p>
                      <p className="text-3xl font-bold text-green-700">{statusData.totals.COMPLETADO}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {statusData.totalAppointments 
                          ? ((statusData.totals.COMPLETADO * 100) / statusData.totalAppointments).toFixed(1)
                          : '0.0'}% del total
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-red-50 to-rose-50 p-4 rounded-xl border border-red-200">
                      <p className="text-sm text-gray-600 mb-1">Tasa de Ausentismo</p>
                      <p className="text-3xl font-bold text-red-700">{statusData.ausentismoRate.toFixed(1)}%</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {statusData.totals.NO_ASISTIO} pacientes no asistieron
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <NoData 
                  text="No hay datos de estados de citas para el periodo seleccionado" 
                  onQuick={() => onApplyPreset('ultimo_mes')} 
                />
              )}
            </div>
          </section>

          {/* Modal ampliado */}
          {modalOpen && obraChartData && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
              <div className="relative w-[95vw] max-w-4xl h-[80vh] bg-white rounded-2xl p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">Obras Sociales — detalle</h3>
                  <button className="p-1 rounded hover:bg-gray-100" onClick={() => setModalOpen(false)} aria-label="Cerrar">
                    <X />
                  </button>
                </div>
                <div className="h-full">
                  <Radar data={radarData} options={{ ...radarOptions, maintainAspectRatio: false }} />
                </div>
              </div>
            </div>
          )}
        </Fragment>
      )}
    </>
  )
}