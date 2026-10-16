import { NextResponse } from 'next/server';
import { getAllTriagensFromStore } from '@/lib/db/triageStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const list = await getAllTriagensFromStore();
    return NextResponse.json({ triagens: list });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Erro ao carregar histórico de triagens' },
      { status: 500 }
    );
  }
}
