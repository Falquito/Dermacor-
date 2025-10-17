'use client'

import { Fragment, useState, useEffect } from 'react'
import { Bar } from 'react-chartjs-2'
import { 
  Users, 
  Calendar, 
  MapPin, 
  UserCheck, 
  Plus, 
  Loader2,
  Settings,
  Activity, 
  BarChart3, 
  Heart
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { TooltipItem } from 'chart.js'

/* ========= Tipos ========= */
interface EdadDistribucionData {
  rango: string
  total: number
  minEdad: number
  maxEdad: number
}

interface FrecuenciaVisitasData {
  rango: string
  total: number
  minVisitas: number
  maxVisitas: number
}

interface GeneroEdadData {
  genero: 'Masculino' | 'Femenino' | 'Otro'
  rango: string
  total: number
}

interface GeografiaData {
  ciudad: string
  total: number
}

interface PacienteData {
  id: string
  nombre: string
  apellido: string
  fechaNacimiento: Date
  genero: 'Masculino' | 'Femenino' | 'Otro'
  ciudad?: string
  totalVisitas: number
}

interface MisPacientesTabProps {
  professionalId: string
  dateFrom: string
  dateTo: string
}

const generateColors = (count: number, baseHue = 160): string[] => {
  const colors = []
  for (let i = 0; i < count; i++) {
    const hue = (baseHue + (i * 360 / count)) % 360
    const saturation = 70 + (i % 3) * 10
    const lightness = 50 + (i % 2) * 10
    colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`)
  }
  return colors
}

// Componente para métricas con animaciones (similar a las otras pestañas)
interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  subtitle?: string
  Icon: React.ComponentType<{ className?: string }>
  delay?: number
}

const MetricCard = ({ title, value, change, subtitle, Icon, delay = 0 }: MetricCardProps) => {
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  const changeColor = change && change > 0 ? 'text-emerald-600' : change && change < 0 ? 'text-red-500' : 'text-gray-500'
  const changeBg = change && change > 0 ? 'bg-emerald-50' : change && change < 0 ? 'bg-red-50' : 'bg-gray-50'

  return (
    <div 
      className={`
        rounded-2xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/20 
        p-6 shadow-sm hover:shadow-lg transition-all duration-500 hover:border-emerald-200
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Icon className="h-5 w-5 text-emerald-600" />
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h3>
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {change !== undefined && (
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${changeBg} ${changeColor}`}>
                {change > 0 ? '↗' : change < 0 ? '↘' : '→'} {Math.abs(change).toFixed(1)}%
              </div>
            )}
            {subtitle && (
              <p className="text-sm text-gray-600">{subtitle}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente para rangos etarios editables
const RangeEditor = ({ 
  ranges, 
  onRangesChange, 
  onClose, 
  title = "Editar Rangos",
  maxRanges
}: {
  ranges: Array<{ min: number; max: number }>
  onRangesChange: (ranges: Array<{ min: number; max: number }>) => void
  onClose: () => void
  title?: string
  maxRanges?: number
}) => {
  const [localRanges, setLocalRanges] = useState(ranges)

  const updateRange = (index: number, field: 'min' | 'max', value: number) => {
    const newRanges = [...localRanges]
    newRanges[index][field] = value
    setLocalRanges(newRanges)
  }

  const addRange = () => {
    const canAdd = maxRanges ? localRanges.length < maxRanges : true
    if (canAdd) {
      const lastMax = localRanges.length > 0 ? Math.max(...localRanges.map(r => r.max)) : 0
      setLocalRanges([...localRanges, { min: lastMax + 1, max: lastMax + 10 }])
    }
  }

  const removeRange = (index: number) => {
    const canRemove = maxRanges ? localRanges.length > 1 : localRanges.length > 1
    if (canRemove) {
      setLocalRanges(localRanges.filter((_, i) => i !== index))
    }
  }

  const handleSave = () => {
    onRangesChange(localRanges.sort((a, b) => a.min - b.min))
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {localRanges.map((range, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                type="number"
                value={range.min}
                onChange={(e) => updateRange(index, 'min', parseInt(e.target.value) || 0)}
                className="w-20"
                min="0"
              />
              <span>-</span>
              <Input
                type="number"
                value={range.max}
                onChange={(e) => updateRange(index, 'max', parseInt(e.target.value) || 0)}
                className="w-20"
                min="0"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeRange(index)}
                disabled={maxRanges ? localRanges.length <= 1 : localRanges.length <= 1}
              >
                ×
              </Button>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-4">
          <Button 
            variant="outline" 
            onClick={addRange} 
            className="flex-1"
            disabled={maxRanges ? localRanges.length >= maxRanges : false}
          >
            <Plus className="h-4 w-4 mr-1" /> 
            {maxRanges && localRanges.length >= maxRanges 
              ? `Máximo ${maxRanges} rangos` 
              : 'Agregar'
            }
          </Button>
        </div>

        <div className="flex gap-2 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleSave} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
            Guardar
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function MisPacientesTab({ professionalId, dateFrom, dateTo }: MisPacientesTabProps) {
  // Estados para datos
  const [loading, setLoading] = useState(true)
  const [pacientes, setPacientes] = useState<PacienteData[]>([])
  
  // Estados para configuración de rangos
  const [edadRanges, setEdadRanges] = useState([
    { min: 0, max: 18 },
    { min: 19, max: 30 },
    { min: 31, max: 50 },
    { min: 51, max: 70 },
    { min: 71, max: 100 }
  ])
  
  const [generoEdadRanges, setGeneroEdadRanges] = useState([
    { min: 0, max: 30 },
    { min: 31, max: 60 },
    { min: 61, max: 100 }
  ])
  
  const [visitasRanges, setVisitasRanges] = useState([
    { min: 1, max: 2 },
    { min: 3, max: 5 },
    { min: 6, max: 10 },
    { min: 11, max: 100 }
  ])

  // Estados para filtros (cada gráfico tiene su propio filtro)
  const [generoFilterEdad, setGeneroFilterEdad] = useState<string>('todos')
  const [generoFilterVisitas, setGeneroFilterVisitas] = useState<string>('todos') 
  const [generoFilterGeografia, setGeneroFilterGeografia] = useState<string>('todos')
  const [maxCiudades, setMaxCiudades] = useState(10)
  
  // Estados para editores
  const [showEdadEditor, setShowEdadEditor] = useState(false)
  const [showVisitasEditor, setShowVisitasEditor] = useState(false)
  const [showGeneroEdadEditor, setShowGeneroEdadEditor] = useState(false)

  // Función para calcular edad
  const calculateAge = (birthDate: Date): number => {
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  // Cargar datos de pacientes
  useEffect(() => {
    const fetchPacientes = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/professional/patients/stats?professionalId=${professionalId}&dateFrom=${dateFrom}&dateTo=${dateTo}`)
        if (response.ok) {
          const data = await response.json()
          console.log('📊 MisPacientesTab - Datos recibidos:', {
            dateFrom,
            dateTo,
            totalPacientes: data.pacientes?.length || 0,
            pacientes: data.pacientes,
            generosEncontrados: [...new Set(data.pacientes?.map((p: PacienteData) => `"${p.genero}"`) || [])],
            distribucionGenero: data.estadisticas?.distribucionGenero
          })
          setPacientes(data.pacientes || [])
        }
      } catch (error) {
        console.error('Error fetching patient stats:', error)
      } finally {
        setLoading(false)
      }
    }

    if (professionalId && dateFrom && dateTo) {
      fetchPacientes()
    }
  }, [professionalId, dateFrom, dateTo])

  // Procesamiento de datos para distribución etaria
  const edadDistribucionData: EdadDistribucionData[] = edadRanges.map(range => {
    const count = pacientes.filter(p => {
      // Aplicar filtro de género específico para edad
      const pasaFiltroGenero = generoFilterEdad === 'todos' || p.genero === generoFilterEdad
      const edad = calculateAge(new Date(p.fechaNacimiento))
      return pasaFiltroGenero && edad >= range.min && edad <= range.max
    }).length
    
    return {
      rango: `${range.min}-${range.max}`,
      total: count,
      minEdad: range.min,
      maxEdad: range.max
    }
  })

  // Debug log
  console.log('📊 MisPacientesTab - Distribución por edad calculada:', {
    dateFrom,
    dateTo,
    generoFilterEdad,
    totalPacientes: pacientes.length,
    pacientesFiltrados: pacientes.filter(p => generoFilterEdad === 'todos' || p.genero === generoFilterEdad).length,
    edadDistribucionData,
    ejemploComparacion: pacientes.slice(0, 3).map(p => ({
      paciente: `${p.nombre} ${p.apellido}`,
      genero: `"${p.genero}"`,
      filtro: `"${generoFilterEdad}"`,
      coincide: p.genero === generoFilterEdad,
      eseTodos: generoFilterEdad === 'todos'
    }))
  })

  // Procesamiento de datos para frecuencia de visitas
  const frecuenciaVisitasData: FrecuenciaVisitasData[] = visitasRanges.map(range => {
    const count = pacientes.filter(p => {
      // Aplicar filtro de género específico para visitas
      const pasaFiltroGenero = generoFilterVisitas === 'todos' || p.genero === generoFilterVisitas
      return pasaFiltroGenero && p.totalVisitas >= range.min && p.totalVisitas <= range.max
    }).length
    
    return {
      rango: `${range.min}-${range.max}`,
      total: count,
      minVisitas: range.min,
      maxVisitas: range.max
    }
  })

  // Debug log para frecuencia de visitas
  console.log('📊 MisPacientesTab - Frecuencia de visitas calculada:', {
    generoFilterVisitas,
    totalPacientes: pacientes.length,
    pacientesFiltrados: pacientes.filter(p => generoFilterVisitas === 'todos' || p.genero === generoFilterVisitas).length,
    frecuenciaVisitasData
  })

  // Procesamiento de datos para distribución por edad y género (sin filtro)
  const generoEdadData: GeneroEdadData[] = []
  const generos: Array<'Masculino' | 'Femenino' | 'Otro'> = ['Masculino', 'Femenino', 'Otro']
  
  generos.forEach(genero => {
    generoEdadRanges.forEach(range => {
      const count = pacientes.filter(p => {
        const edad = calculateAge(new Date(p.fechaNacimiento))
        return p.genero === genero && edad >= range.min && edad <= range.max
      }).length
      
      if (count > 0) {
        generoEdadData.push({
          genero,
          rango: `${range.min}-${range.max}`,
          total: count
        })
      }
    })
  })

  // Debug log para género y edad
  console.log('📊 MisPacientesTab - Distribución edad-género calculada:', {
    totalPacientes: pacientes.length,
    generoEdadRanges,
    generoEdadData
  })

  // Procesamiento de datos para distribución geográfica
  const geografiaData: GeografiaData[] = pacientes
    .filter(p => {
      // Aplicar filtro de género específico para geografía y que tenga ciudad
      const pasaFiltroGenero = generoFilterGeografia === 'todos' || p.genero === generoFilterGeografia
      return pasaFiltroGenero && p.ciudad
    })
    .reduce((acc, p) => {
      const ciudad = p.ciudad!
      const existing = acc.find(item => item.ciudad === ciudad)
      if (existing) {
        existing.total++
      } else {
        acc.push({ ciudad, total: 1 })
      }
      return acc
    }, [] as GeografiaData[])
    .sort((a, b) => b.total - a.total)
    .slice(0, maxCiudades)

  // Debug log para distribución geográfica
  console.log('📊 MisPacientesTab - Distribución geográfica calculada:', {
    generoFilterGeografia,
    totalPacientes: pacientes.length,
    pacientesFiltradosConCiudad: pacientes.filter(p => {
      const pasaFiltroGenero = generoFilterGeografia === 'todos' || p.genero === generoFilterGeografia
      return pasaFiltroGenero && p.ciudad
    }).length,
    geografiaData
  })

  // Configuración de gráficos
  const edadChartData = {
    labels: edadDistribucionData.map(d => d.rango),
    datasets: [{
      label: 'Pacientes',
      data: edadDistribucionData.map(d => d.total),
      backgroundColor: generateColors(edadDistribucionData.length, 160),
      borderWidth: 0,
      borderRadius: 8,
    }]
  }

  const visitasChartData = {
    labels: frecuenciaVisitasData.map(d => `${d.rango} visitas`),
    datasets: [{
      label: 'Pacientes',
      data: frecuenciaVisitasData.map(d => d.total),
      backgroundColor: generateColors(frecuenciaVisitasData.length, 200),
      borderWidth: 0,
      borderRadius: 8,
    }]
  }

  const generoChartData = {
    labels: generoEdadRanges.map(r => `${r.min}-${r.max} años`),
    datasets: generos.map((genero, index) => ({
      label: genero,
      data: generoEdadRanges.map(range => {
        const rango = `${range.min}-${range.max}`
        const item = generoEdadData.find(d => d.genero === genero && d.rango === rango)
        return item ? item.total : 0
      }),
      backgroundColor: generateColors(3, 240)[index],
      borderWidth: 0,
      borderRadius: 4,
    }))
  }

  const geografiaChartData = {
    labels: geografiaData.map(d => d.ciudad),
    datasets: [{
      label: 'Pacientes por ciudad',
      data: geografiaData.map(d => d.total),
      backgroundColor: generateColors(geografiaData.length, 280),
      borderWidth: 0,
      borderRadius: 8,
    }]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: { 
          usePointStyle: true, 
          pointStyle: 'circle',
          padding: 20
        }
      },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'bar'>) => {
            return `${ctx.dataset.label}: ${ctx.raw} pacientes`
          }
        }
      }
    },
    scales: {
      y: { 
        beginAtZero: true, 
        ticks: { stepSize: 1 }
      }
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            <span className="text-lg text-gray-600">Cargando análisis de mis pacientes...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Fragment>
        {/* Header con información del período */}
        <div className="rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-teal-50 p-6 shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-emerald-800 mb-2">Análisis de Mis Pacientes</h2>
              <div className="text-sm text-gray-600 space-y-1">
                <p>📊 Distribución demográfica, frecuencia de visitas y análisis geográfico</p>
                <p>🔍 Período analizado: {dateFrom} hasta {dateTo}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">Resumen de Análisis</div>
              <div className="flex flex-wrap gap-1 justify-end">
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs">
                  {pacientes.length} pacientes
                </span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                  {geografiaData.length} ciudades
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Métricas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricCard
            title="Total Pacientes"
            value={pacientes.length}
            subtitle="En el período seleccionado"
            Icon={Users}
            delay={0}
          />
          
          <MetricCard
            title="Promedio Visitas"
            value={pacientes.length > 0 ? (pacientes.reduce((acc, p) => acc + p.totalVisitas, 0) / pacientes.length).toFixed(1) : '0'}
            subtitle="Visitas por paciente"
            Icon={Calendar}
            delay={100}
          />
          
          <MetricCard
            title="Edad Promedio"
            value={`${pacientes.length > 0 ? Math.round(pacientes.reduce((acc, p) => acc + calculateAge(new Date(p.fechaNacimiento)), 0) / pacientes.length) : '0'} años`}
            subtitle="Promedio de edad de pacientes"
            Icon={Heart}
            delay={200}
          />
          
          <MetricCard
            title="Cobertura Geográfica"
            value={`${geografiaData.length} ciudades`}
            subtitle={geografiaData.length > 0 ? `Incluyendo ${geografiaData[0]?.ciudad}` : "Sin datos geográficos"}
            Icon={MapPin}
            delay={300}
          />
        </div>

        {/* Gráficos principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. Distribución de Edades */}
          <Card className="rounded-3xl border-emerald-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
              <CardTitle className="flex items-center gap-3 text-emerald-800">
                <div className="p-2 rounded-lg bg-emerald-100">
                  <BarChart3 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-xl font-bold">Distribución por Edad</div>
                  <div className="text-sm font-normal text-gray-600">
                    Análisis de rangos etarios de pacientes
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                  <Select value={generoFilterEdad} onValueChange={setGeneroFilterEdad}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Femenino">Femenino</SelectItem>
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => setShowEdadEditor(true)}>
                    <Settings className="h-4 w-4 mr-1" /> Editar rangos
                  </Button>
                </div>
              </div>
              
              {edadDistribucionData.some(d => d.total > 0) ? (
                <div className="h-80">
                  <Bar 
                    key={`edad-chart-${dateFrom}-${dateTo}-${generoFilterEdad}-${edadDistribucionData.map(d => d.total).join('-')}`}
                    data={edadChartData} 
                    options={chartOptions} 
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-80 text-gray-500">
                  No hay datos para mostrar
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2. Frecuencia de Visitas */}
          <Card className="rounded-3xl border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
              <CardTitle className="flex items-center gap-3 text-blue-800">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-xl font-bold">Frecuencia de Visitas</div>
                  <div className="text-sm font-normal text-gray-600">
                    Análisis de recurrencia de pacientes
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                  <Select value={generoFilterVisitas} onValueChange={setGeneroFilterVisitas}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Femenino">Femenino</SelectItem>
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => setShowVisitasEditor(true)}>
                    <Settings className="h-4 w-4 mr-1" /> Editar rangos
                  </Button>
                </div>
              </div>
              
              {frecuenciaVisitasData.some(d => d.total > 0) ? (
                <div className="h-80">
                  <Bar 
                    key={`visitas-chart-${dateFrom}-${dateTo}-${generoFilterVisitas}-${frecuenciaVisitasData.map(d => d.total).join('-')}`}
                    data={visitasChartData} 
                    options={chartOptions} 
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-80 text-gray-500">
                  No hay datos para mostrar
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Gráficos secundarios */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 3. Distribución por Edad y Género */}
          <Card className="rounded-3xl border-purple-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
              <CardTitle className="flex items-center gap-3 text-purple-800">
                <div className="p-2 rounded-lg bg-purple-100">
                  <UserCheck className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-xl font-bold">Distribución por Edad y Género</div>
                  <div className="text-sm font-normal text-gray-600">
                    Análisis demográfico combinado
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div></div>
                <Button variant="outline" size="sm" onClick={() => setShowGeneroEdadEditor(true)}>
                  <Settings className="h-4 w-4 mr-1" /> Editar rangos
                </Button>
              </div>
              
              {generoEdadData.length > 0 ? (
                <div className="h-80">
                  <Bar 
                    key={`genero-chart-${dateFrom}-${dateTo}-${generoEdadRanges.map(r => `${r.min}-${r.max}`).join('-')}-${generoEdadData.map(d => d.total).join('-')}`}
                    data={generoChartData} 
                    options={{...chartOptions, plugins: {...chartOptions.plugins, legend: {...chartOptions.plugins.legend, position: 'bottom' as const}}}} 
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-80 text-gray-500">
                  No hay datos para mostrar
                </div>
              )}
            </CardContent>
          </Card>

          {/* 4. Distribución Geográfica */}
          <Card className="rounded-3xl border-orange-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50 border-b border-orange-100">
              <CardTitle className="flex items-center gap-3 text-orange-800">
                <div className="p-2 rounded-lg bg-orange-100">
                  <MapPin className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-xl font-bold">Distribución Geográfica</div>
                  <div className="text-sm font-normal text-gray-600">
                    Análisis por ubicación de pacientes
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                  <Select value={generoFilterGeografia} onValueChange={setGeneroFilterGeografia}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Femenino">Femenino</SelectItem>
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    value={maxCiudades}
                    onChange={(e) => setMaxCiudades(parseInt(e.target.value) || 10)}
                    className="w-20"
                    min="1"
                    max="50"
                  />
                </div>
              </div>
              
              {geografiaData.length > 0 ? (
                <div className="h-80">
                  <Bar 
                    key={`geografia-chart-${dateFrom}-${dateTo}-${generoFilterGeografia}-${maxCiudades}-${geografiaData.map(d => d.total).join('-')}`}
                    data={geografiaChartData} 
                    options={chartOptions} 
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-80 text-gray-500">
                  No hay datos para mostrar
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Editores de rangos */}
        {showEdadEditor && (
          <RangeEditor
            title="Editar Rangos de Edad"
            ranges={edadRanges}
            onRangesChange={setEdadRanges}
            onClose={() => setShowEdadEditor(false)}
          />
        )}

        {showVisitasEditor && (
          <RangeEditor
            title="Editar Rangos de Visitas"
            ranges={visitasRanges}
            onRangesChange={setVisitasRanges}
            onClose={() => setShowVisitasEditor(false)}
          />
        )}

        {showGeneroEdadEditor && (
          <RangeEditor
            title="Editar Rangos de Edad y Género"
            ranges={generoEdadRanges}
            onRangesChange={setGeneroEdadRanges}
            onClose={() => setShowGeneroEdadEditor(false)}
            maxRanges={3}
          />
        )}
      </Fragment>
    </div>
  )
}
