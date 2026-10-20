import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import dotenv from 'dotenv';
import { geminiConfig } from '../config/aiConfig.js';
import { traduzirParaInglesClinico } from './infermedicaService.js';
import { analisarSintomas, analisarImagem as analisarImagemFallback } from './triageService.js';

dotenv.config();

const genAI = geminiConfig.apiKey ? new GoogleGenerativeAI(geminiConfig.apiKey) : null;

/**
 * Modelos candidatos em ordem de prioridade.
 * Se o modelo principal sofrer pico de demanda (503), alterna automaticamente para flash-lite.
 */
const CANDIDATE_MODELS = [
  geminiConfig.model || 'gemini-3.5-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.5-flash',
  'gemini-3.8-flash',
  'gemini-flash-latest'
].filter((m, i, arr) => Boolean(m) && arr.indexOf(m) === i);

const PROMPT_ANAMNESE_CONVERSACIONAL = geminiConfig.prompts.anamneseConversacional;
const PROMPT_IMAGEM_RELATORIO = geminiConfig.prompts.laudoImagem;
const PROMPT_DIAGNOSTICO_DIRETO = geminiConfig.prompts.diagnosticoDireto;

function removerSaudacaoRepetida(texto) {
  if (!texto || typeof texto !== 'string') return texto;
  return texto
    .replace(/^(?:ol[áa]|oi|bom dia|boa tarde|boa noite|tudo bem[?!.]*|como vai[?!.]*)[,\s!.-]*/i, '')
    .trim();
}

/**
 * Tenta executar a chamada usando a lista de modelos candidatos em ordem com fallback automático.
 */
async function executarComModelos(fn) {
  if (!genAI) throw new Error('GEMINI_API_KEY não configurada');

  let ultimoErro = null;

  for (const modelName of CANDIDATE_MODELS) {
    for (let tentativa = 1; tentativa <= 2; tentativa++) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        return await fn(model, modelName);
      } catch (err) {
        ultimoErro = err;
        const msg = err.message || '';
        const isTemporary = msg.includes('503') || msg.includes('429') || msg.includes('high demand') || msg.includes('temporarily');

        if (isTemporary && tentativa === 1) {
          await new Promise(r => setTimeout(r, 500));
          continue;
        }

        console.warn(`[Gemini] Modelo ${modelName} falhou: ${msg.slice(0, 100)}. Tentando próximo...`);
        break;
      }
    }
  }

  throw ultimoErro;
}

/**
 * Conduz a anamnese clínica conversacional passo a passo.
 */
export async function conduzirAnamneseOuDiagnostico(sintomaAtual, historico = []) {
  if (!genAI) {
    throw new Error('GEMINI_API_KEY não configurada');
  }

  const historicoFormatado = (historico || [])
    .filter((m) => m && m.texto)
    .map((m) => `${m.remetente === 'usuario' ? 'Paciente' : 'Médico Cuidaê'}: ${m.texto}`)
    .join('\n');

  const promptFinal = `${PROMPT_ANAMNESE_CONVERSACIONAL}

HISTÓRICO DA CONVERSA ATÉ O MOMENTO:
${historicoFormatado || '(Início da consulta)'}

NOVA FALA DO PACIENTE:
"${sintomaAtual}"`;

  const mensagensUsuario = (historico || []).filter((m) => m && m.remetente === 'usuario').length + 1;

  try {
    return await executarComModelos(async (model) => {
      const result = await model.generateContent(promptFinal);
      const raw = result.response.text();
      const jsonLimpo = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(jsonLimpo);
      if (parsed && parsed.mensagem) {
        parsed.mensagem = removerSaudacaoRepetida(parsed.mensagem);
      }
      return parsed;
    });
  } catch (err) {
    console.warn('[Gemini Anamnese] Ativando protocolo de anamnese de fallback:', err.message);

    const falasPaciente = (historico || [])
      .filter((m) => m && m.remetente === 'usuario' && m.texto)
      .map((m) => m.texto);
    if (!falasPaciente.includes(sintomaAtual)) {
      falasPaciente.push(sintomaAtual);
    }
    const queixaCompleta = falasPaciente.join(', ');
    const s = queixaCompleta.toLowerCase();

    const isEmergenciaCatastrofica = s.includes('desmaio') || s.includes('inconsciente') || s.includes('convuls') ||
      (s.includes('peito') && (s.includes('braço') || s.includes('mandíbula') || s.includes('suor frio')));

    if (isEmergenciaCatastrofica) {
      return {
        prontoParaDiagnostico: true,
        mensagem: 'Identifiquei sinais que requerem atenção médica imediata. Estou gerando seu encaminhamento para o serviço de emergência (SAMU 192 / UPA).',
        relatorioClinico: queixaCompleta,
        resumoPT: queixaCompleta,
        sintomasExtraidosPT: falasPaciente,
        idade: 30,
        sexo: 'male',
        urgenciaPercebida: 'Urgente'
      };
    }

    if (mensagensUsuario < 2 && queixaCompleta.length < 80) {
      return {
        prontoParaDiagnostico: false,
        mensagem: 'Entendo o que você está sentindo. Para que possamos te orientar com precisão: há quantos dias esse sintoma começou e você notou febre ou outra queixa associada?'
      };
    }

    return {
      prontoParaDiagnostico: true,
      mensagem: 'Compreendi suas respostas. Estou consolidando suas informações e gerando a avaliação clínica...',
      relatorioClinico: queixaCompleta,
      resumoPT: queixaCompleta,
      sintomasExtraidosPT: falasPaciente,
      idade: 30,
      sexo: 'male',
      urgenciaPercebida: s.includes('peito') ? 'Alta' : 'Média'
    };
  }
}

