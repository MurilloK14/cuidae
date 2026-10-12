import { NextResponse } from 'next/server'
import unidadesData from '../../../../data/unidades_saude.json'
import type { UnidadeSaudeCompleta } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const categoria = searchParams.get('categoria')
    const q = searchParams.get('q')?.toLowerCase().trim()
    const especialidade = searchParams.get('especialidade')?.toLowerCase().trim()

    let unidades = (unidadesData as unknown as UnidadeSaudeCompleta[]) || []

    if (q) {
      unidades = unidades.filter((u) => {
        const nomeMatch = u.nome.toLowerCase().includes(q)
        const bairroMatch = u.bairro?.toLowerCase().includes(q)
        const endMatch = u.endereco?.toLowerCase().includes(q)
        const espMatch = u.especialidades?.some((e) => e.toLowerCase().includes(q))
        const servMatch = u.servicos?.some((s) => s.toLowerCase().includes(q))
        return nomeMatch || bairroMatch || endMatch || espMatch || servMatch
      })
    }

    if (categoria) {
      unidades = unidades.filter(
        (u) => u.categoria && u.categoria.toLowerCase() === categoria.toLowerCase()
      )
    }

    if (especialidade) {
      unidades = unidades.filter((u) =>
        u.especialidades?.some((e) => e.toLowerCase().includes(especialidade))
      )
    }

    return NextResponse.json({
      success: true,
      total: unidades.length,
      unidades
    })
  } catch (error: any) {
    console.error('Erro ao listar unidades:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno ao listar unidades' },
      { status: 500 }
    )
  }
}
