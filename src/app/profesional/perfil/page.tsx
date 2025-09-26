'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Stethoscope, 
  Calendar, 
  Mail, 
  Phone, 
  Clock,
  Award,
  Settings
} from 'lucide-react'
import ProfileForm, { ProfileFormData } from '@/components/ProfileForm'
import type { User, Especialidad } from '@prisma/client'

type UserWithEspecialidad = User & { especialidad?: Especialidad | null }

export default function ProfesionalPerfilPage() {
  const [user, setUser] = useState<UserWithEspecialidad | null>(null)
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserData()
    fetchEspecialidades()
  }, [])

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        console.error('Error fetching user data')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEspecialidades = async () => {
    try {
      const response = await fetch('/api/especialidades')
      if (response.ok) {
        const data = await response.json()
        setEspecialidades(data.especialidades)
      }
    } catch (error) {
      console.error('Error fetching especialidades:', error)
    }
  }

  const handleSave = async (data: ProfileFormData): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok) {
        setUser(result.user)
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error: unknown) {
      console.error('Error saving profile:', error)
      return { success: false, error: 'Error de conexión' }
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="text-gray-600">Error al cargar los datos del usuario</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header del perfil */}
      <div className="relative">
        <Card className="overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-emerald-500 to-teal-600"></div>
          <CardContent className="px-6 pb-6">
            <div className="relative -mt-16 flex items-end space-x-5">
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-white p-2 shadow-lg ring-4 ring-white">
                  <div className="h-full w-full rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                    <Stethoscope className="h-10 w-10 text-emerald-600" />
                  </div>
                </div>
              </div>
              <div className="min-w-0 flex-1 pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      Dr. {user.name} {user.apellido}
                    </h1>
                    <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                      <Award className="h-4 w-4" />
                      {user.especialidad?.nombre || 'Especialidad no especificada'}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    Profesional Médico
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Sección 1: Información Personal (Editable) */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-600" />
            Información Personal
          </h2>
          <ProfileForm 
            user={user} 
            especialidades={especialidades}
            onSave={handleSave}
            showSpecialty={true}
          />
        </div>

        {/* Sección 2: Información Profesional */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Stethoscope className="h-5 w-5 text-emerald-600" />
                Información Profesional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3 py-2">
                  <Award className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-500 mb-1">Especialidad</p>
                    <p className="text-base font-medium text-gray-900">
                      {user.especialidad?.nombre || 'No especificada'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 py-2">
                  <Stethoscope className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-500 mb-1">Rol</p>
                    <p className="text-base font-medium text-gray-900">
                      Profesional Médico
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sección 3: Información de Contacto */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Phone className="h-5 w-5 text-blue-600" />
                Información de Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3 py-2">
                  <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-500 mb-1">Correo electrónico</p>
                    <p className="text-base font-medium text-gray-900 break-all">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 py-2">
                  <Phone className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-500 mb-1">Teléfono</p>
                    <p className="text-base font-medium text-gray-900">
                      {user.telefono || 'No especificado'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sección 4: Información de Cuenta */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
                Información de Cuenta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3 py-2">
                  <Clock className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-500 mb-1">Miembro desde</p>
                    <p className="text-base font-medium text-gray-900">
                      {new Date(user.createdAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 py-2">
                  <Calendar className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-500 mb-1">Última actualización</p>
                    <p className="text-base font-medium text-gray-900">
                      {new Date(user.updatedAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}