/**
 * Gemini escuta o paciente e monta o relatório clínico formal para a Infermedica.
 */
export async function gerarRelatorioFormal(relatoPaciente) {
  try {
    return await executarComModelos(async (model) => {
      const result = await model.generateContent([
        { text: geminiConfig.prompts.relatorioFormal },
        { text: `Relato do paciente: "${relatoPaciente}"` }
      ]);
      const texto = result.response.text();
      const jsonLimpo = texto.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(jsonLimpo);
    });
  } catch (err) {
    console.warn('⚠️ [Gemini] Ativando tradutor clínico interno de resiliência:', err.message);
    const inglesClinico = traduzirParaInglesClinico(relatoPaciente);

    return {
      relatorioClinico: inglesClinico,
      resumoPT: `Relato registrado: ${relatoPaciente}`,
      sintomasExtraidosPT: [relatoPaciente],
      idade: 30,
      sexo: 'male'
    };
  }
}

/**
 * Gemini analisa uma foto enviada e monta o relatório visual formal para a Infermedica.
 */
export async function gerarRelatorioImagem(caminhoImagem, mimeType) {
  if (!genAI) throw new Error('GEMINI_API_KEY não configurada');
  if (!fs.existsSync(caminhoImagem)) throw new Error('Arquivo de imagem não encontrado');

  const imageData = fs.readFileSync(caminhoImagem);
  const base64Image = imageData.toString('base64');

  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType: mimeType || 'image/jpeg'
    }
  };

  return await executarComModelos(async (model) => {
    const result = await model.generateContent([
      { text: PROMPT_IMAGEM_RELATORIO },
      imagePart,
      { text: "Analise a imagem dermatológica para o relatório da Infermedica." }
    ]);
    const texto = result.response.text();
    const jsonLimpo = texto.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(jsonLimpo);
  });
}

/**
 * Gemini humaniza o diagnóstico retornado pela Infermedica
 */
export async function humanizarResultadoFinal(relatoOriginal, relatorioClinicoOuGemini, resultadoInfermedica, camada) {
  if (!genAI) throw new Error('GEMINI_API_KEY não configurada');

  const relatorioClinico = typeof relatorioClinicoOuGemini === 'string'
    ? relatorioClinicoOuGemini
    : (relatorioClinicoOuGemini?.relatorioClinico || relatoOriginal);

  const condicoesRelevantes = (resultadoInfermedica?.diagnostico?.conditions || [])
    .filter((c) => c.probability >= 0.15)
    .slice(0, 5);

  const prompt = geminiConfig.prompts.humanizacao(
    relatoOriginal,
    relatorioClinico,
    condicoesRelevantes.length > 0 ? condicoesRelevantes : (resultadoInfermedica?.diagnostico?.conditions?.slice(0, 3) || []),
    resultadoInfermedica?.triagem?.triage_level,
    camada
  );

  return await executarComModelos(async (model) => {
    const result = await model.generateContent(prompt);
    const texto = result.response.text();
    const jsonLimpo = texto.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(jsonLimpo);
  });
}

/**
 * Gemini formula uma pergunta investigativa acolhedora em PT-BR para afunilar as hipóteses.
 */
export async function gerarPerguntaInvestigativa(relatoPaciente, condicoes, perguntaClinica) {
  try {
    const prompt = geminiConfig.prompts.perguntaInvestigativa(relatoPaciente, condicoes, perguntaClinica);
    return await executarComModelos(async (model) => {
      const result = await model.generateContent(prompt);
      const texto = result.response.text();
      const jsonLimpo = texto.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(jsonLimpo);
    });
  } catch (err) {
    console.warn('⚠️ Fallback ao gerar pergunta investigativa:', err.message);
    return {
      perguntaHumanizada: `Para entender melhor seu caso: você apresenta ${perguntaClinica}?`,
      explicacaoBreve: 'Isso nos ajuda a diferenciar melhor as possíveis causas.',
      opcoesRapidas: ['Sim', 'Não', 'Não tenho certeza']
    };
  }
}

