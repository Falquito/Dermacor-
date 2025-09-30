"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import ObservacionesEditor from "@/components/ObservacionesEditor";

export default function ConsultaDesdeAgendaPage() {
  const [deleting, setDeleting] = useState(false);
  const search = useSearchParams();
  const appointmentId = search.get("id") ?? "";

  async function handleDelete() {
    if (!appointmentId) return;
    const ok = window.confirm(
      "¿Eliminar definitivamente este turno? Esta acción no se puede deshacer."
    );
    if (!ok) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/appointments/${appointmentId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "No se pudo eliminar el turno");
      }
      // Avisar a la agenda si está abierta en otra pestaña
      window.dispatchEvent(new CustomEvent("appt:deleted", { detail: { id: appointmentId } }));
      // Volver a la agenda
      window.location.href = "/profesional/agenda";
    } catch (e: unknown) {
      if (e instanceof Error) {
        alert(e.message || "Error al eliminar el turno");
      } else {
        alert("Error al eliminar el turno");
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">

      <div className="flex-1 flex flex-col">

        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6 md:p-8 border-l-4 border-l-emerald-500">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Consulta</h1>
            <p className="text-gray-600 mb-6 text-sm md:text-base">
              Aquí podrás agregar observaciones y finalizar la consulta.
            </p>

            {!appointmentId ? (
              <div className="text-sm text-red-600">
                Falta el parámetro <code>id</code> en la URL. Volvé a la{" "}
                <a className="underline text-emerald-700" href="/profesional/agenda">Agenda</a>.
              </div>
            ) : (
              <>
                <ObservacionesEditor appointmentId={appointmentId} />

                {/* Acciones inferiores */}
                <div className="mt-6 flex items-center justify-between">
                  <a
                    href="/profesional/agenda"
                    className="text-sm text-emerald-700 underline"
                  >
                    ← Volver a la agenda
                  </a>

                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="rounded-xl bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {deleting ? "Eliminando…" : "Eliminar consulta"}
                  </button>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
