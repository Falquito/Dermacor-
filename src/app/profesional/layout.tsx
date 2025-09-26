import { redirect } from 'next/navigation'
import { getCurrentUser, roleToPath } from '@/lib/auth'
import ProfesionalSidebar from '@/components/ui/profesional-sidebar'
import ProfesionalTopbar from '@/components/ui/profesional-topbar'

export default async function ProfesionalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!user.role) {
    redirect('/')
  }
  if (user.role !== 'PROFESIONAL') redirect(roleToPath(user.role))

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <ProfesionalSidebar userRole={user.role} />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <ProfesionalTopbar 
          userName={user.name}
          userEmail={user.email}
        />
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  )
}