import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

interface ReportRequest {
  startDate: string;
  endDate: string;
  ranges: { min: number; max: number; label: string }[];
}

// Función para crear fecha local desde string YYYY-MM-DD
const createLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// 1. CORRECCIÓN IMPORTANTE: Función de cálculo de edad precisa
const calcularEdad = (fechaNacimiento: Date): number => {
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    const mes = hoy.getMonth() - fechaNacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
        edad--;
    }
    return edad;
};

export async function POST(req: Request) {
  try {
    const { startDate, endDate, ranges }: ReportRequest = await req.json();

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Debe seleccionar un rango de fechas" },
        { status: 400 }
      );
    }

    const startDateLocal = createLocalDate(startDate);
    const endDateLocal = createLocalDate(endDate);
    endDateLocal.setHours(23, 59, 59, 999);

    // Tomamos pacientes únicos que tuvieron turnos en el rango
    // Seleccionamos id, fechaNacimiento y genero para clasificar
    const appointmentsWithUniquePatients = await prisma.appointment.findMany({
      where: {
        fecha: {
          gte: startDateLocal,
          lte: endDateLocal,
        },
      },
      select: {
        paciente: {
          select: {
            id: true,
            fechaNacimiento: true,
            genero: true,
          },
        },
      },
      distinct: ['pacienteId'],
    });

    type PatientWithOptionalGender = { id: string; fechaNacimiento: Date; genero?: string | null };

    const uniquePatients = appointmentsWithUniquePatients
      .map(a => a.paciente)
      .filter(p => Boolean(p && p.id)) as PatientWithOptionalGender[];

    // Normalizar género: M -> masculino, F -> femenino, resto -> otro
    const isMale = (g?: string | null) => {
      if (!g) return false;
      const s = g.trim().toUpperCase();
      return s === 'M' || s.startsWith('M') || s === 'MALE';
    };
    const isFemale = (g?: string | null) => {
      if (!g) return false;
      const s = g.trim().toUpperCase();
      return s === 'F' || s.startsWith('F') || s === 'FEMALE';
    };

    // Contar por cada rango, separando por sexo
    const resultados = ranges.map((r) => {
      let countM = 0;
      let countF = 0;

      for (const paciente of uniquePatients) {
        const edad = calcularEdad(paciente.fechaNacimiento);
        if (edad >= r.min && edad <= r.max) {
          if (isMale(paciente.genero)) countM++;
          else if (isFemale(paciente.genero)) countF++;
          // si género desconocido o "otro" no se cuenta en M/F; se puede sumar a 'otros' si se desea
        }
      }

      return { rango: r.label, totalM: countM, totalF: countF, total: countM + countF };
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