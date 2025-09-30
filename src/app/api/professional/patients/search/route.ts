import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const querySchema = z.object({
  term: z.string().trim().min(2, 'Ingrese al menos 2 caracteres'),
  limit: z.coerce.number().min(1).max(25).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!user.roles.includes('PROFESIONAL')) {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 })
    }

    const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Parámetros inválidos'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const { term, limit = 10 } = parsed.data

    const patients = await prisma.patient.findMany({
      where: {
        OR: [
          { nombre: { contains: term, mode: 'insensitive' } },
          { apellido: { contains: term, mode: 'insensitive' } },
          { dni: { contains: term } },
        ],
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        dni: true,
        fechaNacimiento: true,
        genero: true,
      },
      orderBy: [
        { apellido: 'asc' },
        { nombre: 'asc' },
      ],
      take: limit,
    })

    return NextResponse.json({ patients })
  } catch (error) {
    console.error('[API][professional][patients][search] error:', error)
    return NextResponse.json({ error: 'Error al buscar pacientes' }, { status: 500 })
  }
}
