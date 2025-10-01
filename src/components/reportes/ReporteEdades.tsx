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
  rango: string;
  total: number;
}

interface Range {
  min: number;
  max: number;
  label: string;
}

const COLORS = ["#4F46E5", "#22C55E", "#EAB308", "#EC4899", "#06B6D4", "#F97316"];

export default function ReporteEdades() {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [data, setData] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const [ranges, setRanges] = useState<Range[]>([]);
  const [newMin, setNewMin] = useState<string>("");
  const [newMax, setNewMax] = useState<string>("");
  const [newLabel, setNewLabel] = useState<string>("");

  const [editIndex, setEditIndex] = useState<number | null>(null);

  const addOrEditRange = () => {
    if (!newMin || !newMax || !newLabel) {
      setErrorMsg("⚠️ Complete todos los campos del intervalo de edad.");
      return;
    }

    const min = parseInt(newMin);
    const max = parseInt(newMax);

    if (isNaN(min) || isNaN(max)) {
      setErrorMsg("⚠️ Los valores mínimo y máximo deben ser números.");
      return;
    }

    if (min < 0) {
      setErrorMsg("⚠️ La edad mínima no puede ser negativa.");
      return;
    }

    if (max > 120) {
      setErrorMsg("⚠️ La edad máxima no puede ser mayor a 120.");
      return;
    }

    if (min >= max) {
      setErrorMsg("⚠️ La edad mínima debe ser menor que la máxima.");
      return;
    }

    // Si estamos editando, reemplazamos
    if (editIndex !== null) {
      const updatedRanges = [...ranges];
      updatedRanges[editIndex] = { min, max, label: newLabel };
      setRanges(updatedRanges.sort((a, b) => a.min - b.min));
      setEditIndex(null);
    } else {
      // Validación de solapamiento al agregar
      const overlap = ranges.some(
        (r) => !(max < r.min || min > r.max)
      );
      if (overlap) {
        setErrorMsg("⚠️ El intervalo se solapa con otro existente.");
        return;
      }

      const newRanges = [...ranges, { min, max, label: newLabel }].sort(
        (a, b) => a.min - b.min
      );
      setRanges(newRanges);
    }

    setNewMin("");
    setNewMax("");
    setNewLabel("");
    setErrorMsg("");
  };

  const removeRange = (index: number) => {
    setRanges(ranges.filter((_, i) => i !== index));
    if (editIndex === index) {
      setEditIndex(null);
      setNewMin("");
      setNewMax("");
      setNewLabel("");
    }
  };

  const editRange = (index: number) => {
    const r = ranges[index];
    setNewMin(r.min.toString());
    setNewMax(r.max.toString());
    setNewLabel(r.label);
    setEditIndex(index);
  };

  const fetchReport = async () => {
    if (!startDate || !endDate) {
      setErrorMsg("⚠️ Seleccione un rango de fechas antes de generar el reporte.");
      return;
    }

    if (ranges.length === 0) {
      setErrorMsg("⚠️ Configure al menos un intervalo de edad antes de generar el reporte.");
      return;
    }

    setErrorMsg("");
    setLoading(true);

    const res = await fetch("/api/reportes/edades", {
      method: "POST",
      body: JSON.stringify({ startDate, endDate, ranges }),
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      const result: ReportData[] = await res.json();
      setData(result);
    }

    setLoading(false);
  };

  const totalPacientes = data.reduce((acc, d) => acc + d.total, 0);

  return (
    <div className="p-6 space-y-6 bg-white shadow-xl rounded-2xl border border-gray-200">
      <h1 className="text-2xl font-bold text-gray-800">
        📊 Reporte de Pacientes por Edad
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

      {/* Mensajes de error */}
      {errorMsg && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Configuración de rangos */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-700">
          Configuración de Rangos de Edad
        </h2>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="number"
            placeholder="Mín"
            min={0}
            max={120}
            value={newMin}
            onChange={(e) => setNewMin(e.target.value)}
            className="w-20 border rounded-lg px-2 py-1 text-sm"
          />
          <input
            type="number"
            placeholder="Máx"
            min={0}
            max={120}
            value={newMax}
            onChange={(e) => setNewMax(e.target.value)}
            className="w-20 border rounded-lg px-2 py-1 text-sm"
          />
          <input
            type="text"
            placeholder="Etiqueta"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className="border rounded-lg px-2 py-1 text-sm"
          />
          <button
            onClick={addOrEditRange}
            className={`${
              editIndex !== null
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-green-600 hover:bg-green-700"
            } text-white px-4 py-1 rounded-lg text-sm`}
          >
            {editIndex !== null ? "Guardar edición" : "+ Agregar"}
          </button>
        </div>

        {/* Lista de rangos */}
        {ranges.length > 0 ? (
          <ul className="space-y-1">
            {ranges.map((r, i) => (
              <li
                key={i}
                className="flex justify-between items-center bg-gray-100 px-3 py-1 rounded-lg text-sm"
              >
                <span>
                  {r.label}: {r.min} - {r.max}
                </span>
                <div className="space-x-2">
                  <button
                    onClick={() => editRange(i)}
                    className="text-blue-600 hover:underline text-xs"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => removeRange(i)}
                    className="text-red-600 hover:underline text-xs"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm italic text-gray-500">
            No hay intervalos configurados todavía.
          </p>
        )}
      </div>

      {/* Resultados */}
      {data.length > 0 ? (
        <div className="space-y-4">
          <p className="font-medium text-gray-700">
            📌 Total de pacientes analizados:{" "}
            <span className="font-bold">{totalPacientes}</span>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Gráfico de barras */}
            <div className="bg-gray-50 border border-black rounded-xl p-4 shadow-md">
              <h2 className="text-lg font-semibold text-gray-700 mb-3">
                Distribución por Edad (Barras)
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                  <XAxis dataKey="rango" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="total"
                    fill="#22C55E"
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
                Distribución por Edad (Torta)
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.map((d) => ({ name: d.rango, value: d.total }))}
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
        </div>
      ) : (
        <div className="text-center text-gray-500 italic">
          {loading
            ? "Generando reporte..."
            : "Seleccione fechas y configure rangos para ver resultados"}
        </div>
      )}
    </div>
  );
}
