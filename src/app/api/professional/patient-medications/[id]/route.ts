import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const updateMedicationSchema = z.object({
  activo: z.boolean().optional(),
  fechaFin: z.string().optional(),
  indicaciones: z.string().optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!user.roles.includes('PROFESIONAL')) {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const parsed = updateMedicationSchema.safeParse(body)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Datos inválidos'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const medication = await prisma.patientMedication.findUnique({
      where: { id },
    })

    if (!medication) {
      return NextResponse.json({ error: 'Medicamento no encontrado' }, { status: 404 })
    }

    if (medication.professionalId !== user.id) {
      return NextResponse.json({ error: 'No tienes permisos para modificar este registro' }, { status: 403 })
    }

    const data: Record<string, unknown> = {}

    if (parsed.data.activo !== undefined) {
      data.activo = parsed.data.activo
      if (!parsed.data.activo && !parsed.data.fechaFin) {
        data.fechaFin = new Date()
      }
    }

    if (parsed.data.fechaFin) {
      data.fechaFin = new Date(parsed.data.fechaFin)
    }

    if (parsed.data.indicaciones !== undefined) {
      data.indicaciones = parsed.data.indicaciones?.trim() || null
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No se enviaron cambios para actualizar' }, { status: 400 })
    }

    const updated = await prisma.patientMedication.update({
      where: { id },
      data,
    })

    return NextResponse.json({ success: true, medication: updated })
  } catch (error) {
    console.error('[API][professional][patient-medications][PATCH] error:', error)
    return NextResponse.json({ error: 'Error al actualizar la medicación' }, { status: 500 })
  }
}
