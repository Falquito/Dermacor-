import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { AppointmentStatus } from '@prisma/client'
import { normalizeDiacritics } from '@/lib/text-normalize'

// UI-specific appointment type (transformed from Prisma Appointment)
type Appointment = {
  id: string
  professionalId: string
  patientId?: string | null
  title: string
  start: string // ISO
  end: string // ISO
  status: AppointmentStatus
  notes?: string | null
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json([], { status: 200 })

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const statusParam = searchParams.get('status') // comma-separated statuses matching Prisma enum values
  const professionalIdParam = searchParams.get('professionalId') // Allow querying other professionals
  const q = (searchParams.get('q') || '').trim()
  if (!from || !to) return NextResponse.json([], { status: 200 })

  const fromDate = new Date(from)
  const toDate = new Date(to)

  // Determine which professional's appointments to fetch
  let targetProfessionalId = session.userId // Default to current user
  
  // If professionalId is provided and user has appropriate permissions, use it
  if (professionalIdParam) {
    // Get current user's roles from database
    const currentUser = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { roles: true }
    })
    
    const userRoles = currentUser?.roles.map(r => r.role) || []
    
    // Allow MESA_ENTRADA and GERENTE to view any professional's appointments
    if (userRoles.includes('MESA_ENTRADA') || userRoles.includes('GERENTE')) {
      targetProfessionalId = professionalIdParam
    }
    // If user is PROFESIONAL but requesting their own data, allow it
    else if (userRoles.includes('PROFESIONAL') && professionalIdParam === session.userId) {
      targetProfessionalId = professionalIdParam
    }
    // Otherwise, keep default (current user)
  }

  // Build filters
  const estadoIn = statusParam
    ? statusParam
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined

  const estadoValues = Object.values(AppointmentStatus) as AppointmentStatus[]
  const estadoInPrisma = estadoIn?.filter((s): s is AppointmentStatus =>
    estadoValues.includes(s as AppointmentStatus)
  )

  // Query DB
  const rows = await prisma.appointment.findMany({
    where: {
      profesionalId: targetProfessionalId,
      fecha: { gte: fromDate, lt: toDate },
      ...(estadoInPrisma && estadoInPrisma.length ? { estado: { in: estadoInPrisma } } : {}),
      ...(q
        ? {
            OR: [
              { motivo: { contains: q, mode: 'insensitive' } },
              { observaciones: { contains: q, mode: 'insensitive' } },
              { paciente: { nombre: { contains: q, mode: 'insensitive' } } },
              { paciente: { apellido: { contains: q, mode: 'insensitive' } } },
              { paciente: { dni: { contains: q, mode: 'insensitive' } } },
            ],
          }
        : {}),
    },
    include: {
      paciente: { select: { id: true, nombre: true, apellido: true, dni: true } },
    },
    orderBy: { fecha: 'asc' },
  })

  // Optional accent-insensitive secondary filter (Prisma 'insensitive' is case-insensitive, not accent-insensitive)
  let filtered = rows
  if (q) {
    const normQ = normalizeDiacritics(q)
    filtered = rows.filter((r) => {
      const fields = [
        r.motivo ?? '',
        r.observaciones ?? '',
        r.paciente?.nombre ?? '',
        r.paciente?.apellido ?? '',
        r.paciente?.dni ?? '',
      ]
      return fields.some((f) => normalizeDiacritics(f).includes(normQ))
    })
  }

  // Map to UI shape
  const data: Appointment[] = filtered.map((r) => {
    const start = r.fecha
    const end = new Date(start.getTime() + (r.duracion ?? 30) * 60000)
    const fullName = r.paciente ? `${r.paciente.apellido}, ${r.paciente.nombre}`.trim() : ''
    const title = fullName || r.motivo || 'Consulta'
    return {
      id: r.id,
      professionalId: r.profesionalId,
      patientId: r.pacienteId,
      title,
      start: start.toISOString(),
      end: end.toISOString(),
      status: r.estado,
      notes: r.observaciones ?? null,
    }
  })

  return NextResponse.json(data, { status: 200 })
}