/**
 * Gemini interpreta a resposta em linguagem natural do paciente e mapeia para escolhas da Infermedica.
 */
export async function interpretarRespostaPaciente(respostaPaciente, itensSintomas) {
  const respostaLimpa = (respostaPaciente || '').trim().toLowerCase();

  if (['sim', 's', 'positivo', 'tenho', 'com certeza'].includes(respostaLimpa)) {
    return (itensSintomas || []).map(item => ({ id: item.id, choice_id: 'present' }));
  }
  if (['não', 'nao', 'n', 'negativo', 'não tenho', 'nada'].includes(respostaLimpa)) {
    return (itensSintomas || []).map(item => ({ id: item.id, choice_id: 'absent' }));
  }
  if (['não sei', 'nao sei', 'não tenho certeza', 'talvez', 'duvida', 'dúvida'].includes(respostaLimpa)) {
    return (itensSintomas || []).map(item => ({ id: item.id, choice_id: 'unknown' }));
  }

  try {
    const prompt = geminiConfig.prompts.interpretarResposta(respostaPaciente, itensSintomas);
    return await executarComModelos(async (model) => {
      const result = await model.generateContent(prompt);
      const texto = result.response.text();
      const jsonLimpo = texto.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const data = JSON.parse(jsonLimpo);
      if (Array.isArray(data.respostas) && data.respostas.length > 0) {
        return data.respostas;
      }
      return (itensSintomas || []).map(item => ({ id: item.id, choice_id: 'present' }));
    });
  } catch (err) {
    console.warn('⚠️ Fallback ao interpretar resposta:', err.message);
  }

  return (itensSintomas || []).map(item => ({ id: item.id, choice_id: 'present' }));
}

/**
 * Avaliação direta de sintomas (fallback quando Infermedica estiver indisponível)
 */
export async function avaliarSintomas(textoOriginal, historico = []) {
  if (genAI) {
    try {
      const historicoTexto = (historico || [])
        .filter((m) => m && m.texto)
        .map((m) => `${m.remetente === 'usuario' ? 'Paciente' : 'Atendente'}: ${m.texto}`)
        .join('\n');

      const promptFinal = `${PROMPT_DIAGNOSTICO_DIRETO}\n\nHistórico:\n${historicoTexto}\n\nSintoma atual do paciente: "${textoOriginal}"`;

      return await executarComModelos(async (model, modelName) => {
        const result = await model.generateContent(promptFinal);
        const raw = result.response.text();
        const jsonLimpo = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(jsonLimpo);

        return {
          ...parsed,
          fonteIA: `Google Gemini (${modelName})`
        };
      });
    } catch (err) {
      console.warn('[Gemini] Erro na avaliação direta:', err.message);
    }
  }

  const fallback = analisarSintomas(textoOriginal, 'Gratuito');
  return {
    mensagem: fallback.mensagem,
    recomendacao: fallback.recomendacao,
    especialidade: fallback.especialidade,
    prioridade: fallback.prioridade,
    orientacao: fallback.orientacao,
    tipoUnidade: fallback.prioridade === 'Urgente' ? 'UPA' : 'UBS',
    fonteIA: 'Base Clínica Cuidaê (Offline/Fallback)'
  };
}

/**
 * Avaliação direta de imagem (fallback quando Infermedica estiver indisponível)
 */
export async function avaliarImagem(caminhoImagem, mimeType) {
  if (genAI && fs.existsSync(caminhoImagem)) {
    const imageData = fs.readFileSync(caminhoImagem);
    const base64Image = imageData.toString('base64');

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType || 'image/jpeg'
      }
    };

    try {
      return await executarComModelos(async (model, modelName) => {
        const result = await model.generateContent([
          { text: PROMPT_DIAGNOSTICO_DIRETO },
          imagePart,
          { text: "Avalie esta alteração cutânea visível e recomende a conduta apropriada no SUS." }
        ]);

        const raw = result.response.text();
        const jsonLimpo = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(jsonLimpo);

        return {
          ...parsed,
          fonteIA: `Google Gemini Vision (${modelName})`
        };
      });
    } catch (err) {
      console.warn('[Gemini Vision] Erro na avaliação direta de imagem:', err.message);
    }
  }

  const fallback = analisarImagemFallback('Gratuito', caminhoImagem);
  return {
    mensagem: fallback.mensagem,
    recomendacao: fallback.recomendacao,
    especialidade: fallback.especialidade,
    prioridade: fallback.prioridade,
    orientacao: fallback.orientacao,
    tipoUnidade: 'UBS',
    fonteIA: 'Base Clínica Cuidaê (Offline/Fallback)'
  };
}
