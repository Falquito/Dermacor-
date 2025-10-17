import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

interface ReportRequest {
  startDate: string;
  endDate: string;
}

interface PatientDto {
  id: string;
  nombre: string;
  apellido: string;
  dni: string | null;
}

interface ObraSocialReportRow {
  obraSocialId: string | null;
  obraSocial: string;
  cantidadPacientes: number;
  pacientes: PatientDto[];
}

// Crear Date en timezone local desde YYYY-MM-DD
const createLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export async function POST(req: Request) {
  try {
    const { startDate, endDate } = (await req.json()) as ReportRequest;

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "Debe seleccionar un rango de fechas" }, { status: 400 });
    }

    const startDateLocal = createLocalDate(startDate);
    const endDateLocal = createLocalDate(endDate);
    endDateLocal.setHours(23, 59, 59, 999);

    // Traer appointments con paciente y obraSocial en el rango
    const appointments = await prisma.appointment.findMany({
      where: {
        fecha: {
          gte: startDateLocal,
          lte: endDateLocal,
        },
      },
      select: {
        pacienteId: true,
        paciente: {
          select: { id: true, nombre: true, apellido: true, dni: true },
        },
        obraSocialId: true,
        obraSocial: {
          select: { id: true, nombre: true },
        },
      },
    });

    // Agrupar por obra social y deduplicar pacientes por obra social
    const map = new Map<string, { obraSocialId: string | null; obraSocial: string; pacientesMap: Map<string, PatientDto> }>();

    for (const a of appointments) {
      const obraName = a.obraSocial?.nombre ?? "Particular";
      const obraKey = (a.obraSocialId ?? "PARTICULAR") as string;

      const group = map.get(obraKey) ?? {
        obraSocialId: a.obraSocialId ?? null,
        obraSocial: obraName,
        pacientesMap: new Map<string, PatientDto>(),
      };

      const p = a.paciente;
      if (p && !group.pacientesMap.has(p.id)) {
        group.pacientesMap.set(p.id, {
          id: p.id,
          nombre: p.nombre,
          apellido: p.apellido,
          dni: p.dni ?? null,
        });
      }

      map.set(obraKey, group);
    }

    const rows: ObraSocialReportRow[] = Array.from(map.values()).map((g) => {
      const pacientes = Array.from(g.pacientesMap.values());
      return {
        obraSocialId: g.obraSocialId,
        obraSocial: g.obraSocial,
        cantidadPacientes: pacientes.length,
        pacientes,
      };
    });

    // Orden descendente por cantidad
    rows.sort((a, b) => b.cantidadPacientes - a.cantidadPacientes);

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error en reporte pacientes por obra social:", error);
    return NextResponse.json({ error: "Error interno en el servidor" }, { status: 500 });
  }
}

