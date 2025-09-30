import { NextRequest, NextResponse } from 'next/server'
import { AppointmentStatus } from '@prisma/client'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const querySchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  status: z.nativeEnum(AppointmentStatus).optional(),
  patient: z.string().optional(),
  patientId: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
  page: z.coerce.number().min(1).optional(),
  sort: z.enum(['fecha_desc', 'fecha_asc']).optional(),
  onlyMine: z.coerce.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!user.roles.includes('PROFESIONAL')) {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 })
    }

    const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Parámetros inválidos'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const {
      dateFrom,
      dateTo,
      status,
      patient,
      patientId,
      limit = 20,
      offset,
      page,
      sort = 'fecha_desc',
      onlyMine = true,
    } = parsed.data

    const computedOffset = typeof offset === 'number'
      ? offset
      : page
        ? (page - 1) * limit
        : 0

    const where: Record<string, unknown> = {}

    if (onlyMine) {
      where.profesionalId = user.id
    }

    if (dateFrom || dateTo) {
      where.fecha = {}
      if (dateFrom) {
        ;(where.fecha as Record<string, Date>).gte = new Date(dateFrom)
      }
      if (dateTo) {
        const toDate = new Date(dateTo)
        toDate.setHours(23, 59, 59, 999)
        ;(where.fecha as Record<string, Date>).lte = toDate
      }
    }

    if (status) {
      where.estado = status
    }

    if (patientId) {
      where.pacienteId = patientId
    } else if (patient) {
      const searchTerm = patient.trim()
      if (searchTerm.length > 0) {
        where.OR = [
          { paciente: { nombre: { contains: searchTerm, mode: 'insensitive' } } },
          { paciente: { apellido: { contains: searchTerm, mode: 'insensitive' } } },
          { paciente: { dni: { contains: searchTerm } } },
        ]
      }
    }

    const orderBy = sort === 'fecha_asc'
      ? { fecha: 'asc' as const }
      : { fecha: 'desc' as const }

    const [appointments, total] = await prisma.$transaction([
      prisma.appointment.findMany({
        where,
        include: {
          paciente: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              dni: true,
              fechaNacimiento: true,
              genero: true,
              telefono: true,
              celular: true,
              email: true,
            },
          },
          obraSocial: {
            select: { id: true, nombre: true },
          },
          diagnoses: {
            orderBy: { createdAt: 'desc' },
          },
          prescriptions: {
            orderBy: { createdAt: 'desc' },
            include: {
              items: true,
              diagnoses: {
                include: {
                  diagnosis: true,
                },
              },
            },
          },
          studyOrders: {
            orderBy: { createdAt: 'desc' },
            include: {
              items: true,
            },
          },
        },
        orderBy,
        skip: computedOffset,
        take: limit,
      }),
      prisma.appointment.count({ where }),
    ])

    return NextResponse.json({
      appointments,
      total,
      page: typeof page === 'number' ? page : Math.floor(computedOffset / limit) + 1,
      pageSize: limit,
    })
  } catch (error) {
    console.error('[API][professional][appointments] error:', error)
    return NextResponse.json({ error: 'Error interno al obtener las consultas' }, { status: 500 })
  }
}
