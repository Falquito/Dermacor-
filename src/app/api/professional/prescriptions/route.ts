import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const medicationSchema = z.object({
  medicamento: z.string().trim().min(2, 'Ingrese el nombre del fármaco'),
  dosis: z.string().trim().min(1, 'La dosis es obligatoria'),
  frecuencia: z.string().trim().min(1, 'La frecuencia es obligatoria'),
  duracion: z.string().trim().min(1, 'La duración es obligatoria'),
  indicaciones: z.string().optional(),
})

const createPrescriptionSchema = z.object({
  appointmentId: z.string().min(1, 'El turno es obligatorio'),
  diagnosisIds: z.array(z.string().min(1)).min(1, 'Debe seleccionar al menos un diagnóstico'),
  items: z.array(medicationSchema).min(1, 'Debe agregar al menos un medicamento'),
  notas: z.string().optional(),
})

const querySchema = z.object({
  appointmentId: z.string().optional(),
  patientId: z.string().optional(),
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
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
    }

    const { appointmentId, patientId, limit = 20, offset, page } = parsed.data

    const computedOffset = typeof offset === 'number'
      ? offset
      : page
        ? (page - 1) * limit
        : 0

    const prescriptions = await prisma.prescription.findMany({
      where: {
        professionalId: user.id,
        ...(appointmentId ? { appointmentId } : {}),
        ...(patientId ? { patientId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        diagnoses: {
          include: {
            diagnosis: true,
          },
        },
      },
      skip: computedOffset,
      take: limit,
    })

    const total = await prisma.prescription.count({
      where: {
        professionalId: user.id,
        ...(appointmentId ? { appointmentId } : {}),
        ...(patientId ? { patientId } : {}),
      },
    })

    return NextResponse.json({
      prescriptions,
      total,
      page: typeof page === 'number' ? page : Math.floor(computedOffset / limit) + 1,
      pageSize: limit,
    })
  } catch (error) {
    console.error('[API][professional][prescriptions][GET] error:', error)
    return NextResponse.json({ error: 'Error al obtener las prescripciones' }, { status: 500 })
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
    const parsed = createPrescriptionSchema.safeParse(body)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Datos inválidos'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const { appointmentId, diagnosisIds, items, notas } = parsed.data

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { id: true, profesionalId: true, pacienteId: true },
    })

    if (!appointment || appointment.profesionalId !== user.id) {
      return NextResponse.json({ error: 'No se encontró el turno o no pertenece al profesional' }, { status: 404 })
    }

    const diagnoses = await prisma.diagnosis.findMany({
      where: {
        id: { in: diagnosisIds },
        appointmentId,
        professionalId: user.id,
      },
      select: { id: true },
    })

    if (diagnoses.length !== diagnosisIds.length) {
      return NextResponse.json({ error: 'Los diagnósticos seleccionados no son válidos' }, { status: 400 })
    }

    const prescription = await prisma.prescription.create({
      data: {
        appointmentId,
        patientId: appointment.pacienteId,
        professionalId: user.id,
        notas: notas?.trim() || null,
        items: {
          create: items.map((item) => ({
            medicamento: item.medicamento.trim(),
            dosis: item.dosis.trim(),
            frecuencia: item.frecuencia.trim(),
            duracion: item.duracion.trim(),
            indicaciones: item.indicaciones?.trim() || null,
          })),
        },
        diagnoses: {
          create: diagnoses.map((diagnosis) => ({ diagnosisId: diagnosis.id })),
        },
      },
      include: {
        items: true,
        diagnoses: {
          include: {
            diagnosis: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      prescription,
      message: 'Receta registrada',
    })
  } catch (error) {
    console.error('[API][professional][prescriptions][POST] error:', error)
    return NextResponse.json({ error: 'Error al registrar la receta' }, { status: 500 })
  }
}
