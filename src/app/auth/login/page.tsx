"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";

// El componente de la derecha para decoracion <3
const WavePattern = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <svg
      className="absolute w-[200%] h-[200%] top-[-50%] left-[-50%] animate-[spin_60s_linear_infinite] opacity-20"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
        d="M50 50 m-40 0 a 40 40 0 1 0 80 0 a 40 40 0 1 0 -80 0 M50 50 m-30 0 a 30 30 0 1 0 60 0 a 30 30 0 1 0 -60 0 M50 50 m-20 0 a 20 20 0 1 0 40 0 a 20 20 0 1 0 -40 0"
        className="text-cyan-200"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="0.3"
        d="M50 50 m-45 0 a 45 45 0 1 0 90 0 a 45 45 0 1 0 -90 0 M50 50 m-35 0 a 35 35 0 1 0 70 0 a 35 35 0 1 0 -70 0"
        className="text-white"
      />
    </svg>
  </div>
);

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && session) {
      router.push("/obras-sociales");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setRegistered(true);
      const timer = setTimeout(() => setRegistered(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full border-4 border-cyan-200 border-t-cyan-600 animate-spin mb-4"></div>
          <div className="text-cyan-600 font-semibold tracking-wide">Cargando Dermacor...</div>
        </div>
      </div>
    );
  }

  if (status === "authenticated") return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.ok) {
      router.push("/obras-sociales");
    } else {
      setError("Email o contraseña incorrectos");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex w-full bg-white overflow-hidden">
      
      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-20 py-12 relative z-10">
        <div className="w-full max-w-sm mx-auto animate-[fadeIn_0.5s_ease-out]">
          
          {/* Logo Brand (Opcional) */}
          <div className="mb-10 flex items-center gap-2">
            <div className="w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center text-white font-bold">D</div>
            <span className="text-xl font-bold text-gray-800 tracking-tight">Dermacor</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
              Bienvenido de nuevo
            </h2>
            <p className="text-gray-500">
              Ingresa tus credenciales para acceder al portal.
            </p>
          </div>

          {/* Alerts */}
          {registered && (
            <div className="mb-6 rounded-xl bg-cyan-50 p-4 border border-cyan-100 flex items-center gap-3 animate-[slideIn_0.3s_ease-out]">
              <div className="w-2 h-2 rounded-full bg-cyan-500" />
              <p className="text-sm text-cyan-800 font-medium">
                ¡Cuenta creada! Ya puedes iniciar sesión.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-xl bg-red-50 p-4 border border-red-100 animate-[shake_0.4s_ease-in-out]">
              <p className="text-sm text-red-600 font-medium text-center">{error}</p>
            </div>
          )}

          {/* Form */}
          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="group">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                placeholder="nombre@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-5 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 focus:bg-white transition-all duration-200"
              />
            </div>

            <div className="group">
              <div className="flex justify-between items-center mb-1.5 ml-1">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                  Contraseña
                </label>
              </div>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-5 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 focus:bg-white transition-all duration-200"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 active:scale-[0.99] text-white font-bold text-lg shadow-lg shadow-cyan-500/30 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </span>
              ) : "Iniciar Sesión"}
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm">
              ¿Aún no tienes cuenta?{' '}
              <Link
                href="/auth/register"
                className="font-bold text-cyan-600 hover:text-cyan-800 transition-colors"
              >
                Regístrate gratis
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - The "Himalayas" inspired background */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-cyan-950 items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 via-cyan-700 to-cyan-900 opacity-90 z-0"></div>
        <WavePattern />
        
        {/* Glass Effect Overlay Blob */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-400/20 rounded-full blur-[100px] animate-pulse"></div>

        {/* Content */}
        <div className="relative z-10 max-w-lg text-center px-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 mb-8 shadow-2xl shadow-cyan-900/50">
             <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
          </div>
          <h3 className="text-4xl font-bold text-white mb-6 leading-tight tracking-tight drop-shadow-sm">
            Gestión médica <br/>
            <span className="text-cyan-200">inteligente y segura</span>
          </h3>
          <p className="text-cyan-100 text-lg leading-relaxed font-light opacity-90">
            Optimiza la atención de tus pacientes y administra obras sociales con la plataforma diseñada para profesionales.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}