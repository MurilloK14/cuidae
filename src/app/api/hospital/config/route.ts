import { NextResponse } from 'next/server';
import {
  getHospitalConfig,
  addHorarioToHospital,
  removeHorarioFromHospital,
  updateHospitalConfig,
} from '@/lib/db/hospitalConfigStore';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hospitalId = searchParams.get('hospitalId') || '7a1b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d';
    const hospitalNome = searchParams.get('hospitalNome') || 'Hospital Regional Dom Moura';

    const config = getHospitalConfig(hospitalId, hospitalNome);

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error: any) {
    console.error('Erro ao carregar configurações do hospital:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao carregar configurações.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, hospitalId, horario, turno, vagas, horarioId, configUpdates } = body;

    const targetHospitalId = hospitalId || '7a1b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d';

    if (action === 'add_horario') {
      if (!horario || !turno) {
        return NextResponse.json(
          { success: false, error: 'Horário e turno são obrigatórios.' },
          { status: 400 }
        );
      }
      const updated = addHorarioToHospital(targetHospitalId, horario, turno, vagas || 3);
      return NextResponse.json({
        success: true,
        message: `Horário ${horario} adicionado com sucesso.`,
        config: updated,
      });
    }

    if (action === 'delete_horario') {
      if (!horarioId && !horario) {
        return NextResponse.json(
          { success: false, error: 'Identificador do horário é obrigatório.' },
          { status: 400 }
        );
      }
      const updated = removeHorarioFromHospital(targetHospitalId, horarioId || horario);
      return NextResponse.json({
        success: true,
        message: 'Horário excluído com sucesso.',
        config: updated,
      });
    }

    if (action === 'update_general') {
      const updated = updateHospitalConfig(targetHospitalId, configUpdates || {});
      return NextResponse.json({
        success: true,
        message: 'Configurações hospitalares salvas com sucesso.',
        config: updated,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Ação não suportada.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Erro ao modificar configurações do hospital:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno.' },
      { status: 500 }
    );
  }
}
