"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

type Serie = { date: string; count: number | string };

type Props = {
  isLoading?: boolean;
  mesActual?: number;
  mesAnterior?: number;
  variacionPct?: number | null;
  serieUltimos30Dias?: Serie[];
};

const MONTHS_ES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function formatDateShort(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  const day = String(d.getDate()).padStart(2, "0");
  const mon = MONTHS_ES[d.getMonth()] ?? "??";
  return `${day}-${mon}`; // ej: 31-dic
}

function deltaLabel(v: number | null | undefined) {
  if (v === null || v === undefined) return "—";
  return `${v > 0 ? "+" : ""}${v}%`;
}

function avg(arr: number[]) {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export default function ConsultasMesCard({
  isLoading = false,
  mesActual = 0,
  mesAnterior = 0,
  variacionPct = null,
  serieUltimos30Dias = [],
}: Props) {
  const data = (serieUltimos30Dias ?? []).map((p) => ({
    date: p.date,
    count: Number(p.count),
  }));

  const CYAN = "#0891b2";
  const CYAN_SOFT = "rgba(8,145,178,0.18)";

  // Tendencia (últimos 7 vs 7 anteriores)
  const counts = data.map((d) => (Number.isFinite(d.count) ? d.count : 0));
  const last7 = counts.slice(-7);
  const prev7 = counts.slice(-14, -7);

  const last7Avg = avg(last7);
  const prev7Avg = avg(prev7);

  const trendPct =
    prev7Avg === 0
      ? last7Avg === 0
        ? 0
        : 100
      : ((last7Avg - prev7Avg) / prev7Avg) * 100;

  const isUp = trendPct > 5;
  const isDown = trendPct < -5;
  const isFlat = !isUp && !isDown;

  const TrendIcon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;
  const trendLabel = isUp
    ? "Tendencia al alza"
    : isDown
    ? "Tendencia a la baja"
    : "Tendencia estable";

  const trendText =
    prev7.length < 7
      ? "Tendencia (se necesitan más datos)"
      : `${trendLabel} (${trendPct > 0 ? "+" : ""}${Math.round(trendPct)}%)`;

  return (
    <Card className="shadow-sm">
      <CardHeader className="space-y-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Consultas Realizadas (Últimos 30 dias)</CardTitle>

          {isLoading ? (
            <Skeleton className="h-5 w-16" />
          ) : (
            <Badge className="bg-cyan-100 text-cyan-700 hover:bg-cyan-100">
              {deltaLabel(variacionPct)}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div className="space-y-2">

            <div>
              <div className="text-3xl font-semibold tracking-tight leading-none">
                {mesActual}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Mes anterior: <span className="font-medium">{mesAnterior}</span>
                {variacionPct === null ? " · sin base de comparación" : ""}
              </div>
            </div>

            {/* Chart */}
            <div className="h-32 rounded-md border bg-white">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data}
                  margin={{ top: 10, right: 12, bottom: 14, left: 12 }}
                >
                  <CartesianGrid vertical={false} stroke={CYAN_SOFT} />

                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDateShort}
                    tick={{ fontSize: 11, fill: CYAN }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    minTickGap={14}
                    dy={6}
                  />

                  <YAxis hide domain={[0, (m: number) => Math.max(3, m + 1)]} />

                  <Tooltip
                    cursor={{ stroke: CYAN_SOFT }}
                    formatter={(value) => [`${value}`, "Cantidad"]}
                    labelFormatter={(label) => formatDateShort(String(label))}
                    contentStyle={{
                      borderRadius: 10,
                      border: `1px solid ${CYAN_SOFT}`,
                      background: "#ffffff",
                    }}
                    labelStyle={{ color: CYAN, fontWeight: 600 }}
                  />

                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke={CYAN}
                    strokeWidth={3}
                    dot={false}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    isAnimationActive={false}
                    activeDot={{ r: 4, fill: CYAN, stroke: "#ffffff", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
              <TrendIcon className="h-4 w-4" style={{ color: CYAN }} />
              <span>{trendText}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
