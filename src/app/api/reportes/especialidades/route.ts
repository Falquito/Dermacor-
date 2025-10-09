import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

interface ReportRequest {
  startDate: string;
  endDate: string;
}

// Función para crear fecha local desde string YYYY-MM-DD
const createLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export async function POST(req: Request) {
  try {
    const { startDate, endDate }: ReportRequest = await req.json();

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Debe seleccionar un rango de fechas" },
        { status: 400 }
      );
    }

    // Crear fechas en timezone local
    const startDateLocal = createLocalDate(startDate);
    const endDateLocal = createLocalDate(endDate);
    // Para incluir todo el día final, agregamos 23:59:59
    endDateLocal.setHours(23, 59, 59, 999);

    // Agrupamos turnos por profesional dentro del rango
    const appointments = await prisma.appointment.groupBy({
      by: ["profesionalId"],
      _count: { id: true },
      where: {
        fecha: {
          gte: startDateLocal,
          lte: endDateLocal,
        },
      },
    });

    // Solo especialidades activas
    const especialidades = await prisma.especialidad.findMany({
      where: { activa: true },
      select: {
        id: true,
        nombre: true,
        professionals: {
          select: { id: true },
        },
      },
    });

    // Relacionamos especialidad ↔ cantidad de consultas
    const report = especialidades.map((esp) => {
      const total = appointments
        .filter((a) =>
          esp.professionals.some((p) => p.id === a.profesionalId)
        )
        .reduce((acc, a) => acc + a._count.id, 0);

      return {
        id: esp.id,
        nombre: esp.nombre,
        total,
      };
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error en reporte de especialidades:", error);
    return NextResponse.json(
      { error: "Error interno en el servidor" },
      { status: 500 }
    );
  }
}
