import { NextResponse } from 'next/server';
import { getTriagemFromStore } from '@/lib/db/triageStore';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const triagem = await getTriagemFromStore(params.id);
    if (!triagem) {
      return NextResponse.json(
        { error: 'Triagem não encontrada' },
        { status: 404 }
      );
    }
    return NextResponse.json(triagem);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Erro ao carregar triagem' },
      { status: 500 }
    );
  }
}
