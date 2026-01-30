'use client';

import { Menu } from 'lucide-react';
import { useSidebarContext } from '@/components/ui/sidebar-context';
import LogoComponentHeader from './logoHeader';
import Link from 'next/link';
import Image from 'next/image';

export function Header() {
  const { toggleMobileMenu, isCollapsed } = useSidebarContext();

  return (
    <header className="h-16 bg-white border-b border-cyan-100 shadow-sm sticky top-0 z-50">
      <nav className="h-full flex justify-between items-center">
        <div className={`flex items-center h-full transition-all duration-300 ease-out ${isCollapsed ? 'md:w-20 md:justify-center' : 'md:w-64'} px-4 md:pl-6`}>
          <button 
            onClick={toggleMobileMenu}
            className="md:hidden p-2 text-cyan-700 hover:bg-cyan-50 rounded-md transition-colors mr-2"
          >
            <Menu size={24} />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <Image 
              src="/favicon.ico" 
              alt="DermaCore Logo" 
              width={32} 
              height={32}
              className="rounded-md shrink-0 transition-transform duration-300 hover:scale-105"
            />
            <span className={`transition-all duration-300 ease-out overflow-hidden whitespace-nowrap ${isCollapsed ? 'md:w-0 md:opacity-0 md:ml-0' : 'w-auto opacity-100 ml-0'}`}>
              <LogoComponentHeader />
            </span>
          </Link>
        </div>
      </nav>
    </header>
  );
}