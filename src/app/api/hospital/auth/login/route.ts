import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authenticateHospital } from '@/lib/db/hospitalAuthStore';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, senha } = body;

    if (!email || !senha) {
      return NextResponse.json(
        { success: false, error: 'Informe o e-mail institucional e a senha de acesso.' },
        { status: 400 }
      );
    }

    const resultado = authenticateHospital(email, senha);

    if (!resultado.success || !resultado.session) {
      return NextResponse.json(
        { success: false, error: resultado.error || 'Credenciais inválidas.' },
        { status: 401 }
      );
    }

    // Gravar cookie com token de sessão
    const cookieStore = cookies();
    cookieStore.set('cuidae_hospital_session', resultado.session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    });

    return NextResponse.json({
      success: true,
      message: 'Autenticado com sucesso no perfil hospitalar.',
      session: resultado.session,
      user: resultado.user,
    });
  } catch (error: any) {
    console.error('Erro na rota de login hospitalar:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno ao processar login hospitalar.' },
      { status: 500 }
    );
  }
}
