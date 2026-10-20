import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getVacinasByUser,
  saveVacina,
  deleteVacina,
  calcularEstatisticasVacinais,
} from '@/lib/db/vacinasStore';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let userId = searchParams.get('userId');

    if (!userId) {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          userId = user.id;
        }
      } catch {
        // Usuário anônimo
      }
    }

    const vacinas = await getVacinasByUser(userId || 'anonimo');
    const estatisticas = calcularEstatisticasVacinais(vacinas);

    return NextResponse.json({
      success: true,
      total: vacinas.length,
      estatisticas,
      vacinas,
    });
  } catch (error: any) {
    console.error('Erro na rota GET /api/vacinas:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao listar vacinas' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nome_vacina, dose, data_aplicacao, data_proxima_dose, lote, fabricante, local_aplicacao, origem_dado, observacoes } = body;

    if (!nome_vacina || !nome_vacina.trim()) {
      return NextResponse.json(
        { success: false, error: 'O nome da vacina é obrigatório.' },
        { status: 400 }
      );
    }

    let userId = body.user_id;
    if (!userId) {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          userId = user.id;
        }
      } catch {
        userId = 'anonimo';
      }
    }

    const novaVacina = await saveVacina(userId || 'anonimo', {
      nome_vacina,
      dose: dose || '1ª Dose',
      data_aplicacao: data_aplicacao || new Date().toISOString().split('T')[0],
      data_proxima_dose,
      lote,
      fabricante,
      local_aplicacao,
      origem_dado: origem_dado || 'manual',
      autenticado_sus: origem_dado === 'meu_sus_digital',
      observacoes,
    });

    return NextResponse.json({
      success: true,
      message: 'Vacina registrada com sucesso no prontuário!',
      vacina: novaVacina,
    });
  } catch (error: any) {
    console.error('Erro na rota POST /api/vacinas:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao registrar vacina' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID da vacina é obrigatório para exclusão.' },
        { status: 400 }
      );
    }

    let userId = searchParams.get('userId');
    if (!userId) {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) userId = user.id;
      } catch {
        // anônimo
      }
    }

    const removido = await deleteVacina(id, userId || undefined);

    if (!removido) {
      return NextResponse.json(
        { success: false, error: 'Vacina não encontrada ou permissão negada.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Registro de vacina removido com sucesso.',
    });
  } catch (error: any) {
    console.error('Erro na rota DELETE /api/vacinas:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao excluir vacina' },
      { status: 500 }
    );
  }
}
