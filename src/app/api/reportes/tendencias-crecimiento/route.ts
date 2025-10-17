import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { AppointmentStatus } from '@prisma/client';
import { startOfMonth, subMonths, format, getHours, parseISO, subDays, subWeeks, subYears } from 'date-fns';
import { es } from 'date-fns/locale';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.roles.includes('GERENTE')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener parámetros de la URL
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const profesionalId = searchParams.get('profesional');
    const especialidadNombre = searchParams.get('especialidad');
    const estado = searchParams.get('estado');
    const periodo = searchParams.get('periodo') || 'mes';

    // Configurar fechas basadas en parámetros o defaults
    const now = new Date();
    let fechaInicio: Date;
    let fechaFin: Date;

    if (dateFrom && dateTo) {
      fechaInicio = parseISO(dateFrom);
      fechaFin = parseISO(dateTo);
    } else {
      // Usar período para determinar rango de fechas
      switch (periodo) {
        case 'dia':
          fechaInicio = subDays(now, 30); // Últimos 30 días
          fechaFin = now;
          break;
        case 'semana':
          fechaInicio = subWeeks(now, 12); // Últimas 12 semanas
          fechaFin = now;
          break;
        case 'cuatrimestre':
          fechaInicio = subMonths(now, 12); // Últimos 3 cuatrimestres
          fechaFin = now;
          break;
        case 'año':
          fechaInicio = subYears(now, 3); // Últimos 3 años
          fechaFin = now;
          break;
        default: // mes
          fechaInicio = subMonths(now, 6); // Últimos 6 meses
          fechaFin = now;
      }
    }

    // Construir filtros WHERE dinámicos
    const whereFilters: {
      fecha: { gte: Date; lte: Date };
      profesionalId?: string;
      profesional?: { especialidad: { nombre: string } };
      estado?: AppointmentStatus | { in: AppointmentStatus[] };
    } = {
      fecha: {
        gte: fechaInicio,
        lte: fechaFin,
      },
    };

    // Filtro por profesional
    if (profesionalId && profesionalId !== 'todos') {
      whereFilters.profesionalId = profesionalId;
    }

    // Filtro por especialidad
    if (especialidadNombre && especialidadNombre !== 'todas') {
      whereFilters.profesional = {
        especialidad: {
          nombre: especialidadNombre,
        },
      };
    }

    // Filtro por estado
    if (estado && estado !== 'todos') {
      switch (estado) {
        case 'completados':
          whereFilters.estado = AppointmentStatus.COMPLETADO;
          break;
        case 'cancelados':
          whereFilters.estado = AppointmentStatus.CANCELADO;
          break;
        case 'pendientes':
          whereFilters.estado = {
            in: [AppointmentStatus.PROGRAMADO, AppointmentStatus.CONFIRMADO],
          };
          break;
      }
    }

    // Función helper para generar períodos según el tipo
    const generarPeriodos = (tipo: string, inicio: Date, fin: Date) => {
      const periodos = [];
      const current = new Date(inicio);
      
      switch (tipo) {
        case 'dia':
          while (current <= fin) {
            periodos.push({
              key: format(current, 'dd/MM', { locale: es }),
              inicio: new Date(current),
              fin: new Date(current.getTime() + 24 * 60 * 60 * 1000 - 1)
            });
            current.setDate(current.getDate() + 1);
          }
          break;
        case 'semana':
          current.setDate(current.getDate() - current.getDay() + 1); // Inicio de semana
          while (current <= fin) {
            const finSemana = new Date(current);
            finSemana.setDate(finSemana.getDate() + 6);
            periodos.push({
              key: `Sem ${format(current, 'w', { locale: es })}`,
              inicio: new Date(current),
              fin: finSemana
            });
            current.setDate(current.getDate() + 7);
          }
          break;
        case 'cuatrimestre':
          const mesInicio = current.getMonth();
          let cuatrimestre = Math.floor(mesInicio / 4) + 1;
          
          while (current.getFullYear() <= fin.getFullYear()) {
            const inicioC = new Date(current.getFullYear(), (cuatrimestre - 1) * 4, 1);
            const finC = new Date(current.getFullYear(), cuatrimestre * 4, 0);
            if (inicioC <= fin) {
              periodos.push({
                key: `Q${cuatrimestre} ${current.getFullYear()}`,
                inicio: inicioC,
                fin: finC
              });
            }
            cuatrimestre++;
            if (cuatrimestre > 3) {
              cuatrimestre = 1;
              current.setFullYear(current.getFullYear() + 1);
            }
          }
          break;
        case 'año':
          while (current.getFullYear() <= fin.getFullYear()) {
            periodos.push({
              key: current.getFullYear().toString(),
              inicio: new Date(current.getFullYear(), 0, 1),
              fin: new Date(current.getFullYear(), 11, 31)
            });
            current.setFullYear(current.getFullYear() + 1);
          }
          break;
        default: // mes
          while (current <= fin) {
            const finMes = new Date(current.getFullYear(), current.getMonth() + 1, 0);
            periodos.push({
              key: format(current, 'MMM', { locale: es }),
              inicio: startOfMonth(current),
              fin: finMes
            });
            current.setMonth(current.getMonth() + 1);
          }
      }
      
      return periodos;
    };

    // 1. Turnos por período (dinámico según filtros)
    const periodos = generarPeriodos(periodo, fechaInicio, fechaFin);
    const turnosPorPeriodo = [];

    for (const p of periodos) {
      const turnosEnPeriodo = await prisma.appointment.findMany({
        where: {
          ...whereFilters,
          fecha: {
            gte: p.inicio,
            lte: p.fin,
          },
        },
        select: {
          estado: true,
        },
      });

      const total = turnosEnPeriodo.length;
      const completados = turnosEnPeriodo.filter(t => t.estado === AppointmentStatus.COMPLETADO).length;
      const cancelados = turnosEnPeriodo.filter(t => t.estado === AppointmentStatus.CANCELADO).length;

      turnosPorPeriodo.push({
        mes: p.key,
        total,
        completados,
        cancelados,
      });
    }

    // 2. Turnos por hora del día (con filtros aplicados)
    const todosTurnos = await prisma.appointment.findMany({
      where: {
        ...whereFilters,
        estado: {
          notIn: [AppointmentStatus.CANCELADO],
        },
      },
      select: {
        fecha: true,
      },
    });

    const horasMap = new Map<number, number>();
    for (let h = 8; h <= 20; h++) {
      horasMap.set(h, 0);
    }

    todosTurnos.forEach((turno) => {
      const hora = getHours(turno.fecha);
      if (hora >= 8 && hora <= 20) {
        horasMap.set(hora, (horasMap.get(hora) || 0) + 1);
      }
    });

    const turnosPorHora = Array.from(horasMap.entries())
      .map(([hora, cantidad]) => ({
        hora: `${hora}:00`,
        cantidad,
      }))
      .sort((a, b) => parseInt(a.hora) - parseInt(b.hora));

    // 3. Turnos por día de la semana
    const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const diasMap = new Map<number, number>();
    for (let d = 0; d < 7; d++) {
      diasMap.set(d, 0);
    }

    todosTurnos.forEach((turno) => {
      const diaSemana = (turno.fecha.getDay() + 6) % 7; // Ajustar para que Lunes sea 0
      diasMap.set(diaSemana, (diasMap.get(diaSemana) || 0) + 1);
    });

    const turnosPorDia = Array.from(diasMap.entries()).map(([dia, cantidad]) => ({
      dia: diasSemana[dia],
      cantidad,
    }));

    // 4. Crecimiento de pacientes (con filtros de período)
    const crecimientoPacientes = [];
    let acumulado = await prisma.patient.count({
      where: {
        createdAt: {
          lt: fechaInicio,
        },
      },
    });

    for (const p of periodos) {
      const nuevos = await prisma.patient.count({
        where: {
          createdAt: {
            gte: p.inicio,
            lt: p.fin,
          },
        },
      });

      acumulado += nuevos;
      crecimientoPacientes.push({
        mes: p.key,
        nuevos,
        total: acumulado,
      });
    }

    // 5. Distribución por especialidades (con filtros aplicados)
    const turnosPorEspecialidad = await prisma.appointment.findMany({
      where: {
        ...whereFilters,
        estado: {
          notIn: [AppointmentStatus.CANCELADO],
        },
      },
      select: {
        profesional: {
          select: {
            especialidad: {
              select: {
                nombre: true,
              },
            },
          },
        },
      },
    });

    const especialidadesMap = new Map<string, number>();
    let totalTurnos = 0;

    turnosPorEspecialidad.forEach((turno) => {
      const especialidad = turno.profesional.especialidad?.nombre || 'Sin especialidad';
      especialidadesMap.set(especialidad, (especialidadesMap.get(especialidad) || 0) + 1);
      totalTurnos++;
    });

    const distribucionEspecialidades = Array.from(especialidadesMap.entries())
      .map(([nombre, cantidad]) => ({
        nombre,
        cantidad,
        porcentaje: totalTurnos > 0 ? (cantidad / totalTurnos) * 100 : 0,
      }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 6);

    // 6. Tiempo promedio por especialidad (con filtros aplicados)
    const tiemposPorEspecialidad = await prisma.appointment.groupBy({
      by: ['profesionalId'],
      where: {
        ...whereFilters,
        estado: AppointmentStatus.COMPLETADO,
      },
      _avg: {
        duracion: true,
      },
    });

    const profesionalesEspecialidades = await prisma.user.findMany({
      where: {
        id: {
          in: tiemposPorEspecialidad.map((t) => t.profesionalId),
        },
      },
      select: {
        id: true,
        especialidad: {
          select: {
            nombre: true,
          },
        },
      },
    });

    const tiemposPorEspecialidadMap = new Map<string, { total: number; count: number }>();

    tiemposPorEspecialidad.forEach((tiempo) => {
      const profesional = profesionalesEspecialidades.find((p) => p.id === tiempo.profesionalId);
      const especialidad = profesional?.especialidad?.nombre || 'Sin especialidad';
      const duracion = tiempo._avg.duracion || 30;

      const data = tiemposPorEspecialidadMap.get(especialidad) || { total: 0, count: 0 };
      data.total += duracion;
      data.count++;
      tiemposPorEspecialidadMap.set(especialidad, data);
    });

    const tiempoPromedioPorEspecialidad = Array.from(tiemposPorEspecialidadMap.entries())
      .map(([especialidad, datos]) => ({
        especialidad,
        minutos: Math.round(datos.total / datos.count),
      }))
      .sort((a, b) => b.minutos - a.minutos)
      .slice(0, 6);

    // 7. Tasa de asistencia por período (con filtros aplicados)
    const tasaAsistencia = [];

    for (const p of periodos) {
      const turnosEnPeriodo = await prisma.appointment.findMany({
        where: {
          ...whereFilters,
          fecha: {
            gte: p.inicio,
            lte: p.fin,
          },
        },
        select: {
          estado: true,
        },
      });

      const asistencia = turnosEnPeriodo.filter(t => 
        t.estado === AppointmentStatus.COMPLETADO || t.estado === AppointmentStatus.CONFIRMADO
      ).length;
      const noAsistio = turnosEnPeriodo.filter(t => 
        t.estado === AppointmentStatus.NO_ASISTIO
      ).length;

      tasaAsistencia.push({
        mes: p.key,
        asistencia,
        noAsistio,
      });
    }

    // 8. Estadísticas resumen (basadas en datos reales)
    const ultimoPeriodo = turnosPorPeriodo[turnosPorPeriodo.length - 1]?.total || 0;
    const penultimoPeriodo = turnosPorPeriodo[turnosPorPeriodo.length - 2]?.total || 1;
    const tendenciaMensual = ((ultimoPeriodo - penultimoPeriodo) / penultimoPeriodo) * 100;

    const horasOrdenadas = [...turnosPorHora].sort((a, b) => b.cantidad - a.cantidad);
    const horasMasConcurridas = horasOrdenadas.slice(0, 3).map((h) => h.hora);

    const diasOrdenados = [...turnosPorDia].sort((a, b) => b.cantidad - a.cantidad);
    const diasMasConcurridos = diasOrdenados.slice(0, 3).map((d) => d.dia);

    const especialidadMasPopular = distribucionEspecialidades[0]?.nombre || 'N/A';

    const totalAsistencia = tasaAsistencia.reduce((sum, t) => sum + t.asistencia, 0);
    const totalNoAsistio = tasaAsistencia.reduce((sum, t) => sum + t.noAsistio, 0);
    const tasaAsistenciaPromedio =
      totalAsistencia + totalNoAsistio > 0
        ? (totalAsistencia / (totalAsistencia + totalNoAsistio)) * 100
        : 0;

    // Métricas adicionales de valor
    const crecimientoPacientesUltimoMes = crecimientoPacientes[crecimientoPacientes.length - 1]?.nuevos || 0;
    const promedioHoraPeak = horasOrdenadas[0]?.cantidad || 0;
    const ingresosPotencialesHoraPeak = promedioHoraPeak * 45; // Estimado $45 por consulta
    const eficienciaOperativa = Math.min(95, 70 + (tasaAsistenciaPromedio * 0.3)); // Fórmula basada en asistencia
    const prediccionProximoMes = tendenciaMensual * 1.1; // Proyección conservadora

    return NextResponse.json({
      turnosPorMes: turnosPorPeriodo,
      turnosPorHora,
      turnosPorDia,
      crecimientoPacientes,
      distribucionEspecialidades,
      tiempoPromedioPorEspecialidad,
      tasaAsistencia,
      estadisticasResumen: {
        tendenciaMensual,
        horasMasConcurridas,
        diasMasConcurridos,
        especialidadMasPopular,
        tasaAsistenciaPromedio,
        crecimientoPacientesUltimoMes,
        ingresosPotencialesHoraPeak,
        eficienciaOperativa,
        prediccionProximoMes,
      },
    });
  } catch (error) {
    console.error('Error al obtener tendencias:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos de tendencias' },
      { status: 500 }
    );
  }
}
