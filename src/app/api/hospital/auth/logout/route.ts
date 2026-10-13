import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { destroySession } from '@/lib/db/hospitalAuthStore';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('cuidae_hospital_session')?.value;

    if (token) {
      destroySession(token);
    }

    cookieStore.delete('cuidae_hospital_session');

    return NextResponse.json({
      success: true,
      message: 'Sessão hospitalar encerrada com sucesso.',
    });
  } catch (error: any) {
    console.error('Erro ao deslogar hospital:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
