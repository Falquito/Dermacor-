// app/api/reportes/appointment-status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

interface RequestBody {
  startDate: string
  endDate: string
  especialidad?: string | null
  obraSocial?: string | null
}

interface ProfessionalStats {
  professionalId: string
  name: string
  count: number
}

interface AppointmentStatusResponse {
  totals: Record<'COMPLETADO' | 'CANCELADO' | 'NO_ASISTIO', number>
  perProfessional: Record<'COMPLETADO' | 'CANCELADO' | 'NO_ASISTIO', ProfessionalStats[]>
  totalAppointments: number
  ausentismoRate: number
  filtros: {
    startDate: string
    endDate: string
    especialidad: string | null
    obraSocial: string | null
  }
}

type StatusKey = 'COMPLETADO' | 'CANCELADO' | 'NO_ASISTIO'

const VALID_STATUSES: StatusKey[] = ['COMPLETADO', 'CANCELADO', 'NO_ASISTIO']

function initializeTotals(): Record<StatusKey, number> {
  return {
    COMPLETADO: 0,
    CANCELADO: 0,
    NO_ASISTIO: 0,
  }
}

function initializePerProfessional(): Record<StatusKey, ProfessionalStats[]> {
  return {
    COMPLETADO: [],
    CANCELADO: [],
    NO_ASISTIO: [],
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<AppointmentStatusResponse | { error: string }>> {
  try {
    const body: RequestBody = await request.json()
    const {
      startDate,
      endDate,
      especialidad,
      obraSocial,
    } = body

    // Validar fechas
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate y endDate son requeridos' },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    // Construir filtro where con tipos de Prisma
    const whereClause: Prisma.AppointmentWhereInput = {
      fecha: {
        gte: start,
        lte: end,
      },
      estado: {
        in: VALID_STATUSES,
      },
    }

    // Filtro por especialidad si se proporciona
    if (especialidad) {
      whereClause.profesional = {
        especialidad: {
          nombre: especialidad,
        },
      }
    }

    // Filtro por obra social si se proporciona
    if (obraSocial) {
      whereClause.obraSocial = {
        nombre: obraSocial,
      }
    }

    // Obtener todas las citas que cumplen los filtros
    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        profesional: {
          include: {
            especialidad: true,
          },
        },
        obraSocial: true,
        paciente: true,
      },
    })

    // Calcular totales y desglose por profesional
    const totals = initializeTotals()
    const professionalCounts: Record<StatusKey, Record<string, { name: string; count: number }>> = {
      COMPLETADO: {},
      CANCELADO: {},
      NO_ASISTIO: {},
    }

    // Procesar citas
    appointments.forEach((apt) => {
      const estado = apt.estado as StatusKey

      if (VALID_STATUSES.includes(estado)) {
        totals[estado]++

        // Contar por profesional
        const profId = apt.profesionalId
        const profName = apt.profesional.name || 'Desconocido'

        if (!professionalCounts[estado][profId]) {
          professionalCounts[estado][profId] = {
            name: profName,
            count: 0,
          }
        }
        professionalCounts[estado][profId].count++
      }
    })

    // Convertir mapas a arrays y ordenar por count descendente
    const perProfessional = initializePerProfessional()

    VALID_STATUSES.forEach((estado) => {
      perProfessional[estado] = Object.entries(
        professionalCounts[estado]
      ).map(([id, data]) => ({
        professionalId: id,
        name: data.name,
        count: data.count,
      }))
      perProfessional[estado].sort((a, b) => b.count - a.count)
    })

    // Calcular total de citas
    const totalAppointments =
      totals.COMPLETADO + totals.CANCELADO + totals.NO_ASISTIO

    // Calcular tasa de ausentismo
    // Ausentismo = NO_ASISTIO / (COMPLETADO + NO_ASISTIO) * 100
    const citasConAsistencia = totals.COMPLETADO + totals.NO_ASISTIO
    const ausentismoRate =
      citasConAsistencia > 0
        ? (totals.NO_ASISTIO / citasConAsistencia) * 100
        : 0

    const response: AppointmentStatusResponse = {
      totals,
      perProfessional,
      totalAppointments,
      ausentismoRate: parseFloat(ausentismoRate.toFixed(2)),
      filtros: {
        startDate,
        endDate,
        especialidad: especialidad || null,
        obraSocial: obraSocial || null,
      },
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Error en appointment-status:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}