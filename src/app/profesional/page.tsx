import { redirect } from 'next/navigation'
import { getCurrentUser, roleToPath, signOut } from '@/lib/auth'
import { Construction, Clock, Wrench, Stethoscope } from 'lucide-react'

async function signOutAction() {
  'use server'
  await signOut()
  redirect('/login')
}

export default async function ProfesionalPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role !== 'PROFESIONAL') redirect(roleToPath(user.role))

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-gray-900">CareLink</h1>
              <p className="text-sm text-gray-500">Panel del Profesional</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <p className="text-sm text-gray-600">
              Bienvenido, <span className="font-medium">{user.name || user.email}</span>
            </p>
            <form action={signOutAction}>
              <button className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100">
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8 flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-l-emerald-500">
            <div className="flex justify-center mb-4">
              <div className="bg-emerald-100 p-4 rounded-full">
                <Construction className="h-12 w-12 text-emerald-600" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Panel en Construcción
            </h2>
            
            <p className="text-gray-600 mb-6">
              Estamos trabajando en el panel del profesional. Esta funcionalidad estará disponible próximamente.
            </p>
            
            <div className="text-sm text-gray-500 mb-4">
              <p className="font-medium mb-2">Funcionalidades planificadas:</p>
              <ul className="space-y-1 text-left">
                <li>• Agenda de turnos personalizada</li>
                <li>• Historial clínico de pacientes</li>
                <li>• Prescripciones médicas</li>
                <li>• Reportes de consultas</li>
              </ul>
            </div>
            
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1 text-emerald-600" />
                En desarrollo
              </div>
              <div className="flex items-center">
                <Wrench className="h-4 w-4 mr-1 text-emerald-600" />
                Próximamente
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
