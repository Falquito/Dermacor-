"use client";

import { useCallback, useEffect, useState } from "react";
import type { EstadisticasHomeResponse } from "@/app/api/estadisticas/home/dto/estadisticas-home.dto";

type State = {
  data: EstadisticasHomeResponse | null;
  isLoading: boolean;
  error: string | null;
};

export function useEstadisticasHome() {
  const [state, setState] = useState<State>({
    data: null,
    isLoading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }));

    try {
      const res = await fetch("/api/estadisticas/home", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Error al cargar estadísticas");
      }

      const json = (await res.json()) as EstadisticasHomeResponse;
      setState({ data: json, isLoading: false, error: null });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error inesperado";
      setState({ data: null, isLoading: false, error: msg });
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...state,
    refetch: fetchData,
  };
}
