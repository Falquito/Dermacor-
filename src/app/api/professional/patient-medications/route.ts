import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const createMedicationSchema = z.object({
  patientId: z.string().min(1, 'El paciente es obligatorio'),
  nombre: z.string().trim().min(2, 'El nombre del medicamento es obligatorio'),
  dosis: z.string().optional(),
  frecuencia: z.string().optional(),
  viaAdministracion: z.string().optional(),
  fechaInicio: z.string().optional(),
  indicaciones: z.string().optional(),
  activo: z.boolean().optional(),
})

const querySchema = z.object({
  patientId: z.string().min(1),
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
  page: z.coerce.number().min(1).optional(),
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
      return NextResponse.json({ error: 'Debe indicar un paciente' }, { status: 400 })
    }

    const { patientId, limit = 20, offset, page } = parsed.data

    const computedOffset = typeof offset === 'number'
      ? offset
      : page
        ? (page - 1) * limit
        : 0

    const medications = await prisma.patientMedication.findMany({
      where: {
        patientId,
      },
      orderBy: { createdAt: 'desc' },
      skip: computedOffset,
      take: limit,
    })

    const total = await prisma.patientMedication.count({ where: { patientId } })

    return NextResponse.json({
      medications,
      total,
      page: typeof page === 'number' ? page : Math.floor(computedOffset / limit) + 1,
      pageSize: limit,
    })
  } catch (error) {
    console.error('[API][professional][patient-medications][GET] error:', error)
    return NextResponse.json({ error: 'Error al obtener la medicación del paciente' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!user.roles.includes('PROFESIONAL')) {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = createMedicationSchema.safeParse(body)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Datos inválidos'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const { patientId, nombre, dosis, frecuencia, viaAdministracion, fechaInicio, indicaciones, activo } = parsed.data

    const patient = await prisma.patient.findUnique({ where: { id: patientId }, select: { id: true } })
    if (!patient) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 })
    }

    const medication = await prisma.patientMedication.create({
      data: {
        patientId,
        professionalId: user.id,
        nombre: nombre.trim(),
        dosis: dosis?.trim() || null,
        frecuencia: frecuencia?.trim() || null,
        viaAdministracion: viaAdministracion?.trim() || null,
        fechaInicio: fechaInicio ? new Date(fechaInicio) : null,
        indicaciones: indicaciones?.trim() || null,
        activo: activo ?? true,
      },
    })

    return NextResponse.json({
      success: true,
      medication,
      message: 'Medicamento registrado en la historia clínica',
    })
  } catch (error) {
    console.error('[API][professional][patient-medications][POST] error:', error)
    return NextResponse.json({ error: 'Error al registrar la medicación' }, { status: 500 })
  }
}
