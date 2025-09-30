'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ElementType } from 'react'
import Link from 'next/link'
import { AppointmentStatus } from '@prisma/client'
import { Search, History as HistoryIcon, Calendar, AlertCircle, CheckCircle2, Loader2, Pill, FlaskRound, Stethoscope, BarChart3, ClipboardCheck, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

interface PatientOption {
  id: string
  nombre: string
  apellido: string
  dni: string
  fechaNacimiento: string
  genero: string
}

interface Diagnosis {
  id: string
  principal: string
  secundarios: string[]
  notas: string | null
  createdAt: string
}

interface PrescriptionItem {
  id: string
  medicamento: string
  dosis: string
  frecuencia: string
  duracion: string
  indicaciones: string | null
}

interface Prescription {
  id: string
  createdAt: string
  items: PrescriptionItem[]
}

interface StudyOrderItem {
  id: string
  estudio: string
  indicaciones: string | null
}

interface StudyOrder {
  id: string
  createdAt: string
  items: StudyOrderItem[]
}

interface AppointmentHistory {
  id: string
  fecha: string
  estado: AppointmentStatus
  motivo: string | null
  observaciones: string | null
  obraSocial: { nombre: string } | null
  profesional: {
    id: string
    name: string | null
    apellido: string | null
    email: string
  }
  diagnoses: Diagnosis[]
  prescriptions: Prescription[]
  studyOrders: StudyOrder[]
}

interface PatientMedication {
  id: string
  nombre: string
  dosis: string | null
  frecuencia: string | null
  viaAdministracion: string | null
  activo: boolean
  fechaInicio: string | null
  fechaFin: string | null
  indicaciones: string | null
}

type FeedbackState = { type: 'success' | 'error'; message: string } | null

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  PROGRAMADO: 'Programado',
  CONFIRMADO: 'Confirmado',
  EN_SALA_DE_ESPERA: 'En sala de espera',
  COMPLETADO: 'Completado',
  CANCELADO: 'Cancelado',
  NO_ASISTIO: 'No asistió',
}

const DEFAULT_PAGE_SIZE = 10

