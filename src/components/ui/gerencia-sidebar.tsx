'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Users, 
  BarChart3, 
  Settings,
  FileText,
  Shield,
  Building,
  ChevronLeft,
  ChevronRight,
  Stethoscope
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SidebarProps {
  userRole: string
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

const sidebarItems = [
  { 
    id: 'dashboard', 
    name: 'Dashboard', 
    icon: BarChart3, 
    href: '/gerente',
    description: 'Panel principal de control' 
  },
  { 
    id: 'usuarios', 
    name: 'Usuarios', 
    icon: Users, 
    href: '/gerente/usuarios',
    description: 'Gestión de usuarios del sistema' 
  },
  { 
    id: 'reportes', 
    name: 'Reportes', 
    icon: FileText, 
    href: '/gerente/reportes',
    description: 'Reportes ejecutivos y análisis' 
  },
  { 
    id: 'auditoria', 
    name: 'Auditoría', 
    icon: Shield, 
    href: '/gerente/auditoria',
    description: 'Registro de actividades del sistema' 
  },
  { 
    id: 'organizacion', 
    name: 'Organización', 
    icon: Building, 
    href: '/gerente/organizacion',
    description: 'Configuración de la clínica' 
  },
  { 
    id: 'configuracion', 
    name: 'Configuración', 
    icon: Settings, 
    href: '/gerente/configuracion',
    description: 'Configuración avanzada del sistema' 
  },
]

export default function GerenciaSidebar({ userRole, collapsed: externalCollapsed, onCollapsedChange }: SidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  const pathname = usePathname()
  
  const collapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed
  
  const handleCollapsedChange = (newCollapsed: boolean) => {
    if (onCollapsedChange) {
      onCollapsedChange(newCollapsed)
    } else {
      setInternalCollapsed(newCollapsed)
    }
  }

  return (
    <aside className={cn(
      "bg-white border-r border-gray-200 flex flex-col transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">CareLink</h2>
                <p className="text-xs text-gray-500">Gerencia</p>
              </div>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCollapsedChange(!collapsed)}
            className="p-1.5"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-emerald-100 text-emerald-700" 
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                  title={collapsed ? item.name : ''}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <span className="truncate">{item.name}</span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            <p>Rol: {userRole}</p>
          </div>
        </div>
      )}
    </aside>
  )
}