// app/api/obras-sociales/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const obras = await prisma.obraSocial.findMany({
      orderBy: { idObraSocial: 'desc' }
    })
    return NextResponse.json(obras)
  } catch {
    return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    if (!body.nombreObraSocial) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 })
    }

    const nuevaObra = await prisma.obraSocial.create({
      data: {
        nombreObraSocial: body.nombreObraSocial,
        estadoObraSocial: body.estadoObraSocial ?? true
      }
    })

    return NextResponse.json(nuevaObra, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error al crear' }, { status: 500 })
  }
}