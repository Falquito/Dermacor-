import { redirect } from 'next/navigation'
import { getCurrentUser, roleToPath, signOut } from '@/lib/auth'

async function signOutAction() {
  'use server'
  await signOut()
  redirect('/login')
}

export default async function GerentePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role !== 'GERENTE') redirect(roleToPath(user.role))

  return (
    <div className="min-h-screen bg-emerald-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Panel del Gerente</h1>
          <form action={signOutAction}><button className="text-sm text-red-600 hover:underline">Cerrar sesión</button></form>
        </div>
      </header>
        <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <p className="text-gray-700">Bienvenido, {user.name || user.email}.</p>
          <p className="text-gray-600 mt-2">Aquí se mostrarán reportes, métricas y administración.</p>
        </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow border">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Métricas</h2>
              <p className="text-gray-600">Contenido pendiente.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Reportes</h2>
              <p className="text-gray-600">Contenido pendiente.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Administración</h2>
              <p className="text-gray-600">Contenido pendiente.</p>
            </div>
          </div>
      </main>
    </div>
  )
}
