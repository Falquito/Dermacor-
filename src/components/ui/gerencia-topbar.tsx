'use client'

import { usePathname } from 'next/navigation'
import { 
  Search, 
  Bell, 
  ChevronRight,
  LogOut,
  User
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TopbarProps {
  userName: string | null
  userEmail: string
}

const pathTitles: Record<string, string> = {
  '/gerente': 'Dashboard',
  '/gerente/usuarios': 'Usuarios',
  '/gerente/reportes': 'Reportes', 
  '/gerente/auditoria': 'Auditoría',
  '/gerente/organizacion': 'Organización',
  '/gerente/configuracion': 'Configuración',
}

export default function GerenciaTopbar({ userName, userEmail }: TopbarProps) {
  const pathname = usePathname()
  const currentTitle = pathTitles[pathname] || 'Gerencia'

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      console.log('Iniciando proceso de logout...')
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      console.log('Respuesta del logout:', response.status)
      
      if (response.ok) {
        console.log('Logout exitoso, redirigiendo a login...')
        // Forzar redirección completa en lugar de usar router.push
        window.location.href = '/login'
      } else {
        console.error('Error al cerrar sesión:', response.status)
        alert('Error al cerrar sesión. Por favor, intenta de nuevo.')
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      alert('Error de conexión. Por favor, verifica tu conexión e intenta de nuevo.')
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Breadcrumbs */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Gerencia</span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-900">{currentTitle}</span>
        </div>

        {/* Search and Actions */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {userName || 'Usuario'}
              </p>
              <p className="text-xs text-gray-500">{userEmail}</p>
            </div>
            
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-emerald-600" />
            </div>

            {/* Logout Button */}
            <Button 
              type="button"
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              className="hover:bg-red-50 hover:text-red-600"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}