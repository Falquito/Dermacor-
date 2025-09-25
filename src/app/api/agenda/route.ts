import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

type AppointmentStatus = 'PENDING' | 'WAITING' | 'COMPLETED' | 'CANCELED'

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

const mock: Array<Omit<Appointment, 'start' | 'end'> & { start: () => string; end: () => string }> = [
  { id: 'a1', professionalId: 'mock-prof-1', patientId: '101', title: 'Consulta inicial', start: () => todayAt(9, 0), end: () => todayAt(9, 30), status: 'PENDING' },
  { id: 'a2', professionalId: 'mock-prof-1', patientId: '102', title: 'Controles', start: () => todayAt(10, 0), end: () => todayAt(10, 45), status: 'WAITING' },
  { id: 'a3', professionalId: 'mock-prof-1', patientId: '103', title: 'Seguimiento', start: () => offsetDayAt(1, 11, 0), end: () => offsetDayAt(1, 11, 30), status: 'COMPLETED' },
  { id: 'a4', professionalId: 'mock-prof-2', patientId: '104', title: 'Paciente otro prof.', start: () => todayAt(12, 0), end: () => todayAt(12, 30), status: 'CANCELED' },
]

function todayAt(h: number, m: number) {
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}
function offsetDayAt(offset: number, h: number, m: number) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json([], { status: 200 })
  const professionalId = session.userId // provisional: userId == professionalId until model exists

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const statusParam = searchParams.get('status') // comma-separated statuses
  const q = (searchParams.get('q') || '').trim().toLowerCase()
  if (!from || !to) return NextResponse.json([], { status: 200 })

  const fromDate = new Date(from)
  const toDate = new Date(to)

  let data: Appointment[] = mock
    .map((a) => ({
      ...a,
      professionalId: a.professionalId === 'mock-prof-1' ? professionalId : a.professionalId,
      start: a.start(),
      end: a.end(),
    }))
    .filter((a) => a.professionalId === professionalId)
    .filter((a) => {
      const s = new Date(a.start)
      const e = new Date(a.end)
      return e > fromDate && s < toDate
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())

  if (statusParam) {
    const allowed = statusParam.split(',').map((s) => s.trim()).filter(Boolean)
    if (allowed.length) {
      data = data.filter((d) => allowed.includes(d.status))
    }
  }

  if (q) {
    data = data.filter((d) =>
      d.title.toLowerCase().includes(q) ||
      (d.notes?.toLowerCase().includes(q) ?? false) ||
      (d.patientId && d.patientId.toLowerCase().includes(q))
    )
  }

  return NextResponse.json(data, { status: 200 })
}
