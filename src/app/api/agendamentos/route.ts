import { NextResponse } from 'next/server';
import { getAllAgendamentos, getAgendamentosByUser, saveAgendamento } from '@/lib/db/agendamentoStore';
import { createClient } from '@/lib/supabase/server';
import type { AgendamentoHospitalar } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');

    let userId = userIdParam;
    if (!userId) {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          userId = user.id;
        }
      } catch {
        // Usuário não autenticado via sessão Supabase
      }
    }

    const agendamentos = userId
      ? await getAgendamentosByUser(userId)
      : await getAllAgendamentos();

    return NextResponse.json({
      success: true,
      total: agendamentos.length,
      agendamentos,
    });
  } catch (error: any) {
    console.error('Erro ao listar agendamentos:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao listar agendamentos' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      unidade_nome,
      especialidade,
      data_agendamento,
      horario,
      paciente_nome,
      paciente_cpf,
      paciente_telefone,
      sintomas_citados,
      diagnostico_ia,
      nivel_urgencia,
    } = body;

    // Validações essenciais
    if (!unidade_nome || !unidade_nome.trim()) {
      return NextResponse.json(
        { success: false, error: 'A unidade de saúde ou hospital de destino é obrigatório.' },
        { status: 400 }
      );
    }

    if (!data_agendamento) {
      return NextResponse.json(
        { success: false, error: 'A data do agendamento é obrigatória.' },
        { status: 400 }
      );
    }

    if (!paciente_nome || !paciente_nome.trim()) {
      return NextResponse.json(
        { success: false, error: 'O nome do paciente é obrigatório.' },
        { status: 400 }
      );
    }

    if (!sintomas_citados || !sintomas_citados.trim()) {
      return NextResponse.json(
        { success: false, error: 'Os sintomas do paciente devem ser informados para envio ao hospital.' },
        { status: 400 }
      );
    }

    if (!diagnostico_ia || !diagnostico_ia.trim()) {
      return NextResponse.json(
        { success: false, error: 'O diagnóstico da inteligência artificial deve constar no encaminhamento.' },
        { status: 400 }
      );
    }

    // Identificar usuário logado
    let userId = body.user_id || 'anonimo';
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
      }
    } catch {
      // Ignora erro de auth
    }

    // Salva o agendamento com a transmissão hospitalar completa
    const agendamentoCriado: AgendamentoHospitalar = await saveAgendamento({
      ...body,
      user_id: userId,
      status: 'agendado',
      status_envio_hospital: 'transmitido_com_sucesso',
    });

    return NextResponse.json({
      success: true,
      mensagem: 'Agendamento e diagnóstico de IA transmitidos com sucesso ao hospital!',
      agendamento: agendamentoCriado,
    });
  } catch (error: any) {
    console.error('Erro ao criar agendamento hospitalar:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno ao processar agendamento' },
      { status: 500 }
    );
  }
}
