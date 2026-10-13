import { NextResponse } from 'next/server';
import { registerHospitalSolicitacao } from '@/lib/db/hospitalAuthStore';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      hospital_nome,
      hospital_id,
      cnpj,
      responsavel_nome,
      registro_profissional,
      cargo,
      cidade,
      uf,
      telefone,
      senha,
    } = body;

    if (!email || !hospital_nome || !cnpj || !responsavel_nome || !telefone) {
      return NextResponse.json(
        {
          success: false,
          error: 'Preencha todos os campos obrigatórios (E-mail, Nome do Hospital, CNPJ, Responsável e Telefone).',
        },
        { status: 400 }
      );
    }

    const resultado = registerHospitalSolicitacao({
      email,
      hospital_nome,
      hospital_id,
      cnpj,
      responsavel_nome,
      registro_profissional,
      cargo: cargo || 'Responsável Técnico / Recepção',
      cidade: cidade || 'Garanhuns',
      uf: uf || 'PE',
      telefone,
      senha,
    });

    if (!resultado.success) {
      return NextResponse.json(
        { success: false, error: resultado.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        'Solicitação de credenciamento hospitalar registrada com sucesso. Para homologação e liberação do acesso, o administrador (murillokennedy12@gmail.com) foi notificado para validar os dados.',
      admin_email: 'murillokennedy12@gmail.com',
      status: 'pendente_aprovacao',
    });
  } catch (error: any) {
    console.error('Erro na solicitação de credenciamento hospitalar:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao registrar solicitação.' },
      { status: 500 }
    );
  }
}
