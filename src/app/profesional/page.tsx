import { redirect } from 'next/navigation'
import { getCurrentUser, roleToPath, signOut } from '@/lib/auth'

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
    <div className="min-h-screen bg-emerald-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Panel del Profesional</h1>
          <form action={signOutAction} className="ml-4">
            <button className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100">
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <p className="text-gray-800">Bienvenido, <span className="font-medium">{user.name || user.email}</span>.</p>
          <p className="text-gray-600 mt-2">Aquí irá la agenda, turnos y pacientes asignados.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Próximos turnos</h2>
            <p className="text-gray-600">Contenido pendiente.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Pacientes recientes</h2>
            <p className="text-gray-600">Contenido pendiente.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
