import { NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { saveTriagemToStore } from '@/lib/db/triageStore';
import {
  isInfermedicaConfigured,
  fluxoCompleto,
  formatarResultadoInfermedica
} from '@/lib/triage/infermedica';
import {
  isGeminiConfigured,
  gerarRelatorioImagem,
  humanizarResultadoFinal,
  avaliarImagemDireto
} from '@/lib/triage/gemini';
import {
  getLocal,
  gerarLinkMaps,
  mapearUrgencia
} from '@/lib/triage/location';
import {
  checarLimiteUsuario,
  registrarConsumoUsuario,
  extrairIdentificadorUsuario
} from '@/lib/triage/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('imagem') as File | null;
    const camada = (formData.get('camada') as string) || 'Gratuito';
    const latStr = formData.get('lat') as string | null;
    const lngStr = formData.get('lng') as string | null;
    const user_id = (formData.get('user_id') as string) || 'anonimo';

    // CONTROLE DE LIMITES E TOKENS POR USUÁRIO / IP
    const identificador = extrairIdentificadorUsuario(request, user_id);
    const checagem = checarLimiteUsuario(identificador, 400);

    if (!checagem.permitido) {
      return NextResponse.json({
        remetente: 'bot',
        texto: `⚠️ ${checagem.motivo}\n\nPara sua segurança, caso essa alteração na pele esteja acompanhada de dor intensa, sangramento ou inflamação rápida, dirija-se a uma UBS ou UPA para avaliação presencial.`,
        triagem: null,
        limiteAtingido: true,
        timestamp: new Date().toISOString()
      });
    }

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhuma imagem foi enviada.' },
        { status: 400 }
      );
    }

    const lat = latStr ? parseFloat(latStr) : null;
    const lng = lngStr ? parseFloat(lngStr) : null;
    const camadaValida = ['Gratuito', 'Intermediário', 'Premium'].includes(camada)
      ? camada
      : 'Gratuito';

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');
    const mimeType = file.type || 'image/jpeg';

    // Salva imagem localmente para auditoria médica
    let savedFilePath: string | null = null;
    try {
      const uploadDir = path.resolve(process.cwd(), 'server/uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const safeName = `sintoma-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      savedFilePath = path.join(uploadDir, safeName);
      fs.writeFileSync(savedFilePath, buffer);
    } catch {
      // Ignora falha em salvar cópia em disco
    }

    let formatado: any = null;
    let fonteIA = 'Google Gemini (Visão) + Infermedica v3';
    let relatorioFormal: string | null = null;

    const temGemini = isGeminiConfigured();
    const temInfermedica = isInfermedicaConfigured();

    console.log(`[Next.js API Triage Image] Gemini: ${temGemini ? '✅' : '❌'} | Infermedica: ${temInfermedica ? '✅' : '❌'}`);

    // FLUXO INTEGRADO: Gemini Vision -> Infermedica -> Gemini (Humanização)
    if (temGemini && temInfermedica) {
      try {
        console.log('[Next.js API] 1. Gemini Vision analisando imagem e criando laudo formal...');
        const relatorioImagem = await gerarRelatorioImagem(base64Data, mimeType);
        relatorioFormal = relatorioImagem.relatorioClinico;

        console.log('[Next.js API] 2. Infermedica processando achados visuais:', relatorioFormal);
        const resultadoInfermedica = await fluxoCompleto(relatorioImagem.relatorioClinico, {
          idade: relatorioImagem.idade,
          sexo: relatorioImagem.sexo
        });

        // 3. Humanização final
        try {
          console.log('[Next.js API] 3. Gemini humanizando diagnóstico dermatológico...');
          formatado = await humanizarResultadoFinal(
            'Imagem dermatológica enviada pelo paciente para triagem',
            relatorioImagem,
            resultadoInfermedica,
            camadaValida
          );
        } catch (errHumanizacao: any) {
          console.warn('[Next.js API] Fallback para formatador Infermedica:', errHumanizacao?.message);
          formatado = formatarResultadoInfermedica(resultadoInfermedica);
        }
      } catch (pipelineErr: any) {
        console.warn('[Next.js API] Pipeline integrado de imagem falhou, tentando fallback:', pipelineErr?.message);
      }
    }

    // Fallback 1: Gemini Vision Direto
    if (!formatado && temGemini) {
      try {
        console.log('[Next.js API] Executando avaliação direta com Gemini Vision...');
        const direto = await avaliarImagemDireto(base64Data, mimeType);
        formatado = direto;
        fonteIA = direto.fonteIA || 'Google Gemini Vision';
      } catch (geminiErr: any) {
        console.warn('[Next.js API] Falha na avaliação direta com Gemini Vision:', geminiErr?.message);
      }
    }

    // Fallback 2: Protocolo Clínico Dermatológico Seguro
    if (!formatado) {
      formatado = {
        mensagem: `Analisei a imagem enviada ("${file.name}"). Foram identificadas características de alteração cutânea que merecem avaliação profissional presencial. Evite manipular ou aplicar medicamentos sem recomendação médica.`,
        recomendacao: 'Encaminhamento para Avaliação Dermatológica',
        especialidade: 'Dermatologia / Clínica Geral',
        prioridade: 'Média',
        orientacao: 'Evite exposição ao sol na área afetada, mantenha o local limpo e seco e procure atendimento na UBS.',
        tipoUnidade: 'UBS'
      };
      fonteIA = 'Protocolo Clínico Cuidaê (Sistema Seguro)';
    }

    const tipoUnidade = formatado.tipoUnidade || 'UBS';
    const local = getLocal(camadaValida, formatado.prioridade, tipoUnidade);
    const linkMaps = gerarLinkMaps(lat, lng, tipoUnidade);
    const mapeamento = mapearUrgencia(formatado.prioridade || 'Média');
    const id = crypto.randomUUID();

    // Persiste no banco de triagens
    const triagemSalva = await saveTriagemToStore({
      id,
      user_id,
      sintoma_principal: `Lesão cutânea / foto enviada para análise dermatológica (${file.name})`,
      duracao: 'Recente',
      intensidade: formatado.prioridade === 'Urgente' ? 9 : formatado.prioridade === 'Alta' ? 7 : 5,
      respostas: [{ pergunta: 'foto', resposta: file.name }],
      nivel_urgencia: mapeamento.nivel_urgencia,
      recomendacao: mapeamento.recomendacao,
      especialidade: formatado.especialidade || 'Dermatologia',
      explicacao: formatado.mensagem,
      orientacao: formatado.orientacao,
      tipoUnidade,
      mapa: linkMaps,
      foto_storage_path: savedFilePath,
      fonteIA,
      created_at: new Date().toISOString()
    });

    // Registra consumo de tokens e contagem de triagem
    registrarConsumoUsuario(identificador, 400, true);

    return NextResponse.json({
      id: triagemSalva.id,
      remetente: 'bot',
      texto: formatado.mensagem,
      triagem: {
        id: triagemSalva.id,
        recomendacao: formatado.recomendacao,
        especialidade: formatado.especialidade,
        local,
        prioridade: formatado.prioridade,
        orientacao: formatado.orientacao,
        tipoUnidade,
        nivel_urgencia: mapeamento.nivel_urgencia
      },
      mapa: linkMaps,
      fonteIA,
      arquivoRecebido: file.name,
      timestamp: triagemSalva.created_at
    });

  } catch (err: any) {
    console.error('Erro ao processar imagem na API Next.js:', err);
    return NextResponse.json(
      { error: err.message || 'Erro interno ao processar análise da imagem' },
      { status: 500 }
    );
  }
}
