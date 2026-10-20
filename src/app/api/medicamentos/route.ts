import { NextResponse } from 'next/server';
import {
  getAllMedicamentos,
  getMedicamentoById,
  searchMedicamentos,
  getEstatisticasMedicamentos
} from '@/lib/db/medicamentosStore';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const q = searchParams.get('q') || searchParams.get('busca') || '';
    const categoria = searchParams.get('categoria') || '';
    const programa = searchParams.get('programa') || '';
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');

    const lat = latStr ? parseFloat(latStr) : null;
    const lng = lngStr ? parseFloat(lngStr) : null;

    if (id) {
      const item = await getMedicamentoById(id);
      if (!item) {
        return NextResponse.json({ error: 'Medicamento não encontrado' }, { status: 404 });
      }
      return NextResponse.json({ medicamento: item });
    }

    const [medicamentos, estatisticas] = await Promise.all([
      searchMedicamentos({
        query: q,
        categoria: categoria || undefined,
        programa: programa || undefined,
        lat: isNaN(lat as number) ? null : lat,
        lng: isNaN(lng as number) ? null : lng
      }),
      getEstatisticasMedicamentos()
    ]);

    return NextResponse.json({
      medicamentos,
      total: medicamentos.length,
      estatisticas,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('Erro ao consultar medicamentos:', err);
    return NextResponse.json(
      { error: err.message || 'Erro interno ao consultar medicamentos' },
      { status: 500 }
    );
  }
}
