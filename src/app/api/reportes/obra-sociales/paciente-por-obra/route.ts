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

export async function POST(req: Request) {
  try {
    const { startDate, endDate } = (await req.json()) as ReportRequest;

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "Debe seleccionar un rango de fechas" }, { status: 400 });
    }

    // Consulta por la parte DATE para evitar problemas de zona horaria:
    const rowsRaw = await prisma.$queryRaw<
      Array<Record<string, unknown>>
    >`SELECT
        os.id::text AS "obraSocialId",
        COALESCE(os.nombre, 'Particular') AS "obraSocial",
        COUNT(DISTINCT a."pacienteId")::int AS "cantidadPacientes",
        COALESCE(
          JSON_AGG(DISTINCT jsonb_build_object(
            'id', p.id,
            'nombre', p.nombre,
            'apellido', p.apellido,
            'dni', p.dni
          )) FILTER (WHERE p.id IS NOT NULL),
          '[]'
        ) AS "pacientes"
      FROM "appointments" a
      LEFT JOIN "patients" p ON a."pacienteId" = p.id
      LEFT JOIN "obras_sociales" os ON a."obraSocialId" = os.id
      WHERE a."fecha"::date BETWEEN ${startDate}::date AND ${endDate}::date
      GROUP BY os.id, COALESCE(os.nombre, 'Particular')
      ORDER BY "cantidadPacientes" DESC;`;

    const result: ObraSocialReportRow[] = rowsRaw.map((r) => {
      const obraSocialId = r["obraSocialId"] === null ? null : String(r["obraSocialId"] ?? null);
      const obraSocial = String(r["obraSocial"] ?? "Particular");
      const cantidadPacientes = Number(r["cantidadPacientes"] ?? 0);

      const rawPacientes = r["pacientes"];
      const pacientes: PatientDto[] = Array.isArray(rawPacientes)
        ? rawPacientes.map((p) => {
            if (typeof p === "object" && p !== null) {
              const rec = p as Record<string, unknown>;
              return {
                id: String(rec["id"] ?? ""),
                nombre: String(rec["nombre"] ?? ""),
                apellido: String(rec["apellido"] ?? ""),
                dni: rec["dni"] === null || rec["dni"] === undefined ? null : String(rec["dni"]),
              };
            }
            return { id: "", nombre: "", apellido: "", dni: null };
          })
        : [];

      return { obraSocialId, obraSocial, cantidadPacientes, pacientes };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error en reporte pacientes por obra social:", error);
    return NextResponse.json({ error: "Error interno en el servidor" }, { status: 500 });
  }
}

