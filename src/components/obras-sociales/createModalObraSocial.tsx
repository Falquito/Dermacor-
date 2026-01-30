"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox"; // 1. Importamos Checkbox
import { InputsCreateObraSocial } from "@/types/inputsCreateObraSocial";
import { Plus, Loader2, Building2 } from "lucide-react";
import { useForm, SubmitHandler, Controller } from "react-hook-form"; // 2. Importamos Controller
import NotifySuccessComponent from "./notifySuccess";
import { createObraSocial } from "@/lib/utils";
import NotifyNotSuccessComponent from "./notifyNotSuccess";

export default function CreateModalObraSocialComponent({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [openNotifySuccess, setOpenNotify] = useState(false);
  const [openNotifyNotSuccess, setOpenNotifyNotSuccess] = useState(false);
  const [msgError, setMsgError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<InputsCreateObraSocial>({
    defaultValues: {
      name: "",
      admiteCoseguro: false,
    },
  });

  const onSubmit: SubmitHandler<InputsCreateObraSocial> = async (data) => {
    try {
      setIsLoading(true);
      await createObraSocial({
        nombreObraSocial: data.name,
        admiteCoseguro: data.admiteCoseguro,
      });
      onSuccess();
      setOpenNotify(true);
      setOpen(false);
      reset();
      setTimeout(() => {
        setOpenNotify(false);
      }, 2000);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setMsgError(message);
      setOpenNotifyNotSuccess(true);
      console.log(error);

      setTimeout(() => {
        setOpenNotifyNotSuccess(false);
      }, 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <NotifySuccessComponent
        open={openNotifySuccess}
        title="Operación exitosa"
        description="La nueva obra social se ha registrado en el sistema."
      />
      <NotifyNotSuccessComponent
        open={openNotifyNotSuccess}
        title="Algo ha fallado"
        description={`${msgError}`}
      ></NotifyNotSuccessComponent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm transition-all hover:shadow-md">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Obra Social
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[500px] gap-6">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-cyan-50 rounded-lg">
                <Building2 className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">Nueva Obra Social</DialogTitle>
                <DialogDescription>
                  Ingresa los datos para dar de alta una nueva cobertura médica.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form id="create-obra-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-6 py-2">
              {/* Input Nombre */}
              <div className="space-y-2">
                <Label
                  htmlFor="nombre"
                  className="text-sm font-medium text-slate-700"
                >
                  Nombre de la Obra Social
                </Label>
                <Input
                  id="nombre"
                  placeholder="Ej: OSDE, Swiss Medical, Galeno..."
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

              {/* 4. Checkbox Admite Coseguro */}
              <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                <Controller
                  name="admiteCoseguro"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="admiteCoseguro"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                      className="data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                    />
                  )}
                />
                <div className="space-y-1 leading-none">
                  <Label
                    htmlFor="admiteCoseguro"
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    Admite Coseguro
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Marca esta casilla si la obra social permite planes con
                    coseguro.
                  </p>
                </div>
              </div>
            </div>
          </form>

          <DialogFooter className="gap-3 sm:gap-1">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
              className="border-slate-200 hover:bg-slate-50 text-slate-700"
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              form="create-obra-form"
              disabled={isLoading}
              className="bg-cyan-600 hover:bg-cyan-700 text-white min-w-[120px]"
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
  );
}
