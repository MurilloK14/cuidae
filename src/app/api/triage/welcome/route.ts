import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    texto: 'Olá! Sou o assistente de triagem de saúde do Cuidaê. Me diga o que está sentindo ou envie uma foto de uma alteração na pele, e eu te orientarei para o atendimento correto.'
  })
}
