import ReporteEspecialidades from "@/components/reportes/ReporteEspecialidades";
import ReporteEdades from "@/components/reportes/ReporteEdades";

export default function Page() {
  return (
    <div className="space-y-10 p-6">
      <ReporteEspecialidades />
      <ReporteEdades />
    </div>
  );
}
