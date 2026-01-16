import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { id } = await params

    const obraActualizada = await prisma.obraSocial.update({
      where: { idObraSocial: +id },
      data: {
        nombreObraSocial: body.nombreObraSocial
      }
    })

    return NextResponse.json(obraActualizada)
  } catch {
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await prisma.obraSocial.update({
      where: { idObraSocial: +id },
      data: {
        estadoObraSocial: false
      }
    })

    return NextResponse.json({ message: 'Eliminado correctamente' })
  } catch {
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }
}