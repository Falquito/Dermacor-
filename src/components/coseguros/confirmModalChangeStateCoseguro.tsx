import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react"

interface ConfirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  loading: boolean
  isActive: boolean
}

export default function ConfirmModalChangeStateCoseguro({
  open,
  onOpenChange,
  onConfirm,
  loading,
  isActive,
}: ConfirmModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader className="gap-2">
          <div
            className={`
              w-10 h-10 rounded-full flex items-center justify-center mb-2
              ${isActive ? "bg-red-50 text-red-600" : "bg-cyan-50 text-cyan-600"}
            `}
          >
            {isActive ? <AlertTriangle className="h-5 w-5" /> : <RefreshCw className="h-5 w-5" />}
          </div>

          <div className="space-y-1">
            <AlertDialogTitle className="text-xl">
              {isActive ? "¿Desactivar coseguro?" : "¿Restaurar coseguro?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              {isActive
                ? "Esta acción ocultará el coseguro de los nuevos registros. El historial existente no se verá afectado."
                : "El coseguro volverá a estar disponible inmediatamente para su selección en el sistema."}
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel disabled={loading} className="border-slate-200">
            Cancelar
          </AlertDialogCancel>

          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            disabled={loading}
            className={`
              text-white shadow-sm transition-colors
              ${isActive ? "bg-red-600 hover:bg-red-700 border-red-600" : "bg-cyan-600 hover:bg-cyan-700 border-cyan-600"}
            `}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando
              </>
            ) : isActive ? (
              "Sí, desactivar"
            ) : (
              "Confirmar"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}