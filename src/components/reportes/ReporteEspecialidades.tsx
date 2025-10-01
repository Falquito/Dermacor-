"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ReportData {
  id: string;
  nombre: string;
  total: number;
}

const COLORS = ["#4F46E5", "#22C55E", "#EAB308", "#EC4899", "#06B6D4", "#F97316"];

export default function ReporteEspecialidades() {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [data, setData] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const fetchReport = async () => {
    if (!startDate || !endDate) {
      setErrorMsg("⚠️ Seleccione un rango de fechas antes de generar el reporte.");
      return;
    }

    setErrorMsg("");
    setLoading(true);

    const res = await fetch("/api/reportes/especialidades", {
      method: "POST",
      body: JSON.stringify({ startDate, endDate }),
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      const result: ReportData[] = await res.json();
      setData(result);
    }

    setLoading(false);
  };

  return (
    <div className="p-6 space-y-6 bg-white shadow-xl rounded-2xl border border-gray-200">
      <h1 className="text-2xl font-bold text-gray-800">
        📊 Reporte de Consultas por Especialidad
      </h1>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Desde:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              if (endDate && e.target.value > endDate) {
                setEndDate("");
              }
            }}
            className="border rounded-lg px-3 py-2 text-sm shadow-sm focus:ring focus:ring-indigo-200"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Hasta:</label>
          <input
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm shadow-sm focus:ring focus:ring-indigo-200"
          />
        </div>
        <button
          onClick={fetchReport}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg shadow-md transition"
        >
          {loading ? "Cargando..." : "Generar"}
        </button>
      </div>

      {errorMsg && (
        <div className="text-red-600 text-sm font-medium">{errorMsg}</div>
      )}

      {/* Resultados */}
      {data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Gráfico de barras */}
          <div className="bg-gray-50 border border-black rounded-xl p-4 shadow-md">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">
              Distribución (Barras)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <XAxis dataKey="nombre" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="total"
                  fill="#4F46E5"
                  stroke="#000000"
                  strokeWidth={1}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de torta */}
          <div className="bg-gray-50 border border-black rounded-xl p-4 shadow-md">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">
              Distribución (Torta)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.map((d) => ({ name: d.nombre, value: d.total }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={{ fontSize: 10 }}
                  stroke="#000000"
                  strokeWidth={1}
                >
                  {data.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      stroke="#000000"
                      strokeWidth={1}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 italic">
          {loading
            ? "Generando reporte..."
            : "Seleccione un rango de fechas para ver resultados"}
        </div>
      )}
    </div>
  );
}
