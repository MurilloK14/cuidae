import { NextResponse } from 'next/server'
import crypto from 'crypto'
import type { AvaliacaoUnidade } from '@/lib/types'

export const dynamic = 'force-dynamic'

// Store em memória para avaliações na Vercel (serverless)
const avaliacoesInMemory: Record<string, AvaliacaoUnidade[]> = {}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const list = avaliacoesInMemory[id] || []
  return NextResponse.json({
    success: true,
    avaliacoes: list
  })
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    const nova: AvaliacaoUnidade = {
      id: crypto.randomUUID(),
      unidade_id: id,
      user_id: body.user_id || 'anonimo',
      nome: body.nome || 'Usuário Cuidaê',
      nota: Number(body.nota) || 5,
      comentario: body.comentario || '',
      created_at: new Date().toISOString()
    }

    if (!avaliacoesInMemory[id]) {
      avaliacoesInMemory[id] = []
    }
    avaliacoesInMemory[id].unshift(nova)

    return NextResponse.json(
      { success: true, avaliacao: nova },
      { status: 201 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Erro ao registrar avaliação' },
      { status: 500 }
    )
  }
}
