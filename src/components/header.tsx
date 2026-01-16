'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function Header() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/auth/login');
  };

  return (
    <header className="bg-white border-b-2 border-cyan-100 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold text-cyan-700">
            Dermacor
          </Link>
          {session && (
            <Link
              href="/obras-sociales"
              className="text-cyan-600 hover:text-cyan-800 font-medium transition-colors"
            >
              Obras Sociales
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4">
          {session ? (
            <>
              <span className="text-sm text-cyan-700 font-medium">
                {session.user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 transition-colors shadow-sm"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-cyan-700 hover:bg-cyan-50 transition-colors"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/auth/register"
                className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 transition-colors shadow-sm"
              >
                Registrarse
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
