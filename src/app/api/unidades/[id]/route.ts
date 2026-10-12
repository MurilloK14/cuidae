import { NextResponse } from 'next/server'
import unidadesData from '../../../../../data/unidades_saude.json'
import type { UnidadeSaudeCompleta } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const unidades = (unidadesData as unknown as UnidadeSaudeCompleta[]) || []
    const unidade = unidades.find((u) => u.id === id)

    if (!unidade) {
      return NextResponse.json(
        { success: false, error: 'Unidade não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      unidade: {
        ...unidade,
        avaliacoes: []
      }
    })
  } catch (error: any) {
    console.error('Erro ao buscar unidade:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar unidade' },
      { status: 500 }
    )
  }
}
