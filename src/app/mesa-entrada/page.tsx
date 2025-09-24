import { redirect } from 'next/navigation'
import { getCurrentUser, roleToPath } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import MesaEntradaContent from './MesaEntradaContent'

export default async function MesaEntradaPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role !== 'MESA_ENTRADA') redirect(roleToPath(user.role))

  // Cargar datos necesarios directamente con Prisma
  const [obrasSociales, patients] = await Promise.all([
    prisma.obraSocial.findMany({
      where: { activa: true },
      orderBy: { nombre: 'asc' }
    }),
    prisma.patient.findMany({
      include: {
        obraSocial: true,
        creator: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: [
        { apellido: 'asc' },
        { nombre: 'asc' }
      ]
    })
  ])

  return (
    <MesaEntradaContent 
      obrasSociales={obrasSociales}
      initialPatients={patients}
    />
  )
}
