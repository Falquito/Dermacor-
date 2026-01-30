"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

interface SidebarContextType {
  isMobileOpen: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  // Cerrar menú automáticamente al cambiar de ruta
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const toggleMobileMenu = () => setIsMobileOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileOpen(false);
  const toggleCollapsed = () => setIsCollapsed((prev) => !prev);

  return (
    <SidebarContext.Provider value={{ 
      isMobileOpen, 
      toggleMobileMenu, 
      closeMobileMenu,
      isCollapsed,
      setIsCollapsed,
      toggleCollapsed
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

// Hook personalizado para usarlo fácil
export function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebarContext debe usarse dentro de un SidebarProvider");
  }
  return context;
}