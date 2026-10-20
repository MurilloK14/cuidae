import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analisarImagemVacinas } from '@/lib/triage/vacinaVision';
import { saveMultiplasVacinas } from '@/lib/db/vacinasStore';
import type { OrigemVacina } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';

    let base64Data = '';
    let mimeType = 'image/jpeg';
    let autoSalvar = true;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('imagem') as File | null;
      const autoSalvarParam = formData.get('autoSalvar');
      if (autoSalvarParam === 'false') autoSalvar = false;

      if (!file) {
        return NextResponse.json(
          { success: false, error: 'Nenhum arquivo de imagem foi enviado.' },
          { status: 400 }
        );
      }

      mimeType = file.type || 'image/jpeg';
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      base64Data = buffer.toString('base64');
    } else {
      const body = await request.json();
      base64Data = body.imagemBase64;
      mimeType = body.mimeType || 'image/jpeg';
      if (body.autoSalvar !== undefined) {
        autoSalvar = Boolean(body.autoSalvar);
      }

      if (!base64Data) {
        return NextResponse.json(
          { success: false, error: 'A imagem em base64 é obrigatória.' },
          { status: 400 }
        );
      }

      // Remove prefix data:image/...;base64, se presente
      if (base64Data.includes('base64,')) {
        const parts = base64Data.split('base64,');
        base64Data = parts[1];
      }
    }

    console.log(`🔍 [VacinaVision API] Analisando imagem (${mimeType})...`);
    const analise = await analisarImagemVacinas(base64Data, mimeType);

    // Identificar usuário logado
    let userId = 'anonimo';
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) userId = user.id;
    } catch {
      // Usuário anônimo
    }

    let vacinasSalvas: any[] = [];
    if (autoSalvar && analise.vacinas_extraidas.length > 0) {
      const origem: OrigemVacina =
        analise.tipo_documento_detectado === 'meu_sus_digital'
          ? 'meu_sus_digital'
          : 'caderneta_papel';

      const autenticado = analise.tipo_documento_detectado === 'meu_sus_digital' || analise.qr_code_sus_detectado;

      vacinasSalvas = await saveMultiplasVacinas(
        userId,
        analise.vacinas_extraidas,
        origem,
        autenticado
      );
    }

    return NextResponse.json({
      success: true,
      mensagem:
        analise.tipo_documento_detectado === 'meu_sus_digital'
          ? 'Comprovante oficial do Meu SUS Digital validado com sucesso!'
          : 'Caderneta física de vacinação digitalizada com sucesso pela IA!',
      analise,
      vacinasSalvas,
    });
  } catch (error: any) {
    console.error('Erro na rota POST /api/vacinas/scan:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao processar imagem da carteira de vacinas.' },
      { status: 500 }
    );
  }
}
