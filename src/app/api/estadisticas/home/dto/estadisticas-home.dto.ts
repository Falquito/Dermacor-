
export type SerieDiaria = { date: string; count: number };

export type EstadisticasHomeResponse = {
  pacientes: {
    activos: number;
    inactivos: number;
    total: number;
  };
  consultas: {
    mesActual: number;
    mesAnterior: number;
    variacionPct: number | null;
  };
  series: {
    consultasUltimos30Dias: SerieDiaria[];
    pacientesNuevosUltimos30Dias: SerieDiaria[];
  };
  resumen: {
    pacientesNuevos30d: number;
  };
};
