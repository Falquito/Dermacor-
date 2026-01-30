import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EstadisticasHomeResponse } from "./dto/estadisticas-home.dto";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}
function startOfNextMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0);
}
function formatYYYYMMDD(d: Date) {
  // para usar como key en series
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function GET() {
  try {
    const now = new Date();

    // Rangos
    const monthStart = startOfMonth(now);
    const nextMonthStart = startOfNextMonth(now);

    const prevMonthRef = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthStart = startOfMonth(prevMonthRef);
    const prevNextMonthStart = startOfNextMonth(prevMonthRef);

    const last30Start = startOfDay(addDays(now, -29)); // incluye hoy (30 días)
    const tomorrowStart = startOfDay(addDays(now, 1)); // para <= hoy

    // 1) Pacientes activos / inactivos
    const [activos, inactivos] = await Promise.all([
      prisma.paciente.count({ where: { estadoPaciente: true } }),
      prisma.paciente.count({ where: { estadoPaciente: false } }),
    ]);

    // 2) Consultas mes actual / anterior
    const [mesActual, mesAnterior] = await Promise.all([
      prisma.consultas.count({
        where: { fechaHoraConsulta: { gte: monthStart, lt: nextMonthStart } },
      }),
      prisma.consultas.count({
        where: { fechaHoraConsulta: { gte: prevMonthStart, lt: prevNextMonthStart } },
      }),
    ]);

    const variacionPct =
      mesAnterior === 0 ? null : Math.round(((mesActual - mesAnterior) / mesAnterior) * 100);

    // Helper para armar serie diaria completa (rellenando 0)
    function buildEmptySeries30d() {
      const arr: Array<{ date: string; count: number }> = [];
      for (let i = 0; i < 30; i++) {
        const day = addDays(last30Start, i);
        arr.push({ date: formatYYYYMMDD(day), count: 0 });
      }
      return arr;
    }

    // 3) Serie consultas últimos 30 días (groupBy)
    // Agrupo por día trayendo las fechas y luego las mapeo a keys YYYY-MM-DD
    const consultas30Raw = await prisma.consultas.findMany({
      where: { fechaHoraConsulta: { gte: last30Start, lt: tomorrowStart } },
      select: { fechaHoraConsulta: true },
    });

    const consultasMap = new Map<string, number>();
    for (const r of consultas30Raw) {
      const key = formatYYYYMMDD(startOfDay(r.fechaHoraConsulta));
      consultasMap.set(key, (consultasMap.get(key) ?? 0) + 1);
    }

    const consultasUltimos30Dias = buildEmptySeries30d().map((p) => ({
      ...p,
      count: consultasMap.get(p.date) ?? 0,
    }));

    // 4) Pacientes nuevos últimos 30 días (por fechaHoraPaciente)
    const pacientes30Raw = await prisma.paciente.findMany({
      where: { fechaHoraPaciente: { gte: last30Start, lt: tomorrowStart } },
      select: { fechaHoraPaciente: true },
    });

    const pacientesMap = new Map<string, number>();
    for (const r of pacientes30Raw) {
      const key = formatYYYYMMDD(startOfDay(r.fechaHoraPaciente));
      pacientesMap.set(key, (pacientesMap.get(key) ?? 0) + 1);
    }

    const pacientesNuevosUltimos30Dias = buildEmptySeries30d().map((p) => ({
      ...p,
      count: pacientesMap.get(p.date) ?? 0,
    }));

    const totalNuevos30d = pacientes30Raw.length;

    const response: EstadisticasHomeResponse = {
      pacientes: {
        activos,
        inactivos,
        total: activos + inactivos,
      },
      consultas: {
        mesActual,
        mesAnterior,
        variacionPct,
      },
      series: {
        consultasUltimos30Dias,
        pacientesNuevosUltimos30Dias,
      },
      resumen: {
        pacientesNuevos30d: totalNuevos30d,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("GET /api/estadisticas/home error:", error);
    return NextResponse.json(
      { message: "Error obteniendo estadísticas" },
      { status: 500 }
    );
  }
}
