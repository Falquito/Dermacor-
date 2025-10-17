import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.roles.includes('GERENTE')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener todos los profesionales activos con estadísticas reales
    const profesionales = await prisma.user.findMany({
      where: {
        roles: {
          some: {
            role: 'PROFESIONAL',
          },
        },
      },
      select: {
        id: true,
        name: true,
        apellido: true,
        especialidad: {
          select: {
            nombre: true,
          },
        },
        professionalAppointments: {
          where: {
            fecha: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1), // Último mes
            },
          },
          select: {
            id: true,
            estado: true,
            duracion: true,
            pacienteId: true,
          },
        },
      },
    });

    // Calcular estadísticas reales para cada profesional
    const profesionalesConEstadisticas = profesionales.map(prof => {
      const consultas = prof.professionalAppointments.length;
      const consultasCompletadas = prof.professionalAppointments.filter(
        apt => apt.estado === 'COMPLETADO'
      );
      
      const pacientesUnicos = new Set(prof.professionalAppointments.map(apt => apt.pacienteId)).size;
      
      const duracionPromedio = consultasCompletadas.length > 0
        ? consultasCompletadas.reduce((sum, apt) => sum + apt.duracion, 0) / consultasCompletadas.length
        : 30;
      
      const tasaAsistencia = consultas > 0
        ? (consultasCompletadas.length / consultas) * 100
        : 0;

      return {
        id: prof.id,
        nombre: `${prof.name} ${prof.apellido || ''}`.trim(),
        especialidad: prof.especialidad?.nombre || 'Sin especialidad',
        consultas,
        pacientesUnicos,
        duracionPromedio: Math.round(duracionPromedio),
        tasaAsistencia: Math.round(tasaAsistencia),
      };
    });

    return NextResponse.json({
      profesionales: profesionalesConEstadisticas,
    });
  } catch (error) {
    console.error('Error al obtener profesionales:', error);
    return NextResponse.json(
      { error: 'Error al obtener profesionales' },
      { status: 500 }
    );
  }
}