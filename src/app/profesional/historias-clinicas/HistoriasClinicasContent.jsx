'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { AppointmentStatus } from '@prisma/client'
import { Search, History as HistoryIcon, Calendar, AlertCircle, CheckCircle2, Loader2, Pill, FlaskRound, Stethoscope, ClipboardCheck, User, Phone, Mail, MapPin, RefreshCw, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { DatePicker } from '@/components/ui/date-picker'
import { APPOINTMENT_STATUS_META, getStatusLabel } from '@/lib/appointment-status'

const DEFAULT_PAGE_SIZE = 4

const formatDate = (value) => {
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

const formatToInputDate = (date) =>
  date ? date.toISOString().split('T')[0] : ''

const calculateAge = (birthDate) => {
  if (!birthDate) return '-'
  const date = new Date(birthDate)
  if (Number.isNaN(date.getTime())) return '-'
  const diff = Date.now() - date.getTime()
  const ageDate = new Date(diff)
  return Math.abs(ageDate.getUTCFullYear() - 1970)
}

export default function HistoriasClinicasContent() {
  // Estado para controlar qué vista mostrar
  const [currentView, setCurrentView] = useState('search')
  
  const [searchTerm, setSearchTerm] = useState('')
  const [searching, setSearching] = useState(false)
  const [patients, setPatients] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [medications, setMedications] = useState([])
  const [totalAppointments, setTotalAppointments] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(DEFAULT_PAGE_SIZE)
  const [recentPatients, setRecentPatients] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', status: '' })
  const [feedback, setFeedback] = useState(null)

  const searchParams = useSearchParams()
  const router = useRouter()
  const initialPatientHandledRef = useRef(null)

  const totalPages = Math.max(1, Math.ceil(totalAppointments / pageSize))
  const startItem = totalAppointments === 0 ? 0 : (page - 1) * pageSize + 1
  const endItem = totalAppointments === 0 ? 0 : Math.min(totalAppointments, startItem + appointments.length - 1)

  const dateFromValue = filters.dateFrom ? new Date(filters.dateFrom) : undefined
  const dateToValue = filters.dateTo ? new Date(filters.dateTo) : undefined

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

    const professionals = new Set()
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

  const setPatientQueryParam = (patientId) => {
    const params = new URLSearchParams(searchParams.toString())
    if (patientId) {
      params.set('patientId', patientId)
    } else {
      params.delete('patientId')
    }
    const newUrl = `${window.location.pathname}?${params.toString()}`
    router.replace(newUrl)
  }

  const fetchHistory = useCallback(
    async ({
      patient,
      patientId,
      requestedFilters,
      requestedPage,
      context,
    }) => {
      const targetPatient = patient || selectedPatient
      const targetPatientId = patientId || targetPatient?.id

      if (!targetPatientId) return

      setLoadingHistory(true)
      setFeedback(null)

      try {
        const params = new URLSearchParams({
          patientId: targetPatientId,
          page: requestedPage.toString(),
          pageSize: pageSize.toString(),
        })

        if (requestedFilters.dateFrom) params.append('dateFrom', requestedFilters.dateFrom)
        if (requestedFilters.dateTo) params.append('dateTo', requestedFilters.dateTo)
        if (requestedFilters.status) params.append('status', requestedFilters.status)

        const response = await fetch(`/api/appointments/history?${params}`)
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()

        if (patient && context === 'search') {
          setSelectedPatient(patient)
          setPatientQueryParam(patient.id)
        }

        setAppointments(data.appointments || [])
        setMedications(data.medications || [])
        setTotalAppointments(data.total || 0)
        setPage(requestedPage)
        setFilters(requestedFilters)

        if (context === 'search') {
          setFeedback({
            type: 'success',
            message: `Historia clínica cargada: ${data.total || 0} consulta${data.total === 1 ? '' : 's'} encontrada${data.total === 1 ? '' : 's'}`,
          })
        }
      } catch (error) {
        console.error('Error fetching patient history:', error)
        setFeedback({
          type: 'error',
          message: 'Error al cargar la historia clínica. Por favor, intenta nuevamente.',
        })
      } finally {
        setLoadingHistory(false)
      }
    },
    [selectedPatient, pageSize, router, searchParams]
  )

  const handleSearch = async (event) => {
    event.preventDefault()
    if (!searchTerm.trim()) return

    setSearching(true)
    setFeedback(null)
    setPatients([])

    try {
      const response = await fetch(`/api/patients/search?q=${encodeURIComponent(searchTerm.trim())}`)
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setPatients(data.patients || [])

      if (data.patients && data.patients.length === 0) {
        setFeedback({
          type: 'error',
          message: 'No se encontraron pacientes con los criterios de búsqueda.',
        })
      }
    } catch (error) {
      console.error('Error searching patients:', error)
      setFeedback({
        type: 'error',
        message: 'Error al buscar pacientes. Por favor, intenta nuevamente.',
      })
      setPatients([])
    } finally {
      setSearching(false)
    }
  }

  useEffect(() => {
    const fetchRecentPatients = async () => {
      try {
        const response = await fetch('/api/patients/recent')
        if (response.ok) {
          const data = await response.json()
          setRecentPatients(data.patients || [])
        }
      } catch (error) {
        console.error('Error fetching recent patients:', error)
      }
    }

    fetchRecentPatients()
  }, [])

  useEffect(() => {
    const patientIdParam = searchParams.get('patientId')
    if (patientIdParam && patientIdParam !== initialPatientHandledRef.current && !selectedPatient) {
      initialPatientHandledRef.current = patientIdParam
      const baseFilters = { dateFrom: '', dateTo: '', status: '' }
      setCurrentView('history')
      fetchHistory({ patientId: patientIdParam, requestedFilters: baseFilters, requestedPage: 1, context: 'initial' })
    }
  }, [fetchHistory, searchParams, selectedPatient])

  const handleSelectPatient = (patient) => {
    const baseFilters = { dateFrom: '', dateTo: '', status: '' }
    setPage(1)
    setCurrentView('history')
    fetchHistory({ patient, requestedFilters: baseFilters, requestedPage: 1, context: 'search' })
  }

  const handleFiltersChange = (nextFilters) => {
    setFilters(nextFilters)
    if (selectedPatient) {
      setPage(1)
      fetchHistory({ patient: selectedPatient, requestedFilters: nextFilters, requestedPage: 1, context: 'filters' })
    }
  }

  const handlePageChange = (nextPage) => {
    if (!selectedPatient) return
    const safePage = Math.max(1, Math.min(totalPages, nextPage))
    fetchHistory({ patient: selectedPatient, requestedFilters: filters, requestedPage: safePage, context: 'pagination' })
  }

  const handleBackToSearch = useCallback(() => {
    // Limpiar todos los estados de una vez
    setCurrentView('search')
    setSelectedPatient(null)
    setAppointments([])
    setMedications([])
    setTotalAppointments(0)
    setPage(1)
    setFilters({ dateFrom: '', dateTo: '', status: '' })
    setPatientQueryParam(null)
    setFeedback(null)
  }, [])

  // Componente para la vista de búsqueda de pacientes
  const SearchView = () => (
    <div className="space-y-8">
      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-8 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Historias clínicas</h1>
            <p className="text-lg text-gray-600">Busca y accede a las historias clínicas de tus pacientes</p>
          </div>
          <Link href="/profesional/consultas">
            <Button className="bg-sky-600 hover:bg-sky-700 px-6 py-3 text-base font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all">Gestionar desde consultas</Button>
          </Link>
        </div>
      </section>

      {feedback && (
        <Alert variant={feedback.type === 'success' ? 'default' : 'destructive'} className="rounded-2xl border-0 shadow-lg">
          <AlertDescription className="flex items-center gap-2">
            {feedback.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
            <span>{feedback.message}</span>
          </AlertDescription>
        </Alert>
      )}

      {/* Buscador principal */}
      <section className="rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-3xl mb-6">
            <HistoryIcon className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Buscar paciente</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">Ingresa el nombre, apellido o DNI del paciente para acceder a su historia clínica completa</p>
        </div>

        <form onSubmit={handleSearch} className="space-y-6 max-w-lg mx-auto">
          <div className="relative">
            <Search className="h-6 w-6 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Nombre, apellido o DNI"
              className="pl-12 pr-4 py-4 text-lg rounded-2xl border-2 border-gray-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all"
            />
          </div>
          <Button 
            type="submit" 
            disabled={searching} 
            className="w-full bg-emerald-600 hover:bg-emerald-700 py-4 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all"
          >
            {searching ? (
              <>
                <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Search className="h-6 w-6 mr-3" />
                Buscar paciente
              </>
            )}
          </Button>
        </form>
      </section>

      {/* Resultados de búsqueda */}
      {patients.length > 0 && (
        <section className="rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Pacientes encontrados</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {patients.map((patient) => (
                  <button
                    type="button"
                    key={patient.id}
                    onClick={() => handleSelectPatient(patient)}
                    className="border rounded-lg p-4 text-left transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-emerald-100 rounded-full">
                        <User className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900">
                          {patient.apellido}, {patient.nombre}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">DNI: {patient.dni}</div>
                        <div className="text-sm text-gray-500">
                          Edad: {calculateAge(patient.fechaNacimiento)} años • {patient.genero}
                        </div>
                        {patient.telefono && (
                          <div className="text-xs text-gray-400 mt-1">
                            <Phone className="h-3 w-3 inline mr-1" />
                            {patient.telefono}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
            </div>
        </section>
      )}

      {/* Pacientes recientes */}
      {recentPatients.length > 0 && patients.length === 0 && (
        <section className="rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Pacientes recientes</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recentPatients.map((patient) => (
                  <button
                    type="button"
                    key={patient.id}
                    onClick={() => handleSelectPatient(patient)}
                    className="border rounded-lg p-4 text-left transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-100 rounded-full">
                        <User className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900">
                          {patient.apellido}, {patient.nombre}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">DNI: {patient.dni}</div>
                        <div className="text-sm text-gray-500">
                          Edad: {calculateAge(patient.fechaNacimiento)} años • {patient.genero}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
            </div>
        </section>
      )}
    </div>
  )

  // Componente para la vista de historia clínica
  const HistoryView = () => {
    // Si no hay paciente seleccionado, no renderizar nada
    if (!selectedPatient || !selectedPatient.id) {
      return null
    }

    return (
      <div className="space-y-8">
        {/* Header */}
        <section className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-8 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-6">
              <Button
                variant="outline"
                size="lg"
                onClick={handleBackToSearch}
                className="text-sky-700 hover:text-sky-900 border-sky-200 hover:border-sky-300 px-6 py-3 rounded-2xl font-semibold shadow-sm hover:shadow-md transition-all"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Volver al buscador
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Historia clínica - {selectedPatient?.apellido}, {selectedPatient?.nombre}
                </h1>
                <p className="text-lg text-gray-600">Turnos previos, diagnósticos, recetas y estudios</p>
              </div>
            </div>
            <Link href="/profesional/consultas">
              <Button className="bg-sky-600 hover:bg-sky-700 px-6 py-3 text-base font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all">Gestionar desde consultas</Button>
            </Link>
          </div>
        </section>


        {feedback && (
          <Alert variant={feedback.type === 'success' ? 'default' : 'destructive'} className="rounded-2xl border-0 shadow-lg">
            <AlertDescription className="flex items-center gap-2">
              {feedback.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
              <span>{feedback.message}</span>
            </AlertDescription>
          </Alert>
        )}

          {selectedPatient && (
            <>
            {/* Información del paciente */}
            <section className="rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-emerald-100 rounded-full">
                    <User className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {selectedPatient.apellido}, {selectedPatient.nombre}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
                          <div>
                            <span className="text-gray-500">DNI:</span>
                            <span className="ml-2 font-medium">{selectedPatient.dni}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Edad:</span>
                            <span className="ml-2 font-medium">{calculateAge(selectedPatient.fechaNacimiento)} años</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Género:</span>
                            <span className="ml-2 font-medium">{selectedPatient.genero}</span>
                          </div>
                          {selectedPatient.telefono && (
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 text-gray-400 mr-2" />
                              <span>{selectedPatient.telefono}</span>
                            </div>
                          )}
                          {selectedPatient.email && (
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 text-gray-400 mr-2" />
                              <span>{selectedPatient.email}</span>
                            </div>
                          )}
                          {selectedPatient.direccion && (
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                              <span>{selectedPatient.direccion}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => fetchHistory({ patient: selectedPatient, requestedFilters: filters, requestedPage: page, context: 'refresh' })}
                          disabled={loadingHistory}
                          className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Actualizar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
            </section>

            {/* Filtros */}
            <section className="rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Filtrar historial
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fecha desde</label>
                    <DatePicker
                      selected={dateFromValue}
                      onSelect={(date) => handleFiltersChange({ ...filters, dateFrom: formatToInputDate(date) })}
                      placeholder="Seleccionar fecha"
                      maxDate={new Date()}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fecha hasta</label>
                    <DatePicker
                      selected={dateToValue}
                      onSelect={(date) => handleFiltersChange({ ...filters, dateTo: formatToInputDate(date) })}
                      placeholder="Seleccionar fecha"
                      minDate={dateFromValue}
                      maxDate={new Date()}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estado del turno</label>
                    <select
                      value={filters.status}
                      onChange={(e) => handleFiltersChange({ ...filters, status: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="">Todos los estados</option>
                      {Object.values(AppointmentStatus).map((status) => (
                        <option key={status} value={status}>
                          {getStatusLabel(status)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
            </section>

              {/* Resumen estadístico */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: 'Total consultas', value: summary.totalAppointments, icon: Calendar },
                  { label: 'Profesionales', value: summary.uniqueProfessionals, icon: User },
                  { label: 'Diagnósticos', value: summary.totalDiagnoses, icon: ClipboardCheck },
                  { label: 'Recetas', value: summary.totalPrescriptions, icon: Pill },
                  { label: 'Estudios', value: summary.totalStudies, icon: FlaskRound },
                  { label: 'Medicación activa', value: summary.medicationActive, icon: Stethoscope },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="bg-white border rounded-lg shadow-sm p-4 text-center">
                    <Icon className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{value}</div>
                    <div className="text-xs text-gray-600">{label}</div>
                  </div>
                ))}
              </div>

            {/* Historial de citas */}
            <section className="rounded-3xl border border-emerald-100 bg-white shadow-sm">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <HistoryIcon className="h-5 w-5" />
                      Historial de consultas
                    </h4>
                    <div className="text-sm text-gray-600">
                      {totalAppointments > 0 ? `Mostrando ${startItem}-${endItem} de ${totalAppointments}` : 'Sin registros'}
                    </div>
                  </div>
                </div>
                
                {loadingHistory ? (
                  <div className="p-8 text-center">
                    <Loader2 className="h-8 w-8 text-emerald-600 mx-auto mb-4 animate-spin" />
                    <h5 className="text-lg font-semibold text-gray-900 mb-2">Cargando historia clínica</h5>
                    <p className="text-gray-600">Obteniendo los datos del paciente...</p>
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="p-8 text-center">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h5 className="text-lg font-semibold text-gray-900 mb-2">Sin historial</h5>
                    <p className="text-gray-600">No se encontraron consultas para este paciente con los filtros aplicados.</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {appointments.map((appointment) => (
                      <div key={appointment.id} className="p-6 hover:bg-gray-50">
                        <div className="flex items-start gap-4">
                          <div className="p-2 bg-sky-100 rounded-full">
                            <Calendar className="h-5 w-5 text-sky-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-3 mb-2">
                                  <h5 className="text-base font-semibold text-gray-900">
                                    Consulta del {formatDate(appointment.fecha)}
                                  </h5>
                                  <Badge
                                    variant="secondary"
                                    className={`text-xs ${APPOINTMENT_STATUS_META[appointment.estado].color}`}
                                  >
                                    {getStatusLabel(appointment.estado)}
                                  </Badge>
                                </div>
                                <div className="space-y-1 text-sm text-gray-600">
                                  {appointment.profesional && (
                                    <div>
                                      <span className="font-medium">Profesional:</span> {appointment.profesional.name} {appointment.profesional.apellido}
                                    </div>
                                  )}
                                  {appointment.obraSocial && (
                                    <div>
                                      <span className="font-medium">Obra social:</span> {appointment.obraSocial.nombre}
                                    </div>
                                  )}
                                  {appointment.motivo && (
                                    <div>
                                      <span className="font-medium">Motivo:</span> {appointment.motivo}
                                    </div>
                                  )}
                                  {appointment.observaciones && (
                                    <div>
                                      <span className="font-medium">Observaciones:</span> {appointment.observaciones}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Diagnósticos */}
                            {appointment.diagnoses?.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-gray-100">
                                <h6 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                  <ClipboardCheck className="h-4 w-4" />
                                  Diagnósticos ({appointment.diagnoses.length})
                                </h6>
                                <div className="space-y-2">
                                  {appointment.diagnoses.map((diagnosis) => (
                                    <div key={diagnosis.id} className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                      <div className="text-sm">
                                        <div className="font-medium text-amber-800">Principal: {diagnosis.principal}</div>
                                        {diagnosis.secundarios?.length > 0 && (
                                          <div className="text-amber-700 mt-1">
                                            Secundarios: {diagnosis.secundarios.join(', ')}
                                          </div>
                                        )}
                                        {diagnosis.notas && (
                                          <div className="text-amber-600 text-xs mt-2">
                                            Notas: {diagnosis.notas}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Recetas */}
                            {appointment.prescriptions?.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-gray-100">
                                <h6 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                  <Pill className="h-4 w-4" />
                                  Recetas ({appointment.prescriptions.length})
                                </h6>
                                <div className="space-y-2">
                                  {appointment.prescriptions.map((prescription) => (
                                    <div key={prescription.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                                      <div className="text-xs text-green-600 mb-1">
                                        Recetado el {formatDate(prescription.createdAt)}
                                      </div>
                                      <div className="space-y-1">
                                        {prescription.items?.map((item) => (
                                          <div key={item.id} className="text-sm">
                                            <div className="font-medium text-green-800">{item.medicamento}</div>
                                            <div className="text-green-700 text-xs">
                                              {item.dosis} • {item.frecuencia} • {item.duracion}
                                              {item.indicaciones && (
                                                <span className="block mt-1">Indicaciones: {item.indicaciones}</span>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Órdenes de estudios */}
                            {appointment.studyOrders?.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-gray-100">
                                <h6 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                  <FlaskRound className="h-4 w-4" />
                                  Órdenes de estudios ({appointment.studyOrders.length})
                                </h6>
                                <div className="space-y-2">
                                  {appointment.studyOrders.map((studyOrder) => (
                                    <div key={studyOrder.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                      <div className="text-xs text-blue-600 mb-1">
                                        Ordenado el {formatDate(studyOrder.createdAt)}
                                      </div>
                                      <div className="space-y-1">
                                        {studyOrder.items?.map((item) => (
                                          <div key={item.id} className="text-sm">
                                            <div className="font-medium text-blue-800">{item.estudio}</div>
                                            {item.indicaciones && (
                                              <div className="text-blue-700 text-xs">
                                                Indicaciones: {item.indicaciones}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Paginación */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Página {page} de {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => handlePageChange(page - 1)}
                      >
                        Anterior
                      </Button>
                      <Button
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
            </section>

            {/* Enlaces rápidos */}
            <section className="rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Acciones rápidas</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <Button
                    asChild
                    size="lg"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Link href="/profesional/consultas">
                      <Stethoscope className="h-5 w-5 mr-2" />
                      Nueva consulta
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="border-sky-300 text-sky-700 hover:bg-sky-50"
                  >
                    <Link href={`/profesional/consultas?patientId=${selectedPatient.id}`}>
                      <Calendar className="h-5 w-5 mr-2" />
                      Consultas del paciente
                    </Link>
                  </Button>
                </div>
            </section>
            </>
          )}
      </div>
    )
  }

  // Si estamos en vista de historia pero no hay paciente seleccionado, volver a búsqueda
  if (currentView === 'history' && !selectedPatient) {
    return <SearchView />
  }

  return currentView === 'search' ? <SearchView /> : <HistoryView />
}
