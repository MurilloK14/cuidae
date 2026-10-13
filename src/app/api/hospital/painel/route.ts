import { NextResponse } from 'next/server';
import { getAllAgendamentos, getMetricasHospital } from '@/lib/db/agendamentoStore';
import unidadesData from '../../../../../data/unidades_saude.json';
import type { AgendamentoHospitalar, UnidadeSaudeCompleta } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const unidadeId = searchParams.get('unidadeId');
    const status = searchParams.get('status');
    const urgencia = searchParams.get('urgencia');
    const busca = searchParams.get('busca')?.toLowerCase().trim();

    let agendamentos: AgendamentoHospitalar[] = await getAllAgendamentos();

    // Filtro por Unidade
    if (unidadeId && unidadeId !== 'todas') {
      agendamentos = agendamentos.filter(
        (a) => a.unidade_id === unidadeId || a.unidade_nome.toLowerCase().includes(unidadeId.toLowerCase())
      );
    }

    // Filtro por Status
    if (status && status !== 'todos') {
      agendamentos = agendamentos.filter((a) => a.status === status);
    }

    // Filtro por Urgência Manchester
    if (urgencia && urgencia !== 'todas') {
      agendamentos = agendamentos.filter((a) => a.nivel_urgencia === urgencia);
    }

    // Filtro por Texto de Busca
    if (busca) {
      agendamentos = agendamentos.filter(
        (a) =>
          a.paciente_nome.toLowerCase().includes(busca) ||
          a.protocolo.toLowerCase().includes(busca) ||
          a.sintomas_citados.toLowerCase().includes(busca) ||
          a.diagnostico_ia.toLowerCase().includes(busca) ||
          a.especialidade.toLowerCase().includes(busca)
      );
    }

    const metricas = await getMetricasHospital(unidadeId && unidadeId !== 'todas' ? unidadeId : undefined);

    const unidades = (unidadesData as unknown as UnidadeSaudeCompleta[]) || [];
    const hospitaisEUnidades = unidades.map((u) => ({
      id: u.id,
      nome: u.nome,
      categoria: u.categoria,
      bairro: u.bairro,
      telefone: u.telefone,
    }));

    return NextResponse.json({
      success: true,
      metricas,
      agendamentos,
      hospitais: hospitaisEUnidades,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Erro no painel do hospital:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao carregar dados do painel hospitalar' },
      { status: 500 }
    );
  }
}