const formatDate = (value: string) => {
  try {
    return new Date(value).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

export default function HistoriasClinicasContent() {
  const [searchTerm, setSearchTerm] = useState('')
  const [searching, setSearching] = useState(false)
  const [patients, setPatients] = useState<PatientOption[]>([])
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(null)
  const [appointments, setAppointments] = useState<AppointmentHistory[]>([])
  const [medications, setMedications] = useState<PatientMedication[]>([])
  const [totalAppointments, setTotalAppointments] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(DEFAULT_PAGE_SIZE)
  const [recentPatients, setRecentPatients] = useState<PatientOption[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', status: '' })
  const [feedback, setFeedback] = useState<FeedbackState>(null)

  const totalPages = Math.max(1, Math.ceil(totalAppointments / pageSize))
  const startItem = totalAppointments === 0 ? 0 : (page - 1) * pageSize + 1
  const endItem = totalAppointments === 0 ? 0 : Math.min(totalAppointments, startItem + appointments.length - 1)

  const summary = useMemo(() => {
    if (!appointments.length) {
      return {
        totalAppointments: 0,
        uniqueProfessionals: 0,
        totalDiagnoses: 0,
        totalPrescriptions: 0,
        totalStudies: 0,
        medicationActive: medications.filter((med) => med.activo).length,
      }
    }

    const professionals = new Set<string>()
    let diagnoses = 0
    let prescriptions = 0
    let studies = 0

    appointments.forEach((appointment) => {
      if (appointment.profesional?.id) {
        professionals.add(appointment.profesional.id)
      }
      diagnoses += appointment.diagnoses.length
      prescriptions += appointment.prescriptions.length
      studies += appointment.studyOrders.length
    })

    return {
      totalAppointments,
      uniqueProfessionals: professionals.size,
      totalDiagnoses: diagnoses,
      totalPrescriptions: prescriptions,
      totalStudies: studies,
      medicationActive: medications.filter((med) => med.activo).length,
    }
  }, [appointments, medications, totalAppointments])

  const statusSummary = useMemo(() => {
    const base = Object.values(AppointmentStatus).reduce<Record<AppointmentStatus, number>>((acc, status) => {
      acc[status] = 0
      return acc
    }, {
      PROGRAMADO: 0,
      CONFIRMADO: 0,
      EN_SALA_DE_ESPERA: 0,
      COMPLETADO: 0,
      CANCELADO: 0,
      NO_ASISTIO: 0,
    })

    appointments.forEach((appointment) => {
      base[appointment.estado] += 1
    })

    return base
  }, [appointments])

  const recentDiagnoses = useMemo(() => {
    return appointments
      .flatMap((appointment) => appointment.diagnoses.map((diagnosis) => ({
        id: diagnosis.id,
        principal: diagnosis.principal,
        createdAt: diagnosis.createdAt,
        professional: appointment.profesional,
      })))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  }, [appointments])

  const recentStudies = useMemo(() => {
    return appointments
      .flatMap((appointment) => appointment.studyOrders.map((order) => ({
        id: order.id,
        createdAt: order.createdAt,
        items: order.items,
        professional: appointment.profesional,
      })))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  }, [appointments])

  useEffect(() => {
    const loadRecentPatients = async () => {
      try {
        const response = await fetch(`/api/professional/appointments?limit=20`)
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'No se pudieron obtener consultas recientes')
        }
        const seen = new Set<string>()
        const uniquePatients: PatientOption[] = []
        data.appointments.forEach((appointment: { paciente: PatientOption }) => {
          const patient = appointment.paciente
          if (patient && !seen.has(patient.id)) {
            seen.add(patient.id)
            uniquePatients.push(patient)
          }
        })
        setRecentPatients(uniquePatients.slice(0, 6))
      } catch (error) {
        console.error(error)
      }
    }

    loadRecentPatients()
  }, [])

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const term = searchTerm.trim()
    if (term.length < 2) {
      setFeedback({ type: 'error', message: 'Ingresa al menos 2 caracteres para buscar' })
      return
    }

    try {
      setSearching(true)
      const response = await fetch(`/api/professional/patients/search?term=${encodeURIComponent(term)}`)
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo realizar la búsqueda')
      }
      setPatients(data.patients)
      if (data.patients.length === 0) {
        setFeedback({ type: 'error', message: 'No se encontraron pacientes con ese criterio' })
      } else {
        setFeedback(null)
      }
    } catch (error) {
      console.error(error)
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Error al buscar pacientes' })
    } finally {
      setSearching(false)
    }
  }

  const fetchHistory = async ({
    patient,
    requestedFilters = filters,
    requestedPage = 1,
    context,
  }: {
    patient: PatientOption
    requestedFilters?: typeof filters
    requestedPage?: number
    context?: 'search' | 'filters' | 'pagination' | 'refresh'
  }) => {
    try {
      setLoadingHistory(true)
      const params = new URLSearchParams()
      if (requestedFilters.dateFrom) params.set('dateFrom', requestedFilters.dateFrom)
      if (requestedFilters.dateTo) params.set('dateTo', requestedFilters.dateTo)
      if (requestedFilters.status) params.set('status', requestedFilters.status as AppointmentStatus)
      params.set('limit', String(pageSize))
      params.set('page', String(requestedPage))

      const response = await fetch(`/api/professional/patients/${patient.id}/history?${params.toString()}`)
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo obtener la historia clínica')
      }

      setSelectedPatient(patient)
      setFilters(requestedFilters)
      setAppointments(data.appointments)
      setMedications(data.medications)
      setTotalAppointments(data.totalAppointments)
      if (typeof data.page === 'number') {
        setPage(data.page)
      } else {
        setPage(requestedPage)
      }

      if (context === 'search') {
        setFeedback({ type: 'success', message: `Historia clínica cargada (${data.totalAppointments} turno(s))` })
      } else if (context === 'filters') {
        setFeedback({ type: 'success', message: 'Filtros aplicados correctamente' })
      } else if (context === 'refresh') {
        setFeedback({ type: 'success', message: 'Historia actualizada' })
      }
    } catch (error) {
      console.error(error)
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Error al cargar la historia clínica' })
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleSelectPatient = (patient: PatientOption) => {
    const baseFilters = { dateFrom: '', dateTo: '', status: '' }
    setPage(1)
    fetchHistory({ patient, requestedFilters: baseFilters, requestedPage: 1, context: 'search' })
  }

  const handleFiltersChange = (nextFilters: typeof filters) => {
    setFilters(nextFilters)
    if (selectedPatient) {
      setPage(1)
      fetchHistory({ patient: selectedPatient, requestedFilters: nextFilters, requestedPage: 1, context: 'filters' })
    }
  }

  const handlePageChange = (nextPage: number) => {
    if (!selectedPatient) return
    const safePage = Math.max(1, Math.min(totalPages, nextPage))
    fetchHistory({ patient: selectedPatient, requestedFilters: filters, requestedPage: safePage, context: 'pagination' })
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-lg shadow-sm p-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Historia clínica</h1>
          <p className="text-sm text-gray-600">Consulta turnos previos, diagnósticos, recetas y estudios de tus pacientes</p>
        </div>
        <Link href="/profesional/consultas">
          <Button className="bg-sky-600 hover:bg-sky-700">Gestionar desde consultas</Button>
        </Link>
      </div>

      {feedback && (
        <Alert variant={feedback.type === 'error' ? 'destructive' : 'default'}>
          {feedback.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600" />} 
          <AlertDescription>{feedback.message}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSearch} className="bg-white border rounded-lg shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Search className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Buscar paciente</h2>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Nombre, apellido o DNI"
              className="pl-9"
            />
          </div>
          <Button type="submit" disabled={searching} className="bg-emerald-600 hover:bg-emerald-700">
            {searching ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Buscando...
              </>
            ) : (
              'Buscar'
            )}
          </Button>
        </div>
        {patients.length > 0 && (
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {patients.map((patient) => (
              <button
                type="button"
                key={patient.id}
                onClick={() => handleSelectPatient(patient)}
                className={`border rounded-lg p-3 text-left transition ${selectedPatient?.id === patient.id ? 'border-sky-500 bg-sky-50/50' : 'hover:border-sky-300'}`}
              >
                <div className="text-sm font-semibold text-gray-900">
                  {patient.apellido}, {patient.nombre}
                </div>
                <div className="text-xs text-gray-500 mt-1">DNI: {patient.dni}</div>
                <div className="text-xs text-gray-500">Edad: {new Date().getFullYear() - new Date(patient.fechaNacimiento).getFullYear()} años</div>
              </button>
            ))}
          </div>
        )}
      </form>

      {!selectedPatient && (
        <div className="bg-white border rounded-lg shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <HistoryIcon className="h-5 w-5 text-sky-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Pacientes atendidos recientemente</h3>
              <p className="text-sm text-gray-600">Selecciona un paciente para abrir su historia clínica completa</p>
            </div>
          </div>
          {recentPatients.length === 0 ? (
            <div className="text-sm text-gray-500">
              No hay consultas recientes para mostrar. Una vez que atiendas pacientes, aparecerán aquí para acceso rápido.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {recentPatients.map((patient) => (
                <button
                  key={patient.id}
                  type="button"
                  onClick={() => handleSelectPatient(patient)}
                  className="border rounded-lg p-3 text-left hover:border-sky-300 transition"
                >
                  <div className="text-sm font-semibold text-gray-900">
                    {patient.apellido}, {patient.nombre}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">DNI: {patient.dni}</div>
                  <div className="text-xs text-gray-500">Edad: {new Date().getFullYear() - new Date(patient.fechaNacimiento).getFullYear()} años</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedPatient && (
        <div className="space-y-4">
          <div className="bg-white border rounded-lg shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2">
              <HistoryIcon className="h-5 w-5 text-sky-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Historia de {selectedPatient.apellido}, {selectedPatient.nombre}</h3>
                <p className="text-sm text-gray-600">DNI: {selectedPatient.dni} • Género: {selectedPatient.genero}</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-gray-600 font-semibold">Desde</label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(event) => handleFiltersChange({ ...filters, dateFrom: event.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-gray-600 font-semibold">Hasta</label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(event) => handleFiltersChange({ ...filters, dateTo: event.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-gray-600 font-semibold">Estado del turno</label>
                <select
                  value={filters.status}
                  onChange={(event) => handleFiltersChange({ ...filters, status: event.target.value })}
                  className="border rounded-md px-3 py-2 text-sm w-full"
                >
                  <option value="">Todos</option>
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard icon={HistoryIcon} label="Consultas registradas" value={summary.totalAppointments} accent="bg-sky-100 text-sky-700" />
            <SummaryCard icon={User} label="Profesionales que atendieron" value={summary.uniqueProfessionals} accent="bg-emerald-100 text-emerald-700" />
            <SummaryCard icon={Stethoscope} label="Diagnósticos cargados" value={summary.totalDiagnoses} accent="bg-purple-100 text-purple-700" />
            <SummaryCard icon={Pill} label="Recetas emitidas" value={summary.totalPrescriptions} accent="bg-rose-100 text-rose-700" />
            <SummaryCard icon={FlaskRound} label="Órdenes de estudio" value={summary.totalStudies} accent="bg-orange-100 text-orange-700" />
            <SummaryCard icon={ClipboardCheck} label="Medicaciones activas" value={summary.medicationActive} accent="bg-emerald-100 text-emerald-700" />
          </div>

          {appointments.length > 0 && (
            <div className="flex flex-wrap gap-2 text-xs">
              {Object.entries(statusSummary).map(([status, count]) => (
                count > 0 ? (
                  <Badge key={status} variant="outline" className="bg-gray-50">
                    {STATUS_LABELS[status as AppointmentStatus]} • {count}
                  </Badge>
                ) : null
              ))}
            </div>
          )}

          <div className="bg-white border rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Turnos registrados</h3>
              <span className="text-sm text-gray-500">{totalAppointments} turno(s)</span>
            </div>
            {loadingHistory ? (
              <div className="py-8 text-center text-sm text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" /> Cargando historia clínica...
              </div>
            ) : appointments.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                No hay turnos registrados con los filtros seleccionados
              </div>
            ) : (
              <div className="divide-y">
                {appointments.map((appointment) => (
                  <div key={appointment.id} className="px-6 py-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm text-gray-600 flex items-center gap-2">
                          <Calendar className="h-4 w-4" /> {formatDate(appointment.fecha)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Profesional: {appointment.profesional.apellido ? `${appointment.profesional.apellido}, ${appointment.profesional.name ?? ''}`.trim() : appointment.profesional.email}
                        </div>
                        {appointment.motivo && (
                          <div className="text-sm text-gray-700 mt-1">Motivo: {appointment.motivo}</div>
                        )}
                        {appointment.observaciones && (
                          <div className="text-sm text-gray-600 mt-1">Observaciones: {appointment.observaciones}</div>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-sky-700 bg-sky-100 px-2 py-1 rounded-full">
                        {STATUS_LABELS[appointment.estado]}
                      </span>
                    </div>

                    {appointment.obraSocial && (
                      <div className="text-xs text-gray-500">Obra social: {appointment.obraSocial.nombre}</div>
                    )}

                    {appointment.diagnoses.length > 0 && (
                      <div className="bg-emerald-50 rounded-lg p-4 space-y-2">
                        <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
                          <Stethoscope className="h-4 w-4" /> Diagnósticos
                        </div>
                        {appointment.diagnoses.map((diagnosis) => (
                          <div key={diagnosis.id} className="text-sm text-gray-700">
                            <div className="font-semibold text-gray-900">{diagnosis.principal}</div>
                            {diagnosis.secundarios.length > 0 && (
                              <div className="text-gray-600">Secundarios: {diagnosis.secundarios.join('; ')}</div>
                            )}
                            {diagnosis.notas && (
                              <div className="text-gray-600">Notas: {diagnosis.notas}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {appointment.prescriptions.length > 0 && (
                      <div className="bg-sky-50 rounded-lg p-4 space-y-2">
                        <div className="flex items-center gap-2 text-sky-700 font-semibold text-sm">
                          <Pill className="h-4 w-4" /> Recetas
                        </div>
                        {appointment.prescriptions.map((prescription) => (
                          <div key={prescription.id} className="text-sm text-gray-700 space-y-1">
                            <div className="text-xs text-gray-500">Emitida el {formatDate(prescription.createdAt)}</div>
                            {prescription.items.map((item) => (
                              <div key={item.id} className="bg-white border border-sky-100 rounded-md p-3">
                                <div className="font-semibold text-gray-900">{item.medicamento}</div>
                                <div>Dosis: {item.dosis} • Frecuencia: {item.frecuencia} • Duración: {item.duracion}</div>
                                {item.indicaciones && <div className="text-gray-600 mt-1">{item.indicaciones}</div>}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}

                    {appointment.studyOrders.length > 0 && (
                      <div className="bg-purple-50 rounded-lg p-4 space-y-2">
                        <div className="flex items-center gap-2 text-purple-700 font-semibold text-sm">
                          <FlaskRound className="h-4 w-4" /> Estudios indicados
                        </div>
                        {appointment.studyOrders.map((order) => (
                          <div key={order.id} className="text-sm text-gray-700 space-y-2">
                            <div className="text-xs text-gray-500">Solicitado el {formatDate(order.createdAt)}</div>
                            {order.items.map((item) => (
                              <div key={item.id} className="bg-white border border-purple-100 rounded-md p-3">
                                <div className="font-semibold text-gray-900">{item.estudio}</div>
                                {item.indicaciones && <div className="text-gray-600 mt-1">{item.indicaciones}</div>}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {!loadingHistory && totalAppointments > 0 && (
              <div className="px-6 py-4 border-t flex flex-col gap-2 text-sm text-gray-600">
                <div>
                  Mostrando {startItem}-{endItem} de {totalAppointments} turno(s)
                </div>
                <div className="flex items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => handlePageChange(page - 1)}
                  >
                    Anterior
                  </Button>
                  <span className="text-xs text-gray-500">Página {page} de {totalPages}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => handlePageChange(page + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-5 xl:grid-cols-[3fr_2fr]">
            <div className="bg-white border rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Medicaciones habituales</h3>
                <span className="text-sm text-gray-500">{medications.length} registro(s)</span>
              </div>
              {medications.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  No hay medicación habitual registrada
                </div>
              ) : (
                <div className="divide-y">
                  {medications.map((medication) => (
                    <div key={medication.id} className="px-6 py-4 space-y-2 text-sm text-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="text-base font-semibold text-gray-900">{medication.nombre}</div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${medication.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                          {medication.activo ? 'Activa' : 'Suspendida'}
                        </span>
                      </div>
                      {medication.dosis && <div>Dosis: {medication.dosis}</div>}
                      {medication.frecuencia && <div>Frecuencia: {medication.frecuencia}</div>}
                      {medication.viaAdministracion && <div>Vía: {medication.viaAdministracion}</div>}
                      {medication.fechaInicio && <div>Inicio: {new Date(medication.fechaInicio).toLocaleDateString('es-AR')}</div>}
                      {medication.fechaFin && <div>Fin: {new Date(medication.fechaFin).toLocaleDateString('es-AR')}</div>}
                      {medication.indicaciones && <div className="text-gray-600">{medication.indicaciones}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-5">
              <div className="bg-white border rounded-lg shadow-sm">
                <div className="px-5 py-3 border-b flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Stethoscope className="h-4 w-4 text-emerald-600" /> Últimos diagnósticos
                </div>
                {recentDiagnoses.length === 0 ? (
                  <div className="py-4 text-xs text-gray-500 text-center">Sin diagnósticos registrados.</div>
                ) : (
                  <div className="divide-y text-sm">
                    {recentDiagnoses.map((diagnosis) => (
                      <div key={diagnosis.id} className="px-5 py-3 space-y-1">
                        <div className="font-semibold text-gray-900">{diagnosis.principal}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                          <Calendar className="h-3 w-3" /> {formatDate(diagnosis.createdAt)}
                        </div>
                        {diagnosis.professional && (
                          <div className="text-xs text-gray-500">
                            Profesional: {diagnosis.professional.apellido ? `${diagnosis.professional.apellido}, ${diagnosis.professional.name ?? ''}`.trim() : diagnosis.professional.email}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white border rounded-lg shadow-sm">
                <div className="px-5 py-3 border-b flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <BarChart3 className="h-4 w-4 text-purple-600" /> Órdenes recientes
                </div>
                {recentStudies.length === 0 ? (
                  <div className="py-4 text-xs text-gray-500 text-center">Sin órdenes de estudio registradas.</div>
                ) : (
                  <div className="divide-y text-sm">
                    {recentStudies.map((order) => (
                      <div key={order.id} className="px-5 py-3 space-y-1">
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                          <Calendar className="h-3 w-3" /> {formatDate(order.createdAt)}
                        </div>
                        {order.professional && (
                          <div className="text-xs text-gray-500">
                            Profesional: {order.professional.apellido ? `${order.professional.apellido}, ${order.professional.name ?? ''}`.trim() : order.professional.email}
                          </div>
                        )}
                        <ul className="text-xs text-gray-700 space-y-1">
                          {order.items.map((item) => (
                            <li key={item.id} className="bg-purple-50 border border-purple-100 rounded px-2 py-1">
                              <span className="font-semibold text-purple-800">{item.estudio}</span>
                              {item.indicaciones && <div className="text-purple-700">{item.indicaciones}</div>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

type SummaryCardProps = {
  icon: ElementType
  label: string
  value: number
  accent: string
}

function SummaryCard({ icon: Icon, label, value, accent }: SummaryCardProps) {
  const formattedValue = Number.isFinite(value) ? value.toLocaleString('es-AR') : '0'

  return (
    <div className="bg-white border rounded-lg shadow-sm p-4 flex items-center gap-3">
      <div className={`p-3 rounded-lg ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold">{label}</div>
        <div className="text-2xl font-semibold text-gray-900">{formattedValue}</div>
      </div>
    </div>
  )
}
