'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { User, Save, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { validateProfile, formatDNI, formatPhone } from '@/lib/validations'
import type { User as UserType, Especialidad } from '@prisma/client'

interface ProfileFormProps {
  user: UserType & { especialidad?: Especialidad | null }
  especialidades?: Especialidad[]
  onSave: (data: ProfileFormData) => Promise<{ success: boolean; error?: string }>
  showSpecialty?: boolean
}

export interface ProfileFormData {
  name: string
  apellido: string
  dni: string
  telefono: string
  especialidadId?: string
}

export default function ProfileForm({ 
  user, 
  especialidades = [], 
  onSave, 
  showSpecialty = false 
}: ProfileFormProps) {
  const [formData, setFormData] = useState<ProfileFormData>({
    name: user.name || '',
    apellido: user.apellido || '',
    dni: user.dni || '',
    telefono: user.telefono || '',
    especialidadId: user.especialidadId || ''
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  // Detectar cambios
  useEffect(() => {
    const hasChanged = 
      formData.name !== (user.name || '') ||
      formData.apellido !== (user.apellido || '') ||
      formData.dni !== (user.dni || '') ||
      formData.telefono !== (user.telefono || '') ||
      formData.especialidadId !== (user.especialidadId || '')
    
    setHasChanges(hasChanged)
  }, [formData, user])

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    let formattedValue = value
    
    // Formatear DNI mientras se escribe
    if (field === 'dni') {
      formattedValue = formatDNI(value)
    }
    
    // Formatear teléfono mientras se escribe
    if (field === 'telefono') {
      formattedValue = formatPhone(value)
    }
    
    setFormData(prev => ({ ...prev, [field]: formattedValue }))
    
    // Limpiar error del campo que se está editando
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
    
    // Limpiar mensaje general
    setMessage(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validación del lado cliente
    const validation = validateProfile(formData)
    if (!validation.isValid) {
      setErrors(validation.errors)
      setMessage({
        type: 'error',
        text: 'Por favor, corrija los errores antes de continuar'
      })
      return
    }
    
    setIsLoading(true)
    setErrors({})
    setMessage(null)
    
    try {
      const result = await onSave(formData)
      
      if (result.success) {
        setMessage({
          type: 'success',
          text: 'Perfil actualizado exitosamente'
        })
        setHasChanges(false)
      } else {
        if (result.error?.includes('DNI')) {
          setErrors({ dni: 'El DNI ingresado ya está registrado' })
        }
        setMessage({
          type: 'error',
          text: result.error || 'Error al actualizar el perfil'
        })
      }
    } catch (error: unknown) {
      console.error('Error updating profile:', error)
      setMessage({
        type: 'error',
        text: 'Error de conexión. Intente nuevamente.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-emerald-600" />
          Información Personal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mensaje de estado */}
          {message && (
            <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              {message.type === 'success' ? 
                <CheckCircle className="h-4 w-4 text-green-600" /> : 
                <AlertCircle className="h-4 w-4 text-red-600" />
              }
              <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={errors.name ? 'border-red-500' : ''}
                placeholder="Ingrese su nombre"
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Apellido */}
            <div className="space-y-2">
              <Label htmlFor="apellido">Apellido *</Label>
              <Input
                id="apellido"
                value={formData.apellido}
                onChange={(e) => handleInputChange('apellido', e.target.value)}
                className={errors.apellido ? 'border-red-500' : ''}
                placeholder="Ingrese su apellido"
              />
              {errors.apellido && (
                <p className="text-sm text-red-600">{errors.apellido}</p>
              )}
            </div>

            {/* DNI */}
            <div className="space-y-2">
              <Label htmlFor="dni">DNI *</Label>
              <Input
                id="dni"
                value={formData.dni}
                onChange={(e) => handleInputChange('dni', e.target.value)}
                className={errors.dni ? 'border-red-500' : ''}
                placeholder="XX.XXX.XXX"
                maxLength={10}
              />
              {errors.dni && (
                <p className="text-sm text-red-600">{errors.dni}</p>
              )}
            </div>

            {/* Teléfono */}
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono *</Label>
              <Input
                id="telefono"
                value={formData.telefono}
                onChange={(e) => handleInputChange('telefono', e.target.value)}
                className={errors.telefono ? 'border-red-500' : ''}
                placeholder="XX-XXXX-XXXX"
              />
              {errors.telefono && (
                <p className="text-sm text-red-600">{errors.telefono}</p>
              )}
            </div>
          </div>

          {/* Especialidad (solo para profesionales) */}
          {showSpecialty && (
            <div className="space-y-2">
              <Label htmlFor="especialidad">Especialización</Label>
              <Select
                value={formData.especialidadId}
                onValueChange={(value) => handleInputChange('especialidadId', value)}
              >
                <SelectTrigger className={errors.especialidadId ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Seleccione una especialidad" />
                </SelectTrigger>
                <SelectContent>
                  {especialidades.map((especialidad) => (
                    <SelectItem key={especialidad.id} value={especialidad.id}>
                      {especialidad.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.especialidadId && (
                <p className="text-sm text-red-600">{errors.especialidadId}</p>
              )}
            </div>
          )}

          {/* Botones */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t">
            <Button
              type="submit"
              disabled={isLoading || !hasChanges}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isLoading ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}