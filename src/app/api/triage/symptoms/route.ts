import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { saveTriagemToStore } from '@/lib/db/triageStore';
import { salvarArquivoAnamneseJson } from '@/lib/triage/anamneseStore';
import {
  isInfermedicaConfigured,
  fluxoCompleto,
  formatarResultadoInfermedica,
  traduzirNomeCondicao,
  traduzirNomeSintoma
} from '@/lib/triage/infermedica';
import {
  isGeminiConfigured,
  conduzirAnamneseOuDiagnostico,
  humanizarResultadoFinal,
  avaliarSintomasDireto
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
    const body = await request.json();
    const { sintoma, camada = 'Gratuito', lat, lng, historico = [], user_id } = body;

    // CONTROLE DE TOKENS E COTA POR USUÁRIO / IP
    const identificador = extrairIdentificadorUsuario(request, user_id);
    const checagem = checarLimiteUsuario(identificador, 350);

    if (!checagem.permitido) {
      console.warn(`[RateLimit] Limite atingido para ${identificador}: ${checagem.motivo}`);
      return NextResponse.json({
        remetente: 'bot',
        texto: `⚠️ ${checagem.motivo}\n\nPara sua segurança, caso esteja apresentando sintomas que causem desconforto importante ou dor intensa, procure diretamente uma Unidade Básica de Saúde (UBS) ou UPA. Em emergências graves, acione o SAMU 192.`,
        triagem: null,
        limiteAtingido: true,
        timestamp: new Date().toISOString()
      });
    }

    if (!sintoma || !sintoma.trim()) {
      return NextResponse.json(
        { error: 'O campo "sintoma" é obrigatório.' },
        { status: 400 }
      );
    }

    const camadaValida = ['Gratuito', 'Intermediário', 'Premium'].includes(camada)
      ? camada
      : 'Gratuito';

    const temGemini = isGeminiConfigured();
    const temInfermedica = isInfermedicaConfigured();

    console.log(`\n--- [CHAT TRIAGEM] Novo relato recebido ---`);
    console.log(`Relato: "${sintoma}"`);
    console.log(`Turnos no histórico: ${Array.isArray(historico) ? historico.length : 0}`);
    console.log(`Configuração: Gemini: ${temGemini ? '✅' : '❌'} | Infermedica: ${temInfermedica ? '✅' : '❌'}`);

    // ETAPA 1: O Gemini conduz a Anamnese Conversacional.
    // Decide se continua perguntando para entender melhor ou se já fecha o diagnóstico.
    let anamnese: any = null;

    if (temGemini) {
      try {
        anamnese = await conduzirAnamneseOuDiagnostico(sintoma, historico);
        console.log(`[Gemini Anamnese] Pronto para diagnóstico? ${anamnese.prontoParaDiagnostico ? 'SIM (Encaminhar para Infermedica)' : 'NÃO (Continuar conversa com paciente)'}`);
      } catch (errGemini: any) {
        console.warn('[Gemini Anamnese] Falha ao processar anamnese com Gemini:', errGemini?.message);
      }
    }

    // FASE CONVERSACIONAL (ECONOMIA DE CHAMADAS DA INFERMEDICA):
    // Se ainda está em fase de anamnese investigativa, responde ao paciente com a pergunta médica
    // SEM chamar a API da Infermedica!
    if (anamnese && !anamnese.prontoParaDiagnostico) {
      console.log('💬 [Modo Conversa] Enviando pergunta de acompanhamento sem acionar Infermedica (Economia de API)');
      registrarConsumoUsuario(identificador, 150, false);
      return NextResponse.json({
        remetente: 'bot',
        texto: anamnese.mensagem,
        triagem: null,
        prontoParaDiagnostico: false,
        timestamp: new Date().toISOString()
      });
    }

    // FASE DE DIAGNÓSTICO:
    // O Gemini julgou que já há dados suficientes ou o caso é urgente.
    const triageId = crypto.randomUUID();

    // Consolida todas as falas do paciente para não perder a queixa inicial em respostas curtas (ex: "4", "sim")
    const falasHistorico = (historico || [])
      .filter((m: any) => m && m.remetente === 'usuario' && m.texto)
      .map((m: any) => m.texto);
    if (!falasHistorico.includes(sintoma)) {
      falasHistorico.push(sintoma);
    }
    const queixaCompleta = falasHistorico.join('. ');

    const relatorioValido = anamnese?.relatorioClinico &&
      anamnese.relatorioClinico.trim().length > 4 &&
      !/^\d+$/.test(anamnese.relatorioClinico.trim());

    const relatorioClinico = relatorioValido
      ? anamnese.relatorioClinico
      : queixaCompleta;

    const idade = anamnese?.idade || 30;
    const sexo = anamnese?.sexo || 'male';

    console.log('\n📋 [Anamnese Concluída] Gerando arquivo JSON com os dados do paciente...');
    const anamneseJsonData = {
      id: triageId,
      timestamp: new Date().toISOString(),
      sintomaRelatado: falasHistorico[0] || sintoma,
      detalhesAdicionais: sintoma,
      historicoConversa: historico,
      anamneseGemini: {
        relatorioClinico,
        resumoPT: anamnese?.resumoPT || queixaCompleta,
        sintomasExtraidosPT: anamnese?.sintomasExtraidosPT || falasHistorico,
        idade,
        sexo,
        urgenciaPercebida: anamnese?.urgenciaPercebida || 'Normal'
      },
      infermedicaPayload: {
        text: relatorioClinico,
        age: { value: idade },
        sexo
      }
    };

    // Salva o arquivo JSON no disco em data/anamneses/
    await salvarArquivoAnamneseJson(anamneseJsonData as any);

    let formatado: any = null;
    let fonteIA = 'Google Gemini (Anamnese) + Infermedica v3';
    let resultadoInfermedica: any = null;

    // ETAPA 2: Envia os dados compilados em JSON para o motor da Infermedica
    if (temInfermedica) {
      try {
        console.log('🩺 [Infermedica] Enviando dados clínicos JSON para a Infermedica API v3...');
        resultadoInfermedica = await fluxoCompleto(relatorioClinico, { idade, sexo });

        // ETAPA 3: O Gemini humaniza a resposta técnica da Infermedica para o paciente
        try {
          console.log('🤖 [Gemini] Humanizando diagnóstico da Infermedica para o acolhimento SUS...');
          formatado = await humanizarResultadoFinal(
            sintoma,
            relatorioClinico,
            resultadoInfermedica,
            camadaValida
          );
        } catch (errHumanizar: any) {
          console.warn('[Gemini Humanização] Usando formatador interno:', errHumanizar?.message);
          formatado = formatarResultadoInfermedica(resultadoInfermedica);
        }
      } catch (errInfermedica: any) {
        console.warn('⚠️ [Infermedica] Falha no motor clínico, ativando fallback:', errInfermedica?.message);
      }
    }

    // Fallback caso Infermedica offline ou não configurada
    if (!formatado && temGemini) {
      try {
        console.log('ℹ️ [Fallback] Gerando avaliação direta com Gemini...');
        const direto = await avaliarSintomasDireto(sintoma, historico);
        formatado = direto;
        fonteIA = direto.fonteIA || 'Google Gemini Flash';
      } catch (errDireto: any) {
        console.warn('[Fallback Gemini] Falhou:', errDireto?.message);
      }
    }

    // Fallback de Segurança Clínica Local
    if (!formatado) {
      console.log('🛡️ [Protocolo Clínico Seguro] Ativado');
      const s = sintoma.toLowerCase();
      const isUrgente = s.includes('peito') || s.includes('falta de ar') || s.includes('desmaio') || s.includes('sangue') || anamnese?.urgenciaPercebida === 'Urgente';
      formatado = {
        mensagem: isUrgente
          ? 'Identifiquei sintomas com sinais de alerta. Recomendamos atendimento médico presencial imediato em uma unidade de urgência.'
          : 'Com base nos sintomas informados, é recomendada avaliação na rede de Atenção Básica (UBS) ou agendamento de consulta.',
        recomendacao: isUrgente ? 'Avaliação de Emergência' : 'Avaliação Clínica Geral',
        especialidade: isUrgente ? 'Clínica Médica / Urgência' : 'Clínico Geral',
        prioridade: isUrgente ? 'Urgente' : 'Alta',
        orientacao: 'Evite automedicação. Em caso de piora ou dor intensa, procure atendimento médico presencial.',
        tipoUnidade: isUrgente ? 'UPA' : 'UBS'
      };
      fonteIA = 'Protocolo Clínico Cuidaê (Sistema Seguro)';
    }

    const tipoUnidade = formatado.tipoUnidade || 'UBS';
    const local = getLocal(camadaValida, formatado.prioridade, tipoUnidade);
    const linkMaps = gerarLinkMaps(lat || null, lng || null, tipoUnidade);
    const mapeamento = mapearUrgencia(formatado.prioridade || 'Alta');

    let hipotesesDiagnosticas = resultadoInfermedica?.diagnostico?.conditions
      ? (resultadoInfermedica.diagnostico.conditions as any[])
          .filter((c: any) => c.probability >= 0.15)
          .slice(0, 3)
          .map((c: any) => ({
            nome: traduzirNomeCondicao(c.common_name || c.name),
            probabilidade: Math.round(c.probability * 100)
          }))
      : [];

    if (hipotesesDiagnosticas.length === 0 && Array.isArray(formatado?.hipotesesClinicas) && formatado.hipotesesClinicas.length > 0) {
      hipotesesDiagnosticas = formatado.hipotesesClinicas.map((nomeHip: string) => ({
        nome: nomeHip,
        probabilidade: null
      }));
    }

    const sintomasInfermedica = resultadoInfermedica?.evidencias
      ? (resultadoInfermedica.evidencias as any[]).map((e: any) => traduzirNomeSintoma(e.name))
      : [];

    // Persiste no store de triagens
    const triagemSalva = await saveTriagemToStore({
      id: triageId,
      user_id: user_id || 'anonimo',
      sintoma_principal: falasHistorico[0] || sintoma,
      duracao: 'Recente',
      intensidade: formatado.prioridade === 'Urgente' ? 9 : formatado.prioridade === 'Alta' ? 7 : 4,
      nivel_urgencia: mapeamento.nivel_urgencia,
      recomendacao: mapeamento.recomendacao,
      especialidade: formatado.especialidade,
      explicacao: formatado.mensagem,
      orientacao: formatado.orientacao,
      tipoUnidade,
      mapa: linkMaps,
      fonteIA,
      hipotesesDiagnosticas,
      sintomasInfermedica,
      created_at: new Date().toISOString()
    });

    console.log('✅ Triagem finalizada e salva:', triageId);
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
        nivel_urgencia: mapeamento.nivel_urgencia,
        hipotesesDiagnosticas,
        sintomasInfermedica
      },
      mapa: linkMaps,
      fonteIA,
      prontoParaDiagnostico: true,
      relatorioFormal: relatorioClinico,
      timestamp: triagemSalva.created_at
    });

  } catch (err: any) {
    console.error('Erro ao processar sintomas na API Next.js:', err);
    return NextResponse.json(
      { error: err.message || 'Erro interno ao processar triagem' },
      { status: 500 }
    );
  }
}
