"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, ShieldPlus } from "lucide-react"
import { useForm, SubmitHandler } from "react-hook-form"
import type { InputsCreateCoseguro } from "@/types/inputsCreateCoseguro"
import NotifySuccessComponent from "@/components/obras-sociales/notifySuccess"
import NotifyNotSuccessComponent from "@/components/obras-sociales/notifyNotSuccess"
import { updateCoseguro, updateObraSocial } from "@/lib/utils"

interface UpdateModalProps {
  idCoseguro:number
  currentName: string
  onSuccess: () => void
  open: boolean
  onClose: () => void
}

export default function UpdateModalCoseguroComponent({
  idCoseguro,
  currentName,
  onSuccess,
  open,
  onClose,
}: UpdateModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [openNotifySuccess, setOpenNotify] = useState(false)
  const [openNotifyNotSuccess, setOpenNotifyNotSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InputsCreateCoseguro>({
    defaultValues: { name: currentName },
  })

  useEffect(() => {
    if (open) reset({ name: currentName })
  }, [open, currentName, reset])

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) onClose()
  }

  const onSubmit: SubmitHandler<InputsCreateCoseguro> = async (data) => {
    try {
      setIsLoading(true)

      await updateCoseguro({nombreCoseguro:data.name,id:idCoseguro})

      onSuccess()
      setOpenNotify(true)
      onClose()
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
        title="Actualización exitosa"
        description="Los datos han sido modificados (simulado)."
      />
      <NotifyNotSuccessComponent
        open={openNotifyNotSuccess}
        title="Error al actualizar"
        description="No se pudo completar la acción (simulado)."
      />

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="gap-6">
            <DialogHeader className="text-left">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-50 rounded-lg shrink-0">
                    <ShieldPlus className="h-5 w-5 text-amber-600" />
                    </div>

                    <div className="space-y-1">
                    <DialogTitle className="text-xl leading-tight">Editar Coseguro</DialogTitle>
                    <DialogDescription className="leading-snug">
                        Modifica el nombre del coseguro.
                    </DialogDescription>
                    </div>
                </div>
            </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-sm font-medium text-slate-700">
                  Nombre del Coseguro
                </Label>

                <Input
                  id="nombre"
                  placeholder="Ej: Coseguro Particular..."
                  disabled={isLoading}
                  className={`col-span-3 bg-white ${errors.name ? "border-red-500" : "border-slate-200"}`}
                  {...register("name", { required: true, minLength: 2 })}
                />

                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">Campo obligatorio</p>
                )}
              </div>
            </div>

            <DialogFooter className="gap-3 sm:gap-2 mt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancelar
              </Button>

              <Button
                type="submit"
                disabled={isLoading}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}