import { NextResponse } from 'next/server';
import { getAgendamentoById, updateAgendamentoStatus } from '@/lib/db/agendamentoStore';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Identificador não fornecido' },
        { status: 400 }
      );
    }

    const agendamento = await getAgendamentoById(id);
    if (!agendamento) {
      return NextResponse.json(
        { success: false, error: 'Agendamento hospitalar não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      agendamento,
    });
  } catch (error: any) {
    console.error('Erro ao buscar agendamento:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno ao consultar agendamento' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { status, anotacoes_medicas, chamado_em, sala_atendimento, medico_responsavel } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Novo status é obrigatório' },
        { status: 400 }
      );
    }

    const atualizado = await updateAgendamentoStatus(id, status, {
      anotacoes_medicas,
      chamado_em,
      sala_atendimento,
      medico_responsavel,
    });

    if (!atualizado) {
      return NextResponse.json(
        { success: false, error: 'Agendamento não encontrado para atualização' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      agendamento: atualizado,
    });
  } catch (error: any) {
    console.error('Erro ao atualizar agendamento:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao atualizar agendamento' },
      { status: 500 }
    );
  }
}
