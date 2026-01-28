import { ShieldPlus } from "lucide-react"
import CreateModalCoseguroComponent from "./createModalCoseguro"

export default function HeaderCoseguroComponent({
  onRefresh,
  loading = false,
}: {
  onRefresh: () => void
  loading?: boolean
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-cyan-100 rounded-lg text-cyan-700">
            <ShieldPlus className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Coseguros
          </h1>
        </div>
        <p className="text-sm text-slate-500 max-w-2xl pl-11">
          Administra el padrón de coseguros y sus estados operativos.
        </p>
      </div>

      <div className="flex items-center gap-2">
        {!loading && <CreateModalCoseguroComponent onSuccess={onRefresh} />}
      </div>
    </div>
  )
}