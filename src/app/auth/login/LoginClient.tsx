"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import InteractiveBackground from "@/components/auth/InteractiveBackground";
import LogoComponent from "@/components/Logo";
import LoadingLogo from "@/components/LoadingLogo";

function safeCallbackUrl(value: string | null) {
  if (!value) return "/";
  try {
    if (value.startsWith("/")) return value;
    return "/";
  } catch {
    return "/";
  }
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoaded, setIsLoaded] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setRegistered(true);
      const timer = setTimeout(() => setRegistered(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const callbackUrl = safeCallbackUrl(searchParams.get("callbackUrl"));

      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (res?.ok) {
        // Resetear sidebar a estado abierto al iniciar sesión
        try {
          localStorage.setItem("sidebar-collapsed", "false");
        } catch {
          // Ignorar errores de localStorage
        }
        router.replace(callbackUrl);
        router.refresh();
      } else {
        setError("Email o contraseña incorrectos");
        setLoading(false);
      }
    } catch (err) {
      console.error("Error al iniciar sesión:", err);
      setError("Error al conectar con el servidor");
      setLoading(false);
    }
  }

  return (
    <>
      {/* Pantalla de carga */}
      {!isLoaded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-linear-to-br from-cyan-900 via-cyan-950 to-slate-900">
          <div className="flex flex-col items-center gap-6">
            <LoadingLogo size={100} />
            <p className="text-cyan-200/80 text-sm font-medium tracking-wide animate-pulse">
              Cargando...
            </p>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <div
        className={`min-h-dvh w-full flex flex-col lg:flex-row relative overflow-hidden transition-opacity duration-500 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Fondo interactivo - Siempre absoluto, visible a través de la curva en desktop */}
        <div className="absolute inset-0 z-0 bg-linear-to-br from-cyan-900 via-cyan-950 to-slate-900">
          <InteractiveBackground />
        </div>

        {/* Contenedor del formulario */}
        <div className="w-full relative z-10 flex flex-col min-h-dvh px-4 py-6 sm:py-8 lg:w-[55%] lg:order-1 lg:px-0 lg:py-0">
          
          {/* Fondo blanco con curva recortada - Solo desktop */}
          <div className="hidden lg:block absolute inset-0 z-0">
            <svg 
              viewBox="0 0 100 100" 
              preserveAspectRatio="none" 
              className="h-full w-full"
            >
              <path 
                d="M0 0 L85 0 Q100 50 85 100 L0 100 Z" 
                className="fill-white"
              />
            </svg>
          </div>
          
          {/* Logo en esquina superior izquierda - Solo desktop, responsive */}
          <div className="hidden lg:block absolute top-5 left-5 xl:top-6 xl:left-8 2xl:top-8 2xl:left-10 z-20">
            <LogoComponent className="lg:text-xl xl:text-2xl 2xl:text-3xl" showIcon />
          </div>

          {/* Contenedor centrado del formulario */}
          <div className="relative z-10 flex-1 flex items-center justify-center lg:px-8 lg:pr-20 xl:px-12 xl:pr-28 2xl:px-16 2xl:pr-36">
            {/* Tarjeta del formulario - Con burbuja en móvil, sin burbuja en desktop */}
            <div
              className="w-full max-w-85 sm:max-w-sm md:max-w-md
                        px-5 sm:px-6 md:px-8 py-6 sm:py-8
                        bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl 
                        shadow-2xl shadow-black/10 border border-white/50
                        lg:bg-transparent lg:shadow-none lg:border-none lg:rounded-none
                        lg:max-w-md lg:px-0 lg:py-0"
            >
              {/* Header con logo - Logo visible solo en móvil dentro de la tarjeta */}
              <div className="mb-5 sm:mb-6 lg:mb-8 text-center lg:text-left">
                <div className="flex items-center justify-center gap-2 mb-4 sm:mb-5 lg:hidden">
                  <LogoComponent size="md" showIcon />
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-[1.75rem] xl:text-3xl font-bold text-gray-900 mb-1.5 lg:mb-2 tracking-tight">
                  Bienvenido de nuevo
                </h2>
                <p className="text-gray-500 text-sm sm:text-base lg:text-sm xl:text-base">
                  Ingresa tus credenciales para acceder.
                </p>
              </div>

            {/* Mensaje de registro exitoso */}
            {registered && (
              <div className="mb-4 sm:mb-6 rounded-xl bg-emerald-50 p-3 sm:p-4 border border-emerald-100 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <p className="text-sm text-emerald-700 font-medium">
                  ¡Cuenta creada! Ya puedes iniciar sesión.
                </p>
              </div>
            )}

            {/* Mensaje de error */}
            {error && (
              <div className="mb-4 sm:mb-6 rounded-xl bg-red-50 p-3 sm:p-4 border border-red-100 flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}

            {/* Formulario */}
            <form className="space-y-4 sm:space-y-5" onSubmit={onSubmit}>
              {/* Campo email */}
              <div className="group">
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1"
                >
                  Correo electrónico
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-cyan-500 transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    id="email"
                    type="email"
                    placeholder="nombre@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3 sm:py-3.5 rounded-xl border border-gray-200 
                             bg-gray-50 text-gray-900 placeholder-gray-400 text-sm sm:text-base
                             focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 
                             focus:bg-white transition-all duration-200"
                  />
                </div>
              </div>

              {/* Campo contraseña */}
              <div className="group">
                <div className="flex justify-between items-center mb-1.5 ml-1">
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Contraseña
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-cyan-500 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-11 pr-12 py-3 sm:py-3.5 rounded-xl border border-gray-200 
                             bg-gray-50 text-gray-900 placeholder-gray-400 text-sm sm:text-base
                             focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 
                             focus:bg-white transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 
                             hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Botón submit */}
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full py-3.5 sm:py-4 px-6 rounded-xl overflow-hidden
                         bg-linear-to-r from-cyan-600 to-sky-500 
                         text-white font-bold text-base sm:text-lg 
                         shadow-lg shadow-cyan-500/25 
                         transition-all duration-300 ease-out
                         hover:shadow-xl hover:shadow-cyan-500/30 hover:scale-[1.02]
                         active:scale-[0.98] 
                         disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:scale-100
                         flex items-center justify-center gap-2 mt-6"
              >
                {/* Efecto de brillo animado */}
                <span className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent 
                               translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700 ease-in-out" />
                
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <span>Iniciar Sesión</span>
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform duration-200" />
                  </>
                )}
              </button>
            </form>

            {/* Link a registro */}
            <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-gray-200/50 text-center">
              <p className="text-gray-500 text-sm">
                ¿Aún no tienes cuenta?{" "}
                <Link
                  href="/auth/register"
                  className="font-semibold text-cyan-600 hover:text-cyan-700 transition-colors 
                           underline-offset-2 hover:underline decoration-2"
                >
                  Crear cuenta
                </Link>
              </p>
            </div>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}

export default function LoginClient() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
