import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const createDiagnosisSchema = z.object({
  appointmentId: z.string().min(1, 'El turno es obligatorio'),
  principal: z.string().trim().min(3, 'El diagnóstico principal es obligatorio'),
  secundarios: z.array(z.string().trim().min(3)).optional(),
  notas: z.string().optional(),
})

const querySchema = z.object({
  appointmentId: z.string().optional(),
  patientId: z.string().optional(),
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

    const { appointmentId, patientId } = parsed.data

    if (!appointmentId && !patientId) {
      return NextResponse.json({ error: 'Debe indicar un turno o paciente' }, { status: 400 })
    }

    const diagnoses = await prisma.diagnosis.findMany({
      where: {
        professionalId: user.id,
        ...(appointmentId ? { appointmentId } : {}),
        ...(patientId ? { patientId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ diagnoses })
  } catch (error) {
    console.error('[API][professional][diagnoses][GET] error:', error)
    return NextResponse.json({ error: 'Error al obtener diagnósticos' }, { status: 500 })
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
    const parsed = createDiagnosisSchema.safeParse(body)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Datos inválidos'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const { appointmentId, principal, secundarios, notas } = parsed.data

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { id: true, profesionalId: true, pacienteId: true },
    })

    if (!appointment || appointment.profesionalId !== user.id) {
      return NextResponse.json({ error: 'No se encontró el turno o no pertenece al profesional' }, { status: 404 })
    }

    const cleanedSecondaries = (secundarios ?? [])
      .map((value) => value.trim())
      .filter((value, index, array) => value.length > 0 && array.indexOf(value) === index)

    const diagnosis = await prisma.diagnosis.create({
      data: {
        appointmentId,
        patientId: appointment.pacienteId,
        professionalId: user.id,
        principal: principal.trim(),
        secundarios: cleanedSecondaries,
        notas: notas?.trim() || null,
      },
    })

    return NextResponse.json({
      success: true,
      diagnosis,
      message: 'Diagnóstico registrado con éxito',
    })
  } catch (error) {
    console.error('[API][professional][diagnoses][POST] error:', error)
    return NextResponse.json({ error: 'Error al registrar el diagnóstico' }, { status: 500 })
  }
}
