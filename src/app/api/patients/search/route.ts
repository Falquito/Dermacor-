import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { Prisma } from '@prisma/client'

// GET /api/patients/search - Buscar pacientes (para profesionales)
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Permitir acceso a profesionales, mesa de entrada y gerentes
    if (!currentUser.roles.includes('PROFESIONAL') && 
        !currentUser.roles.includes('MESA_ENTRADA') && 
        !currentUser.roles.includes('GERENTE')) {
      return NextResponse.json({ error: 'No tienes permisos para buscar pacientes' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!searchTerm || searchTerm.trim().length < 2) {
      return NextResponse.json({ patients: [] })
    }

    // Mejorar la búsqueda para ser más flexible
    const searchTermNormalized = searchTerm.trim()
    const searchWords = searchTermNormalized.split(/[\s,]+/).filter(word => word.length > 0)
    
    // Crear condiciones de búsqueda más flexibles
    const searchConditions: Prisma.PatientWhereInput[] = []
    
    // 1. Búsqueda exacta en campos individuales
    searchConditions.push({
      OR: [
        { nombre: { contains: searchTermNormalized, mode: 'insensitive' as const } },
        { apellido: { contains: searchTermNormalized, mode: 'insensitive' as const } },
        { dni: { startsWith: searchTermNormalized } },
        { email: { contains: searchTermNormalized, mode: 'insensitive' as const } }
      ]
    })
    
    // 2. Si hay múltiples palabras, buscar combinaciones
    if (searchWords.length >= 2) {
      // Buscar "Nombre Apellido" o "Apellido Nombre"
      searchConditions.push({
        AND: searchWords.map(word => ({
          OR: [
            { nombre: { contains: word, mode: 'insensitive' as const } },
            { apellido: { contains: word, mode: 'insensitive' as const } }
          ]
        }))
      })
      
      // Buscar formato "Apellido, Nombre" - primer palabra como apellido, resto como nombre
      if (searchWords.length === 2) {
        searchConditions.push({
          AND: [
            { apellido: { contains: searchWords[0], mode: 'insensitive' as const } },
            { nombre: { contains: searchWords[1], mode: 'insensitive' as const } }
          ]
        })
        
        // También buscar formato "Nombre Apellido"
        searchConditions.push({
          AND: [
            { nombre: { contains: searchWords[0], mode: 'insensitive' as const } },
            { apellido: { contains: searchWords[1], mode: 'insensitive' as const } }
          ]
        })
      }
    }

    const patients = await prisma.patient.findMany({
      where: {
        AND: [
          {
            OR: searchConditions
          },
          { activo: true } // Solo pacientes activos
        ]
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        dni: true,
        email: true,
        telefono: true,
        celular: true,
        fechaNacimiento: true,
        genero: true,
        direccion: true,
        ciudad: true,
        provincia: true,
        codigoPostal: true
      },
      orderBy: [
        { apellido: 'asc' },
        { nombre: 'asc' }
      ],
      take: limit
    })

    return NextResponse.json({ patients })

  } catch (error) {
    console.error('Error al buscar pacientes:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}