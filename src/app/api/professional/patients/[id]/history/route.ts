import { NextRequest, NextResponse } from 'next/server'
import { AppointmentStatus } from '@prisma/client'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const querySchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  status: z.nativeEnum(AppointmentStatus).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
  page: z.coerce.number().min(1).optional(),
  onlyMine: z.coerce.boolean().optional(),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!user.roles.includes('PROFESIONAL')) {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 })
    }

    const { id: patientId } = await params

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
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
        direccion: true,
        ciudad: true,
        provincia: true,
        codigoPostal: true,
      },
    })

    if (!patient) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 })
    }

    const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Parámetros inválidos'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const { dateFrom, dateTo, status, limit = 20, offset, page, onlyMine } = parsed.data

    const computedOffset = typeof offset === 'number'
      ? offset
      : page
        ? (page - 1) * limit
        : 0

    const appointmentWhere: Record<string, unknown> = {
      pacienteId: patientId,
    }

    if (onlyMine) {
      appointmentWhere.profesionalId = user.id
    }

    if (dateFrom || dateTo) {
      appointmentWhere.fecha = {}
      if (dateFrom) {
        ;(appointmentWhere.fecha as Record<string, Date>).gte = new Date(dateFrom)
      }
      if (dateTo) {
        const toDate = new Date(dateTo)
        toDate.setHours(23, 59, 59, 999)
        ;(appointmentWhere.fecha as Record<string, Date>).lte = toDate
      }
    }

    if (status) {
      appointmentWhere.estado = status
    }

    const appointments = await prisma.appointment.findMany({
      where: appointmentWhere,
      orderBy: { fecha: 'desc' },
      include: {
        profesional: {
          select: {
            id: true,
            name: true,
            apellido: true,
            email: true,
          },
        },
        obraSocial: {
          select: {
            id: true,
            nombre: true,
          },
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
      skip: computedOffset,
      take: limit,
    })

    const totalAppointments = await prisma.appointment.count({ where: appointmentWhere })

    const medications = await prisma.patientMedication.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      patient,
      appointments,
      medications,
      totalAppointments,
      page: typeof page === 'number' ? page : Math.floor(computedOffset / limit) + 1,
      pageSize: limit,
    })
  } catch (error) {
    console.error('[API][professional][patients][history] error:', error)
    return NextResponse.json({ error: 'Error al obtener la historia clínica' }, { status: 500 })
  }
}
