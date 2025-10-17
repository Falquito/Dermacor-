"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Clock, 
  Calendar, 
  Users, 
  Activity, 
  Target,
  Zap,
  Filter,
  RefreshCw,
  Settings2,
  Minus
} from "lucide-react";

interface TendenciasCrecimientoTabProps {
  dateFrom: string;
  dateTo: string;
}

// Definición de tipos para los datos
interface TurnoMes {
  mes: string;
  total: number;
  completados: number;
  cancelados: number;
}

interface TurnoHora {
  hora: string;
  cantidad: number;
}

interface TurnoDia {
  dia: string;
  cantidad: number;
}

interface CrecimientoPaciente {
  mes: string;
  nuevos: number;
  total: number;
}

interface DistribucionEspecialidad {
  nombre: string;
  cantidad: number;
  porcentaje: number;
}

interface TiempoEspecialidad {
  especialidad: string;
  minutos: number;
}

interface TasaAsistencia {
  mes: string;
  asistencia: number;
  noAsistio: number;
}

interface EstadisticasResumen {
  tendenciaMensual: number;
  horasMasConcurridas: string[];
  diasMasConcurridos: string[];
  especialidadMasPopular: string;
  tasaAsistenciaPromedio: number;
  crecimientoPacientesUltimoMes: number;
  eficienciaOperativa: number;
  prediccionProximoMes: number;
}

interface ApiResponse {
  turnosPorMes: TurnoMes[];
  turnosPorHora: TurnoHora[];
  turnosPorDia: TurnoDia[];
  crecimientoPacientes: CrecimientoPaciente[];
  distribucionEspecialidades: DistribucionEspecialidad[];
  tiempoPromedioPorEspecialidad: TiempoEspecialidad[];
  tasaAsistencia: TasaAsistencia[];
  estadisticasResumen: EstadisticasResumen;
}

// Estados de filtros modulares avanzados
interface FiltrosAvanzados {
  evolucionTemporal: {
    periodo: 'dia' | 'semana' | 'mes' | 'cuatrimestre' | 'año';
    profesional: string | 'todos';
    especialidad: string | 'todas';
    estado: 'todos' | 'completados' | 'cancelados' | 'pendientes';
  };
  especialidades: {
    especialidadesSeleccionadas: string[];
    periodo: 'semana' | 'mes' | 'cuatrimestre';
  };
  profesionales: {
    profesionalesSeleccionados: string[];
    metrica: 'consultas' | 'pacientes' | 'duracion' | 'asistencia';
    periodo: 'dia' | 'semana' | 'mes';
    especialidad: string | 'todas';
    vistaGrafico: 'barras' | 'linea' | 'ranking';
  };
  patrones: {
    dimension: 'horario' | 'diasemana';
    profesional: string | 'todos';
    especialidad: string | 'todas';
    periodo: 'mes' | 'cuatrimestre' | 'año';
  };
}

// Tipos de datos modulares
interface DatoProfesional {
  id: string;
  nombre: string;
  especialidad: string;
  consultas: number;
  pacientesUnicos: number;
  duracionPromedio: number;
  tasaAsistencia: number;
}



// Componente para métricas con animaciones
interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  subtitle?: string;
  Icon: React.ComponentType<{ className?: string }>;
  delay?: number;
}

