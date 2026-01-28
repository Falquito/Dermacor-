"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Loader2, ShieldPlus } from "lucide-react"
import { useForm, SubmitHandler } from "react-hook-form"
import type { InputsCreateCoseguro } from "@/types/inputsCreateCoseguro"
import NotifySuccessComponent from "@/components/obras-sociales/notifySuccess"
import NotifyNotSuccessComponent from "@/components/obras-sociales/notifyNotSuccess"

export default function CreateModalCoseguroComponent({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [openNotifySuccess, setOpenNotify] = useState(false)
  const [openNotifyNotSuccess, setOpenNotifyNotSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InputsCreateCoseguro>()

  const onSubmit: SubmitHandler<InputsCreateCoseguro> = async () => {
    try {
      setIsLoading(true)

      // ✅ Solo UI (simulación)
      await new Promise((r) => setTimeout(r, 600))

      onSuccess()
      setOpenNotify(true)
      setOpen(false)
      reset()

      setTimeout(() => setOpenNotify(false), 2000)
    } catch (error) {
      console.log(error)
      setOpenNotifyNotSuccess(true)
      setTimeout(() => setOpenNotifyNotSuccess(false), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <NotifySuccessComponent
        open={openNotifySuccess}
        title="Operación exitosa"
        description="El nuevo coseguro se ha registrado (simulado)."
      />
      <NotifyNotSuccessComponent
        open={openNotifyNotSuccess}
        title="Algo ha fallado"
        description="No se pudo completar la acción (simulado)."
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm transition-all hover:shadow-md">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Coseguro
          </Button>
        </DialogTrigger>

        <DialogContent className="gap-6">
            <DialogHeader className="text-left">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-cyan-50 rounded-lg shrink-0">
                    <ShieldPlus className="h-5 w-5 text-cyan-600" />
                    </div>

                    <div className="space-y-1">
                    <DialogTitle className="text-xl leading-tight">Nuevo Coseguro</DialogTitle>
                    <DialogDescription className="leading-snug">
                        Ingresa los datos para dar de alta un nuevo coseguro.
                    </DialogDescription>
                    </div>
                </div>
            </DialogHeader>

          <form id="create-coseguro-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-sm font-medium text-slate-700">
                  Nombre del Coseguro
                </Label>

                <Input
                  id="nombre"
                  placeholder="Ej: Coseguro Particular..."
                  disabled={isLoading}
                  className={`
                    col-span-3 bg-white focus-visible:ring-2 focus-visible:ring-cyan-500/20 focus-visible:border-cyan-500 transition-all
                    ${errors.name ? "border-red-500 focus-visible:ring-red-500" : "border-slate-200"}
                  `}
                  {...register("name", { required: true, minLength: 2 })}
                />

                {errors.name && (
                  <p className="text-red-500 text-xs font-medium flex items-center mt-1">
                    Este campo es obligatorio
                  </p>
                )}
              </div>
            </div>
          </form>

          <DialogFooter className="gap-3 sm:gap-1">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
              className="border-slate-200 hover:bg-slate-50 text-slate-700"
              type="button"
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              form="create-coseguro-form"
              disabled={isLoading}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando
                </>
              ) : (
                "Guardar Registro"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}