import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

interface ReportRequest {
  startDate: string;
  endDate: string;
  ranges: { min: number; max: number; label: string }[];
}

export async function POST(req: Request) {
  try {
    const { startDate, endDate, ranges }: ReportRequest = await req.json();

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Debe seleccionar un rango de fechas" },
        { status: 400 }
      );
    }

    // Buscamos pacientes atendidos entre esas fechas
    const appointments = await prisma.appointment.findMany({
      where: {
        fecha: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      select: {
        paciente: {
          select: {
            fechaNacimiento: true,
          },
        },
      },
    });

    // Función para calcular edad actual
    const calcularEdad = (fechaNacimiento: Date): number => {
      const diff = Date.now() - fechaNacimiento.getTime();
      const edad = new Date(diff).getUTCFullYear() - 1970;
      return edad;
    };

    // Contamos cuántos pacientes caen en cada rango
    const resultados = ranges.map((r) => {
      const count = appointments.filter((a) => {
        const edad = calcularEdad(a.paciente.fechaNacimiento);
        return edad >= r.min && edad <= r.max;
      }).length;

      return { rango: r.label, total: count };
    });

    return NextResponse.json(resultados);
  } catch (error) {
    console.error("Error en reporte de edades:", error);
    return NextResponse.json(
      { error: "Error interno en el servidor" },
      { status: 500 }
    );
  }
}
