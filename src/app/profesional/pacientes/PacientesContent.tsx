'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AppointmentStatus } from '@prisma/client'
import { Calendar, Search, Loader2, AlertCircle, CheckCircle2, Stethoscope, Pill, FlaskRound, UserCircle2 } from 'lucide-react'
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
  telefono?: string | null
  celular?: string | null
  email?: string | null
  direccion?: string | null
  ciudad?: string | null
  provincia?: string | null
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
  motivo: string | null
  observaciones: string | null
  estado: AppointmentStatus
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

const HISTORY_PAGE_SIZE = 10

const formatDateTime = (value: string) => {
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

const calculateAge = (birthDate?: string) => {
  if (!birthDate) return '-'
  const date = new Date(birthDate)
  if (Number.isNaN(date.getTime())) return '-'
  const diff = Date.now() - date.getTime()
  const ageDate = new Date(diff)
  return Math.abs(ageDate.getUTCFullYear() - 1970)
}

export default function PacientesContent() {
  const [searchTerm, setSearchTerm] = useState('')
  const [searching, setSearching] = useState(false)
  const [patients, setPatients] = useState<PatientOption[]>([])
  const [recentPatients, setRecentPatients] = useState<PatientOption[]>([])
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(null)
  const [appointments, setAppointments] = useState<AppointmentHistory[]>([])
  const [totalAppointments, setTotalAppointments] = useState(0)
  const [historyPage, setHistoryPage] = useState(1)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [medications, setMedications] = useState<PatientMedication[]>([])
  const [onlyMine, setOnlyMine] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState>(null)

  const totalPages = Math.max(1, Math.ceil(totalAppointments / HISTORY_PAGE_SIZE))
  const startItem = totalAppointments === 0 ? 0 : (historyPage - 1) * HISTORY_PAGE_SIZE + 1
  const endItem = totalAppointments === 0 ? 0 : Math.min(totalAppointments, startItem + appointments.length - 1)

  useEffect(() => {
    const loadRecentPatients = async () => {
      try {
        const response = await fetch('/api/professional/appointments?limit=50')
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'No se pudieron obtener consultas recientes')
        }
        const seen = new Map<string, PatientOption>()
        data.appointments.forEach((appointment: { paciente: PatientOption }) => {
          const patient = appointment.paciente
          if (patient && !seen.has(patient.id)) {
            seen.set(patient.id, patient)
          }
        })
        setRecentPatients(Array.from(seen.values()).slice(0, 9))
      } catch (error) {
        console.error(error)
      }
    }

    loadRecentPatients()
  }, [])

  const fetchPatientHistory = async ({
    patient,
    page = 1,
    append = false,
  }: {
    patient: PatientOption
    page?: number
    append?: boolean
  }) => {
    try {
      setLoadingHistory(true)
      const params = new URLSearchParams({
        limit: String(HISTORY_PAGE_SIZE),
        page: String(page),
      })
      if (onlyMine) {
        params.set('onlyMine', 'true')
      }
      const response = await fetch(`/api/professional/patients/${patient.id}/history?${params.toString()}`)
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo obtener la historia clínica')
      }
      setSelectedPatient(patient)
      setHistoryPage(typeof data.page === 'number' ? data.page : page)
      setTotalAppointments(data.totalAppointments)
      setAppointments((prev) => (append ? [...prev, ...data.appointments] : data.appointments))
      setMedications(data.medications)
      setFeedback({ type: 'success', message: `Historia actualizada (${data.totalAppointments} turnos)` })
    } catch (error) {
      console.error(error)
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Error al cargar la historia clínica' })
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const term = searchTerm.trim()
    if (term.length < 2) {
      setFeedback({ type: 'error', message: 'Ingresa al menos 2 caracteres para buscar' })
      return
    }

    try {
      setSearching(true)
      const response = await fetch(`/api/professional/patients/search?term=${encodeURIComponent(term)}&limit=18`)
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

  const handleSelectPatient = (patient: PatientOption) => {
    setSearchTerm('')
    setPatients([])
    fetchPatientHistory({ patient, page: 1 })
  }

  const handleClearSelected = () => {
    setSelectedPatient(null)
    setAppointments([])
    setMedications([])
    setTotalAppointments(0)
    setHistoryPage(1)
  }

  const handlePageChange = (nextPage: number) => {
    if (!selectedPatient) return
    const safePage = Math.max(1, Math.min(totalPages, nextPage))
    fetchPatientHistory({ patient: selectedPatient, page: safePage })
  }

  const handleLoadMoreAppointments = () => {
    if (!selectedPatient) return
    if (appointments.length >= totalAppointments) return
    const nextPage = historyPage + 1
    fetchPatientHistory({ patient: selectedPatient, page: nextPage, append: true })
  }

  useEffect(() => {
    if (selectedPatient) {
      fetchPatientHistory({ patient: selectedPatient, page: 1 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyMine])

  const patientContact = useMemo(() => {
    if (!selectedPatient) return null
    const entries: Array<{ label: string; value?: string | null }> = [
      { label: 'DNI', value: selectedPatient.dni },
      { label: 'Género', value: selectedPatient.genero },
      { label: 'Edad', value: `${calculateAge(selectedPatient.fechaNacimiento)} años` },
      { label: 'Teléfono', value: selectedPatient.telefono || selectedPatient.celular },
      { label: 'Email', value: selectedPatient.email },
      { label: 'Dirección', value: selectedPatient.direccion },
      { label: 'Ciudad', value: selectedPatient.ciudad },
      { label: 'Provincia', value: selectedPatient.provincia },
    ]
    return entries.filter((entry) => entry.value && entry.value.length > 0)
  }, [selectedPatient])

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-lg shadow-sm p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Pacientes</h1>
          <p className="text-sm text-gray-600">Explora la ficha completa de tus pacientes y accede a su historia clínica, medicación y órdenes registradas.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/profesional/consultas">
            <Button variant="outline">Ir a consultas</Button>
          </Link>
          <Link href="/profesional/historias-clinicas">
            <Button variant="outline">Ver historias clínicas</Button>
          </Link>
        </div>
      </div>

      {feedback && (
        <Alert variant={feedback.type === 'error' ? 'destructive' : 'default'}>
          {feedback.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
          <AlertDescription>{feedback.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="bg-white border rounded-lg shadow-sm p-6 space-y-5">
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">Buscar paciente</h2>
            </div>
            <div className="relative">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Nombre, apellido o DNI"
                className="pl-9"
              />
            </div>
            <Button type="submit" disabled={searching} className="w-full bg-emerald-600 hover:bg-emerald-700">
              {searching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Buscando...
                </>
              ) : (
                'Buscar'
              )}
            </Button>
          </form>

          {patients.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Resultados</div>
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                {patients.map((patient) => (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => handleSelectPatient(patient)}
                    className={`border rounded-lg p-3 text-left transition ${selectedPatient?.id === patient.id ? 'border-sky-500 bg-sky-50/50' : 'hover:border-sky-300'}`}
                  >
                    <div className="font-semibold text-gray-900 text-sm">
                      {patient.apellido}, {patient.nombre}
                    </div>
                    <div className="text-xs text-gray-500">DNI: {patient.dni}</div>
                    <div className="text-xs text-gray-500">Edad: {calculateAge(patient.fechaNacimiento)} años</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <UserCircle2 className="h-4 w-4 text-sky-600" />
              <h3 className="text-sm font-semibold text-gray-900">Pacientes recientes</h3>
            </div>
            {recentPatients.length === 0 ? (
              <p className="text-xs text-gray-500">No hay pacientes recientes para mostrar aún.</p>
            ) : (
              <div className="grid gap-2">
                {recentPatients.map((patient) => (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => handleSelectPatient(patient)}
                    className={`border rounded-lg p-3 text-left transition ${selectedPatient?.id === patient.id ? 'border-sky-500 bg-sky-50/50' : 'hover:border-sky-300'}`}
                  >
                    <div className="font-semibold text-gray-900 text-sm">
                      {patient.apellido}, {patient.nombre}
                    </div>
                    <div className="text-xs text-gray-500">DNI: {patient.dni}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          {!selectedPatient ? (
            <div className="bg-white border rounded-lg shadow-sm p-10 text-center text-gray-500 text-sm">
              Seleccioná un paciente para visualizar su ficha completa.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="bg-white border rounded-lg shadow-sm p-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {selectedPatient.apellido}, {selectedPatient.nombre}
                  </div>
                  <div className="text-sm text-gray-600 space-x-2">
                    <span>DNI: {selectedPatient.dni}</span>
                    <span>•</span>
                    <span>{calculateAge(selectedPatient.fechaNacimiento)} años</span>
                    <span>•</span>
                    <span>{selectedPatient.genero}</span>
                  </div>
                  {patientContact && patientContact.length > 0 && (
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {patientContact.map((entry) => (
                        <div key={entry.label} className="text-xs text-gray-600">
                          <span className="font-semibold text-gray-800">{entry.label}:</span> {entry.value}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 text-sm">
                  <Button variant="outline" size="sm" onClick={handleClearSelected}>
                    Limpiar selección
                  </Button>
                  <Link href="/profesional/consultas" className="text-sky-600 hover:underline text-xs">
                    Gestionar turno actual »
                  </Link>
                  <Link href="/profesional/historias-clinicas" className="text-sky-600 hover:underline text-xs">
                    Historia clínica completa »
                  </Link>
                  <Button
                    variant={onlyMine ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setOnlyMine((prev) => !prev)}
                    className={onlyMine ? 'bg-sky-600 hover:bg-sky-700 text-white' : ''}
                  >
                    {onlyMine ? 'Viendo solo mis consultas' : 'Mostrar solo mis consultas'}
                  </Button>
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <div className="bg-white border rounded-lg shadow-sm">
                  <div className="px-6 py-4 border-b flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Turnos registrados</h3>
                    <Badge variant="outline" className="text-xs">{totalAppointments} turno(s)</Badge>
                  </div>
                  {loadingHistory ? (
                    <div className="py-8 text-center text-sm text-gray-500">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" /> Cargando historia clínica...
                    </div>
                  ) : appointments.length === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-500">
                      No hay turnos registrados aún para este paciente.
                    </div>
                  ) : (
                    <div className="divide-y">
                      {appointments.map((appointment) => (
                        <div key={appointment.id} className="px-6 py-4 space-y-3 text-sm text-gray-700">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-gray-600 flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4" /> {formatDateTime(appointment.fecha)}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Profesional: {appointment.profesional.apellido ? `${appointment.profesional.apellido}, ${appointment.profesional.name ?? ''}`.trim() : appointment.profesional.email}
                              </div>
                              {appointment.motivo && (
                                <div className="text-gray-700 mt-1">Motivo: {appointment.motivo}</div>
                              )}
                              {appointment.observaciones && (
                                <div className="text-gray-600 mt-1">Observaciones: {appointment.observaciones}</div>
                              )}
                              {appointment.obraSocial && (
                                <div className="text-xs text-gray-500 mt-1">Obra social: {appointment.obraSocial.nombre}</div>
                              )}
                            </div>
                            <Badge className="bg-sky-100 text-sky-700">{STATUS_LABELS[appointment.estado]}</Badge>
                          </div>

                          {appointment.diagnoses.length > 0 && (
                            <div className="bg-emerald-50 rounded-md p-3 space-y-1">
                              <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold uppercase"><Stethoscope className="h-4 w-4" /> Diagnósticos</div>
                              {appointment.diagnoses.map((diagnosis) => (
                                <div key={diagnosis.id} className="text-gray-700">
                                  <div className="font-semibold text-gray-900">{diagnosis.principal}</div>
                                  {diagnosis.secundarios.length > 0 && (
                                    <div className="text-xs text-gray-600">Secundarios: {diagnosis.secundarios.join('; ')}</div>
                                  )}
                                  {diagnosis.notas && (
                                    <div className="text-xs text-gray-600">Notas: {diagnosis.notas}</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {appointment.prescriptions.length > 0 && (
                            <div className="bg-sky-50 rounded-md p-3 space-y-1">
                              <div className="flex items-center gap-2 text-sky-700 text-xs font-semibold uppercase"><Pill className="h-4 w-4" /> Recetas</div>
                              {appointment.prescriptions.map((prescription) => (
                                <div key={prescription.id} className="space-y-1">
                                  <div className="text-xs text-gray-500">Emitida el {formatDateTime(prescription.createdAt)}</div>
                                  {prescription.items.map((item) => (
                                    <div key={item.id} className="text-xs text-gray-700 bg-white border border-sky-100 rounded p-2">
                                      <span className="font-semibold text-gray-900">{item.medicamento}</span>
                                      <div>Dosis: {item.dosis}</div>
                                      <div>Frecuencia: {item.frecuencia}</div>
                                      <div>Duración: {item.duracion}</div>
                                      {item.indicaciones && <div className="text-gray-600 mt-1">{item.indicaciones}</div>}
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          )}

                          {appointment.studyOrders.length > 0 && (
                            <div className="bg-purple-50 rounded-md p-3 space-y-1">
                              <div className="flex items-center gap-2 text-purple-700 text-xs font-semibold uppercase"><FlaskRound className="h-4 w-4" /> Estudios</div>
                              {appointment.studyOrders.map((order) => (
                                <div key={order.id} className="space-y-1">
                                  <div className="text-xs text-gray-500">Solicitado el {formatDateTime(order.createdAt)}</div>
                                  {order.items.map((item) => (
                                    <div key={item.id} className="text-xs text-gray-700 bg-white border border-purple-100 rounded p-2">
                                      <span className="font-semibold text-gray-900">{item.estudio}</span>
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
                          disabled={historyPage <= 1}
                          onClick={() => handlePageChange(historyPage - 1)}
                        >
                          Anterior
                        </Button>
                        <span className="text-xs text-gray-500">Página {historyPage} de {totalPages}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={historyPage >= totalPages}
                          onClick={() => handlePageChange(historyPage + 1)}
                        >
                          Siguiente
                        </Button>
                      </div>
                      {appointments.length < totalAppointments && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleLoadMoreAppointments}
                        >
                          Cargar más turnos
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-white border rounded-lg shadow-sm">
                  <div className="px-6 py-4 border-b flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Medicaciones habituales</h3>
                    <Badge variant="outline" className="text-xs">{medications.length} registro(s)</Badge>
                  </div>
                  {medications.length === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-500">
                      No hay medicación habitual registrada para este paciente.
                    </div>
                  ) : (
                    <div className="divide-y">
                      {medications.map((medication) => (
                        <div key={medication.id} className="px-6 py-4 space-y-1 text-sm text-gray-700">
                          <div className="flex items-center justify-between">
                            <div className="text-base font-semibold text-gray-900">{medication.nombre}</div>
                            <Badge className={medication.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}>
                              {medication.activo ? 'Activa' : 'Suspendida'}
                            </Badge>
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
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
