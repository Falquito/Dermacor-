'use client';

import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { useSidebarContext } from '@/components/ui/sidebar-context';
import LogoComponentHeader from './logoHeader';

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  
  const { toggleMobileMenu } = useSidebarContext();

  return (
    <header className="h-16 bg-white border-b border-cyan-100 shadow-sm sticky top-0 z-50">
      <nav className=" mx-auto px-4 sm:px-6 lg:px-8 h-full flex justify-between items-center">
        
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleMobileMenu}
            className="md:hidden p-2 text-cyan-700 hover:bg-cyan-50 rounded-md transition-colors"
          >
            <Menu size={24} />
          </button>
            <LogoComponentHeader/>
        </div>

        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-cyan-700 font-medium truncate max-w-xs">
                {user?.email}
              </span>
              <button
                onClick={logout}
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