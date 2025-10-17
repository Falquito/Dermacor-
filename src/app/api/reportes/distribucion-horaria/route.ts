import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"

interface DistribRequest {
  date: string // "YYYY-MM-DD"
  especialidad?: string | null
  duracion?: "cualquiera" | "<=15" | "<=30" | ">30"
}

interface HourRow {
  hour: number
  count: number
}

const createUtcRangeFromDate = (dateString: string) => {
  const [year, month, day] = dateString.split("-").map(Number)
  const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
  const end = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999))
  return { start, end }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as DistribRequest
    const { date, especialidad = null, duracion = "cualquiera" } = body

    if (!date) {
      return NextResponse.json({ error: "Debe enviar date en formato YYYY-MM-DD" }, { status: 400 })
    }

    const { start, end } = createUtcRangeFromDate(date)

    // Construir filtro tipado sin usar any
    const where: Prisma.AppointmentWhereInput = {
      fecha: { gte: start, lte: end },
    }

    if (duracion === "<=15") {
      where.duracion = { lte: 15 }
    } else if (duracion === "<=30") {
      where.duracion = { lte: 30 }
    } else if (duracion === ">30") {
      where.duracion = { gt: 30 }
    }

    if (especialidad && especialidad.trim() !== "") {
      // filtrar por la especialidad del profesional relacionada al turno
      where.profesional = {
        is: {
          especialidad: {
            is: {
              nombre: especialidad,
            },
          },
        },
      }
    }

    // Obtener solo las fechas de los turnos que cumplen filtros
    const appointments = await prisma.appointment.findMany({
      where,
      select: { fecha: true },
    })

    // Agregar por hora (UTC para mantener coherencia con el rango UTC)
    const counts = new Map<number, number>()
    for (const a of appointments) {
      const fecha = a.fecha
      const hour = fecha instanceof Date ? fecha.getUTCHours() : new Date(String(fecha)).getUTCHours()
      counts.set(hour, (counts.get(hour) ?? 0) + 1)
    }

    const rows: HourRow[] = Array.from(counts.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((x, y) => x.hour - y.hour)

    return NextResponse.json(rows)
  } catch (err) {
    console.error("Error distribucion horaria:", err)
    return NextResponse.json({ error: "Error interno en el servidor" }, { status: 500 })
  }
}