const MetricCard = ({ title, value, change, subtitle, Icon, delay = 0 }: MetricCardProps) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const changeColor = change && change > 0 ? 'text-emerald-600' : change && change < 0 ? 'text-red-500' : 'text-gray-500';
  const changeBg = change && change > 0 ? 'bg-emerald-50' : change && change < 0 ? 'bg-red-50' : 'bg-gray-50';

  return (
    <div 
      className={`
        rounded-2xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/20 
        p-6 shadow-sm hover:shadow-lg transition-all duration-500 hover:border-emerald-200
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Icon className="h-5 w-5 text-emerald-600" />
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h3>
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {change !== undefined && (
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${changeBg} ${changeColor}`}>
                {change > 0 ? '↗' : change < 0 ? '↘' : '→'} {Math.abs(change).toFixed(1)}%
              </div>
            )}
            {subtitle && (
              <p className="text-sm text-gray-600">{subtitle}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente para panel de filtros modulares avanzados
interface PanelFiltrosAvanzadosProps {
  tipo: 'evolucion' | 'especialidades' | 'profesionales' | 'patrones';
  filtros: FiltrosAvanzados;
  setFiltros: (filtros: FiltrosAvanzados) => void;
  opciones: {
    especialidades?: string[];
    profesionales?: DatoProfesional[];
  };
}

const PanelFiltrosAvanzados = ({ tipo, filtros, setFiltros, opciones }: PanelFiltrosAvanzadosProps) => {
  const [abierto, setAbierto] = useState(false);

  const updateFiltro = (seccion: keyof FiltrosAvanzados, campo: string, valor: unknown) => {
    const nuevosFiltros = {
      ...filtros,
      [seccion]: {
        ...filtros[seccion],
        [campo]: valor
      }
    };
    setFiltros(nuevosFiltros);
  };

  return (
    <div className="mb-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setAbierto(!abierto)}
        className="flex items-center gap-2 mb-2"
      >
        <Settings2 className="h-4 w-4" />
        Filtros Avanzados
        {abierto ? <Minus className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
      </Button>
      
      {abierto && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          {tipo === 'evolucion' && (
            <>
              {/* Selector de Período */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Período de Análisis:</label>
                <div className="flex flex-wrap gap-2">
                  {(['dia', 'semana', 'mes', 'cuatrimestre', 'año'] as const).map(periodo => (
                    <Button
                      key={periodo}
                      variant={filtros.evolucionTemporal.periodo === periodo ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateFiltro('evolucionTemporal', 'periodo', periodo)}
                      className="text-xs"
                    >
                      {periodo.charAt(0).toUpperCase() + periodo.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Selector de Profesional */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Profesional:</label>
                <select 
                  value={filtros.evolucionTemporal.profesional}
                  onChange={(e) => updateFiltro('evolucionTemporal', 'profesional', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="todos">Todos los profesionales</option>
                  {opciones.profesionales?.map(prof => (
                    <option key={prof.id} value={prof.id}>{prof.nombre} - {prof.especialidad}</option>
                  ))}
                </select>
              </div>

              {/* Selector de Especialidad */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Especialidad:</label>
                <select 
                  value={filtros.evolucionTemporal.especialidad}
                  onChange={(e) => updateFiltro('evolucionTemporal', 'especialidad', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="todas">Todas las especialidades</option>
                  {opciones.especialidades?.map(esp => (
                    <option key={esp} value={esp}>{esp}</option>
                  ))}
                </select>
              </div>

              {/* Estado de Turnos */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Estado:</label>
                <div className="flex flex-wrap gap-2">
                  {(['todos', 'completados', 'cancelados', 'pendientes'] as const).map(estado => (
                    <Button
                      key={estado}
                      variant={filtros.evolucionTemporal.estado === estado ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateFiltro('evolucionTemporal', 'estado', estado)}
                      className="text-xs"
                    >
                      {estado.charAt(0).toUpperCase() + estado.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}

          {tipo === 'especialidades' && (
            <>
              {/* Especialidades Seleccionadas */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Especialidades a incluir:</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={filtros.especialidades.especialidadesSeleccionadas.length === 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateFiltro('especialidades', 'especialidadesSeleccionadas', []);
                        }
                      }}
                      className="rounded"
                    />
                    Todas las especialidades
                  </label>
                  <div className="max-h-32 overflow-y-auto space-y-1 border-t pt-2">
                    {opciones.especialidades && opciones.especialidades.length > 0 ? (
                      opciones.especialidades.map(esp => (
                        <label key={esp} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={filtros.especialidades.especialidadesSeleccionadas.includes(esp)}
                            onChange={(e) => {
                              const selected = filtros.especialidades.especialidadesSeleccionadas;
                              const newSelected = e.target.checked 
                                ? [...selected, esp]
                                : selected.filter(id => id !== esp);
                              updateFiltro('especialidades', 'especialidadesSeleccionadas', newSelected);
                            }}
                            className="rounded"
                          />
                          {esp}
                        </label>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500 italic">No hay especialidades disponibles</p>
                    )}
                  </div>
                </div>
              </div>

          
            </>
          )}

          {tipo === 'profesionales' && (
            <>
              {/* Métrica */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Métrica a analizar:</label>
                <div className="flex flex-wrap gap-2">
                  {(['consultas', 'pacientes', 'duracion', 'asistencia'] as const).map(metrica => (
                    <Button
                      key={metrica}
                      variant={filtros.profesionales.metrica === metrica ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateFiltro('profesionales', 'metrica', metrica)}
                      className="text-xs"
                    >
                      {metrica === 'consultas' ? 'Consultas' : 
                       metrica === 'pacientes' ? 'Pacientes Únicos' :
                       metrica === 'duracion' ? 'Duración Promedio' : 'Tasa Asistencia'}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Profesionales */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Profesionales a comparar:</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={filtros.profesionales.profesionalesSeleccionados.length === 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateFiltro('profesionales', 'profesionalesSeleccionados', []);
                        }
                      }}
                      className="rounded"
                    />
                    Todos los profesionales
                  </label>
                  <div className="max-h-32 overflow-y-auto space-y-1 border-t pt-2">
                    {opciones.profesionales && opciones.profesionales.length > 0 ? (
                      opciones.profesionales.map(prof => (
                        <label key={prof.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={filtros.profesionales.profesionalesSeleccionados.includes(prof.id)}
                            onChange={(e) => {
                              const selected = filtros.profesionales.profesionalesSeleccionados;
                              const newSelected = e.target.checked 
                                ? [...selected, prof.id]
                                : selected.filter(id => id !== prof.id);
                              updateFiltro('profesionales', 'profesionalesSeleccionados', newSelected);
                            }}
                            className="rounded"
                          />
                          {prof.nombre} - {prof.especialidad}
                        </label>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500 italic">No hay profesionales disponibles</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {tipo === 'patrones' && (
            <>
              {/* Dimensión */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Analizar por:</label>
                <div className="flex flex-wrap gap-2">
                  {(['horario', 'diasemana'] as const).map(dim => (
                    <Button
                      key={dim}
                      variant={filtros.patrones.dimension === dim ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateFiltro('patrones', 'dimension', dim)}
                      className="text-xs"
                    >
                      {dim === 'horario' ? 'Horario' : 'Día Semana'}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Profesional */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Profesional:</label>
                <select 
                  value={filtros.patrones.profesional}
                  onChange={(e) => updateFiltro('patrones', 'profesional', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="todos">Todos los profesionales</option>
                  {opciones.profesionales?.map(prof => (
                    <option key={prof.id} value={prof.id}>{prof.nombre} - {prof.especialidad}</option>
                  ))}
                </select>
              </div>

              {/* Especialidad */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Especialidad:</label>
                <select 
                  value={filtros.patrones.especialidad}
                  onChange={(e) => updateFiltro('patrones', 'especialidad', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="todas">Todas las especialidades</option>
                  {opciones.especialidades?.map(esp => (
                    <option key={esp} value={esp}>{esp}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default function TendenciasCrecimientoTab({ dateFrom, dateTo }: TendenciasCrecimientoTabProps) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Datos adicionales para filtros
  const [profesionales, setProfesionales] = useState<DatoProfesional[]>([]);
  const [especialidades, setEspecialidades] = useState<string[]>([]);

  // Función para obtener especialidades combinadas (API + las que vienen de la BD)
  const getEspecialidadesCombinadas = () => {
    const especialidadesDelAPI = data?.distribucionEspecialidades?.map(e => e.nombre) || [];
    const especialidadesUnicas = new Set([...especialidadesDelAPI, ...especialidades]);
    return Array.from(especialidadesUnicas).sort();
  };

  // Estados de filtros avanzados - Simplificados y funcionales
  const [filtros, setFiltros] = useState<FiltrosAvanzados>({
    evolucionTemporal: {
      periodo: 'mes',
      profesional: 'todos',
      especialidad: 'todas',
      estado: 'todos',
    },
    especialidades: {
      especialidadesSeleccionadas: [],
      periodo: 'mes',
    },
    profesionales: {
      profesionalesSeleccionados: [],
      metrica: 'consultas',
      periodo: 'mes',
      especialidad: 'todas',
      vistaGrafico: 'barras',
    },
    patrones: {
      dimension: 'horario',
      profesional: 'todos',
      especialidad: 'todas',
      periodo: 'mes',
    },
  });

  // Función para carga de datos con filtros reales
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Construir parámetros con filtros aplicados
      const params = new URLSearchParams({
        dateFrom,
        dateTo,
        periodo: filtros.evolucionTemporal.periodo,
        profesional: filtros.evolucionTemporal.profesional,
        especialidad: filtros.evolucionTemporal.especialidad,
        estado: filtros.evolucionTemporal.estado,
      });

      const response = await fetch(`/api/reportes/tendencias-crecimiento?${params}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar los datos');
      }
      
      const apiData = await response.json();
      setData(apiData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, filtros.evolucionTemporal]);

  // Función para cargar profesionales reales
  const fetchProfesionales = useCallback(async () => {
    try {
      const response = await fetch('/api/profesionales/stats');
      if (response.ok) {
        const data = await response.json();
        setProfesionales(data.profesionales);
      }
    } catch (err) {
      console.error('Error al cargar profesionales:', err);
    }
  }, []);

  // Función para cargar especialidades reales
  const fetchEspecialidades = useCallback(async () => {
    try {
      const response = await fetch('/api/especialidades');
      if (response.ok) {
        const data = await response.json();
        setEspecialidades(data.especialidades.map((esp: { nombre: string }) => esp.nombre));
      }
    } catch (err) {
      console.error('Error al cargar especialidades:', err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchProfesionales();
    fetchEspecialidades();
  }, [fetchData, fetchProfesionales, fetchEspecialidades]);

  // Actualizar datos cuando cambien los filtros
  useEffect(() => {
    fetchData();
  }, [filtros.evolucionTemporal, fetchData]);

  // Actualizar datos cuando cambien los filtros - Conectado al backend
  const handleFiltroChange = (nuevosFiltros: FiltrosAvanzados) => {
    setFiltros(nuevosFiltros);
    // Los datos se actualizarán automáticamente via useEffect
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
          <span className="text-lg text-gray-600">Cargando análisis modular...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-lg text-red-600 mb-2">Error al cargar los datos</p>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  const { 
    turnosPorMes, 
    turnosPorHora, 
    turnosPorDia, 
    distribucionEspecialidades,
    estadisticasResumen 
  } = data;

  // Datos reales para especialidades según filtros
  const especialidadesFiltradas = filtros.especialidades.especialidadesSeleccionadas.length > 0
    ? distribucionEspecialidades?.filter(esp => filtros.especialidades.especialidadesSeleccionadas.includes(esp.nombre)) || []
    : distribucionEspecialidades || [];

  // Datos para gráficos (ya filtrados por el backend)
  const datosEvolucion = turnosPorMes || [];
  const datosPatrones = filtros.patrones.dimension === 'diasemana' ? turnosPorDia : turnosPorHora;

  // Tooltip personalizado para gráficos
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number; dataKey?: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value}
              {entry.dataKey?.includes('porcentaje') && '%'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Fórmula de proyección explicada
  const proyeccionExplicacion = `
    Proyección basada en tendencia actual (${estadisticasResumen.tendenciaMensual.toFixed(1)}%) 
    ajustada con factor de estacionalidad para período: ${filtros.evolucionTemporal.periodo}. 
    Profesional: ${filtros.evolucionTemporal.profesional === 'todos' ? 'Todos' : profesionales.find(p => p.id === filtros.evolucionTemporal.profesional)?.nombre || 'N/A'}
  `;

  return (
    <div className="space-y-8">
      {/* Header con información de filtros activos */}
      <div className="rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-teal-50 p-6 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-emerald-800 mb-2">Análisis Modular de Tendencias</h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Período:</strong> {filtros.evolucionTemporal.periodo.charAt(0).toUpperCase() + filtros.evolucionTemporal.periodo.slice(1)}</p>
              <p><strong>Profesional:</strong> {filtros.evolucionTemporal.profesional === 'todos' ? 'Todos' : profesionales.find(p => p.id === filtros.evolucionTemporal.profesional)?.nombre || 'N/A'}</p>
              <p><strong>Especialidad:</strong> {filtros.evolucionTemporal.especialidad === 'todas' ? 'Todas' : filtros.evolucionTemporal.especialidad}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 mb-1">Filtros Activos</div>
            <div className="flex flex-wrap gap-1 justify-end">
              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs">
                {filtros.evolucionTemporal.periodo}
              </span>
              {filtros.evolucionTemporal.profesional !== 'todos' && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                  Profesional específico
                </span>
              )}
              {filtros.evolucionTemporal.especialidad !== 'todas' && (
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                  Especialidad específica
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Variación de Consultas"
          value={`${estadisticasResumen.tendenciaMensual > 0 ? '+' : ''}${estadisticasResumen.tendenciaMensual.toFixed(1)}%`}
          change={estadisticasResumen.tendenciaMensual}
          subtitle={`Período: ${filtros.evolucionTemporal.periodo}`}
          Icon={TrendingUp}
          delay={0}
        />
        
        <MetricCard
          title="Pacientes Nuevos"
          value={estadisticasResumen.crecimientoPacientesUltimoMes}
          subtitle={`Filtro: ${filtros.evolucionTemporal.profesional === 'todos' ? 'Todos' : 'Específico'}`}
          Icon={Users}
          delay={100}
        />
        
        <MetricCard
          title="Tasa de Asistencia"
          value={`${estadisticasResumen.tasaAsistenciaPromedio.toFixed(1)}%`}
          subtitle={`Estado: ${filtros.evolucionTemporal.estado}`}
          Icon={Target}
          delay={200}
        />
      </div>

      {/* Proyección con explicación */}
      <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-emerald-100">
              <Zap className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-emerald-800">Proyección Modular</h3>
              <p className="text-sm text-gray-600">Análisis predictivo personalizable</p>
            </div>
          </div>
          <div className="text-right lg:text-center">
            <div className="text-3xl font-bold text-emerald-700 mb-1">
              {estadisticasResumen.prediccionProximoMes > 0 ? '+' : ''}
              {estadisticasResumen.prediccionProximoMes.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 max-w-md" title={proyeccionExplicacion}>
              Para {filtros.evolucionTemporal.periodo} | {filtros.evolucionTemporal.profesional === 'todos' ? 'Global' : 'Específico'}
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos principales modulares */}
      <div className="space-y-8">
        {/* Evolución Temporal Modular */}
        <Card className="rounded-3xl border-emerald-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
            <CardTitle className="flex items-center gap-3 text-emerald-800">
              <div className="p-2 rounded-lg bg-emerald-100">
                <Calendar className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <span className="text-lg">Evolución Temporal Modular</span>
                <p className="text-sm text-gray-600 font-normal">
                  Por {filtros.evolucionTemporal.periodo} | {filtros.evolucionTemporal.estado} | 
                  {filtros.evolucionTemporal.profesional === 'todos' ? ' Todos' : ' Específico'}
                </p>
              </div>
            </CardTitle>
            <PanelFiltrosAvanzados 
              tipo="evolucion" 
              filtros={filtros} 
              setFiltros={handleFiltroChange}
              opciones={{ especialidades: getEspecialidadesCombinadas(), profesionales }}
            />
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={datosEvolucion} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradientModular" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                
                <Area
                  type="monotone"
                  dataKey="total"
                  fill="url(#gradientModular)"
                  stroke="#10b981"
                  strokeWidth={3}
                  name="Total"
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="completados"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  name="Completados"
                  dot={{ fill: '#06b6d4', strokeWidth: 2, r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="cancelados"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Cancelados"
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

          {/* Especialidades mejorado */}
          <Card className="rounded-3xl border-emerald-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
              <CardTitle className="flex items-center gap-3 text-blue-800">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <span className="text-lg">Análisis por Especialidad</span>
                  <p className="text-sm text-gray-600 font-normal">
                    {filtros.especialidades.periodo}
                  </p>
                </div>
              </CardTitle>
              <PanelFiltrosAvanzados 
                tipo="especialidades" 
                filtros={filtros} 
                setFiltros={handleFiltroChange}
                opciones={{ especialidades: getEspecialidadesCombinadas(), profesionales }}
              />
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={especialidadesFiltradas} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="nombre" stroke="#6b7280" angle={-45} textAnchor="end" height={80} fontSize={11} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="cantidad" 
                    fill="#3b82f6" 
                    name="Consultas" 
                    radius={[4, 4, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Segunda fila - Gráficos de apoyo */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Distribución por Horarios */}
          <Card className="rounded-3xl border-purple-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
              <CardTitle className="flex items-center gap-3 text-purple-800">
                <div className="p-2 rounded-lg bg-purple-100">
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <span className="text-base">
                    {filtros.patrones.dimension === 'horario' ? 'Por Horarios' :
                     filtros.patrones.dimension === 'diasemana' ? 'Por Días' :
                     filtros.patrones.dimension === 'feriados' ? 'Feriados vs Normales' :
                     'Por Estaciones'}
                  </span>
                  <p className="text-xs text-gray-600 font-normal">
                    {filtros.patrones.dimension === 'horario' ? 'Patrón diario' :
                     filtros.patrones.dimension === 'diasemana' ? 'Patrón semanal' :
                     filtros.patrones.dimension === 'feriados' ? 'Análisis festivos' :
                     'Tendencia anual'}
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={datosPatrones} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <defs>
                    <linearGradient id="gradientHora" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="hora" stroke="#6b7280" fontSize={10} />
                  <YAxis stroke="#6b7280" fontSize={10} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="cantidad"
                    fill="url(#gradientHora)"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    name="Consultas"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Distribución por Días */}
          <Card className="rounded-3xl border-orange-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50 border-b border-orange-100">
              <CardTitle className="flex items-center gap-3 text-orange-800">
                <div className="p-2 rounded-lg bg-orange-100">
                  <Calendar className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <span className="text-base">Por Días</span>
                  <p className="text-xs text-gray-600 font-normal">Patrón semanal</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={turnosPorDia} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="dia" stroke="#6b7280" fontSize={10} />
                  <YAxis stroke="#6b7280" fontSize={10} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="cantidad" 
                    fill="#f59e0b" 
                    name="Consultas"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Insights Clínicos rediseñados */}
          <Card className="rounded-3xl border-teal-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-teal-100">
              <CardTitle className="flex items-center gap-3 text-teal-800">
                <div className="p-2 rounded-lg bg-teal-100">
                  <Target className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <span className="text-base">Insights Clínicos</span>
                  <p className="text-xs text-gray-600 font-normal">Patrones clave</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <div className="text-lg font-bold text-teal-700 mb-1">
                  {estadisticasResumen.horasMasConcurridas?.[0] || '--:--'}
                </div>
                <div className="text-xs text-gray-600">Hora Peak</div>
              </div>
              
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <div className="text-lg font-bold text-blue-700 mb-1">
                  {estadisticasResumen.diasMasConcurridos?.[0] || 'N/A'}
                </div>
                <div className="text-xs text-gray-600">Día de Mayor Demanda</div>
              </div>
              
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <div className="text-sm font-bold text-purple-700 mb-1 truncate" title={estadisticasResumen.especialidadMasPopular}>
                  {estadisticasResumen.especialidadMasPopular || 'N/A'}
                </div>
                <div className="text-xs text-gray-600">Especialidad Líder</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  );
}