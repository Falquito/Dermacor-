"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormMessage {
  type: "success" | "error";
  text: string;
}

export function UserSettingsModal({ open, onOpenChange }: UserSettingsModalProps) {
  const { user, refreshSession } = useAuth();

  // Estado del formulario de nombre
  const [name, setName] = useState(user?.name || "");
  const [nameLoading, setNameLoading] = useState(false);
  const [nameMessage, setNameMessage] = useState<FormMessage | null>(null);

  // Estado del formulario de contraseña
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<FormMessage | null>(null);

  // Visibilidad de contraseñas
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Resetear formularios cuando se abre el modal
  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (newOpen) {
      setName(user?.name || "");
      setNameMessage(null);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage(null);
    }
    onOpenChange(newOpen);
  }, [user?.name, onOpenChange]);

  // Actualizar nombre
  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameLoading(true);
    setNameMessage(null);

    try {
      const response = await fetch("/api/user/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "name", name: name.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setNameMessage({ type: "error", text: data.error });
        return;
      }

      setNameMessage({ type: "success", text: "Nombre actualizado correctamente" });
      await refreshSession();
    } catch {
      setNameMessage({ type: "error", text: "Error al actualizar el nombre" });
    } finally {
      setNameLoading(false);
    }
  };

  // Actualizar contraseña
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage(null);

    // Validaciones del lado del cliente
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "Las contraseñas no coinciden" });
      setPasswordLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: "error", text: "La contraseña debe tener al menos 6 caracteres" });
      setPasswordLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/user/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "password",
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPasswordMessage({ type: "error", text: data.error });
        return;
      }

      setPasswordMessage({ type: "success", text: "Contraseña actualizada correctamente" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setPasswordMessage({ type: "error", text: "Error al actualizar la contraseña" });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Componente de mensaje
  const FormMessageDisplay = ({ message }: { message: FormMessage | null }) => {
    if (!message) return null;

    return (
      <div
        className={cn(
          "flex items-center gap-2 p-3 rounded-lg text-sm animate-in fade-in slide-in-from-top-1 duration-200",
          message.type === "success"
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : "bg-red-50 text-red-700 border border-red-200"
        )}
      >
        {message.type === "success" ? (
          <CheckCircle2 className="h-4 w-4 shrink-0" />
        ) : (
          <AlertCircle className="h-4 w-4 shrink-0" />
        )}
        <span>{message.text}</span>
      </div>
    );
  };

  // Toggle de visibilidad de contraseña
  const PasswordToggle = ({
    show,
    onToggle,
  }: {
    show: boolean;
    onToggle: () => void;
  }) => (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
    >
      {show ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-cyan-700">
            <User className="h-5 w-5" />
            Configuración de cuenta
          </DialogTitle>
          <DialogDescription>
            Administra tu información personal y seguridad
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full mt-2">
          <TabsList className="grid w-full grid-cols-2 bg-cyan-50">
            <TabsTrigger
              value="profile"
              className="data-[state=active]:bg-white data-[state=active]:text-cyan-700 data-[state=active]:shadow-sm"
            >
              <User className="h-4 w-4 mr-2" />
              Perfil
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="data-[state=active]:bg-white data-[state=active]:text-cyan-700 data-[state=active]:shadow-sm"
            >
              <Lock className="h-4 w-4 mr-2" />
              Seguridad
            </TabsTrigger>
          </TabsList>

          {/* Tab: Perfil */}
          <TabsContent value="profile" className="mt-4 space-y-4">
            <form onSubmit={handleUpdateName} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-600">
                  Correo electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400">
                  El correo electrónico no puede ser modificado
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700">
                  Nombre
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  maxLength={100}
                  className="border-gray-200 focus:border-cyan-400 focus:ring-cyan-400/20"
                />
              </div>

              <FormMessageDisplay message={nameMessage} />

              <Button
                type="submit"
                disabled={nameLoading || name.trim() === (user?.name || "")}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white transition-all"
              >
                {nameLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Guardando...
                  </>
                ) : (
                  "Guardar cambios"
                )}
              </Button>
            </form>
          </TabsContent>

          {/* Tab: Seguridad */}
          <TabsContent value="security" className="mt-4 space-y-4">
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-gray-700">
                  Contraseña actual
                </Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pr-10 border-gray-200 focus:border-cyan-400 focus:ring-cyan-400/20"
                  />
                  <PasswordToggle
                    show={showCurrentPassword}
                    onToggle={() => setShowCurrentPassword(!showCurrentPassword)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-gray-700">
                  Nueva contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pr-10 border-gray-200 focus:border-cyan-400 focus:ring-cyan-400/20"
                  />
                  <PasswordToggle
                    show={showNewPassword}
                    onToggle={() => setShowNewPassword(!showNewPassword)}
                  />
                </div>
                <p className="text-xs text-gray-400">
                  Mínimo 6 caracteres
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-700">
                  Confirmar nueva contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={cn(
                      "pr-10 border-gray-200 focus:border-cyan-400 focus:ring-cyan-400/20",
                      confirmPassword &&
                        newPassword !== confirmPassword &&
                        "border-red-300 focus:border-red-400"
                    )}
                  />
                  <PasswordToggle
                    show={showConfirmPassword}
                    onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500">Las contraseñas no coinciden</p>
                )}
              </div>

              <FormMessageDisplay message={passwordMessage} />

              <Button
                type="submit"
                disabled={
                  passwordLoading ||
                  !currentPassword ||
                  !newPassword ||
                  !confirmPassword ||
                  newPassword !== confirmPassword
                }
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white transition-all"
              >
                {passwordLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Actualizando...
                  </>
                ) : (
                  "Cambiar contraseña"
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
