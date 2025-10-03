import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeDiacritics } from '@/lib/text-normalize'

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

    const normTerm = normalizeDiacritics(term)

    // Fetch a broader set first (limit * 4 up to 100) to allow in-memory accent-insensitive filtering
    const prefetchSize = Math.min(limit * 4, 100)
    const raw = await prisma.patient.findMany({
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
      take: prefetchSize,
    })

    const filtered = raw.filter(p => {
      const nombre = normalizeDiacritics(p.nombre)
      const apellido = normalizeDiacritics(p.apellido)
      const full = `${apellido} ${nombre}`.trim()
      return (
        nombre.includes(normTerm) ||
        apellido.includes(normTerm) ||
        full.includes(normTerm) ||
        (p.dni ?? '').includes(term)
      )
    })

    return NextResponse.json({ patients: filtered.slice(0, limit), total: filtered.length, accentInsensitive: true })
  } catch (error) {
    console.error('[API][professional][patients][search] error:', error)
    return NextResponse.json({ error: 'Error al buscar pacientes' }, { status: 500 })
  }
}
