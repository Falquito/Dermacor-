'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

// Reutilizamos el patrón de ondas (o puedes importarlo si lo extraes a un componente)
const WavePattern = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <svg
      className="absolute w-[200%] h-[200%] top-[-50%] left-[-50%] animate-[spin_50s_linear_infinite] opacity-30"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
       <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.2" className="text-cyan-300/30" />
       <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="0.3" className="text-cyan-200/40" />
       <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="0.4" className="text-white/20" />
       <path
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
        d="M50 50 m-40 0 a 40 40 0 1 0 80 0 a 40 40 0 1 0 -80 0"
        className="text-cyan-400/20"
      />
    </svg>
    <div className="absolute inset-0 bg-gradient-to-bl from-cyan-800/90 via-cyan-600/80 to-cyan-500/50" />
  </div>
);

export default function RegisterPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });

  useEffect(() => {
    if (status === "authenticated" && session) {
      router.push("/obras-sociales");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
       <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full border-4 border-cyan-200 border-t-cyan-600 animate-spin mb-4"></div>
        </div>
      </div>
    );
  }

  if (status === "authenticated") return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('Todos los campos son requeridos');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name || formData.email.split('@')[0],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al registrarse');
        setLoading(false);
        return;
      }
      router.push('/auth/login?registered=true');
    } catch {
      setError('Error al conectar con el servidor');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-white overflow-hidden">
      
      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-20 py-12 relative z-10">
        <div className="w-full max-w-sm mx-auto animate-[fadeIn_0.6s_ease-out]">
          
          <div className="mb-10 flex items-center gap-2">
            <div className="w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center text-white font-bold">D</div>
            <span className="text-xl font-bold text-gray-800 tracking-tight">Dermacor</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
              Crear una cuenta
            </h2>
            <p className="text-gray-500">
              Empieza a gestionar tu consultorio hoy mismo.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl bg-red-50 p-4 border border-red-100 flex items-center gap-3">
               <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
                Nombre completo <span className="text-gray-400 font-normal">(Opcional)</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Dr. Juan Pérez"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-5 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 focus:bg-white transition-all duration-200"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="tu@correo.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-5 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 focus:bg-white transition-all duration-200"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="Mín. 6 caracteres"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-5 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 focus:bg-white transition-all duration-200"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
                  Confirmar
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  placeholder="Repetir contraseña"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-5 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 focus:bg-white transition-all duration-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 active:scale-[0.99] text-white font-bold text-lg shadow-lg shadow-cyan-500/30 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {loading ? 'Creando cuenta...' : 'Continuar'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-gray-500 text-sm">
              ¿Ya tienes cuenta?{' '}
              <Link
                href="/auth/login"
                className="font-bold text-cyan-600 hover:text-cyan-800 transition-colors"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Gradient Background */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-cyan-900 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-950 via-cyan-800 to-cyan-600 opacity-90"></div>
        <WavePattern />
        
        <div className="relative z-10 text-center px-12 max-w-lg">
           <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 mb-8 shadow-2xl shadow-cyan-900/50">
             <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
          </div>
          <h3 className="text-4xl font-bold text-white mb-6 leading-tight tracking-tight">Únete a Dermacor</h3>
          <p className="text-cyan-100 text-lg leading-relaxed font-light opacity-90">
            La plataforma integral para gestionar pacientes, citas y obras sociales de forma centralizada.
          </p>
        </div>
      </div>
    </div>
  );
}