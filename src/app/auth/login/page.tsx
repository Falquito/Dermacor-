"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";

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
    // Si ya está autenticado, redirigir a obras-sociales
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

  // Mostrar loading mientras se verifica la sesión
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-cyan-600 font-medium">Cargando...</div>
      </div>
    );
  }

  // Si ya está autenticado, no mostrar el formulario
  if (status === "authenticated") {
    return null;
  }

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
    <div className="min-h-screen flex items-center justify-center bg-white py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-xs sm:max-w-sm space-y-6 sm:space-y-8">
        <div>
          <h2 className="mt-4 sm:mt-6 text-center text-2xl sm:text-3xl font-extrabold text-cyan-900">
            Iniciar sesión
          </h2>
          <p className="mt-2 text-center text-xs sm:text-sm text-cyan-700">
            O{' '}
            <Link
              href="/auth/register"
              className="font-medium text-cyan-600 hover:text-cyan-700"
            >
              crea una nueva cuenta
            </Link>
          </p>
        </div>

        {registered && (
          <div className="rounded-md bg-cyan-50 p-3 sm:p-4 border border-cyan-200">
            <div className="flex">
              <div className="ml-2 sm:ml-3">
                <p className="text-xs sm:text-sm text-cyan-700">
                  ¡Registro exitoso! Ahora inicia sesión con tus credenciales.
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 p-3 sm:p-4 border border-red-200">
            <div className="flex">
              <div className="ml-2 sm:ml-3">
                <p className="text-xs sm:text-sm text-red-700 font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-6" onSubmit={onSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="appearance-none rounded-none relative block w-full px-3 sm:px-4 py-2 sm:py-3 border border-cyan-300 placeholder-cyan-400 text-gray-900 rounded-t-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 focus:z-10 text-sm sm:text-base"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="appearance-none rounded-none relative block w-full px-3 sm:px-4 py-2 sm:py-3 border border-cyan-300 placeholder-cyan-400 text-gray-900 rounded-b-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 focus:z-10 text-sm sm:text-base"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-2 sm:py-3 px-4 border border-transparent text-sm sm:text-base font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-cyan-600 font-medium">Cargando...</div></div>}>
      <LoginContent />
    </Suspense>
  );
}
