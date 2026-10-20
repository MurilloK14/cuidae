import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import { geminiConfig } from '../config/aiConfig.js';
import { traduzirParaInglesClinico } from './infermedicaService.js';

const genAI = new GoogleGenerativeAI(geminiConfig.apiKey);

/**
 * Modelos candidatos em ordem de prioridade.
 * Se o modelo principal sofrer pico de demanda (503), alterna automaticamente para flash-lite.
 */
const MODELOS_CANDIDATOS = [
  geminiConfig.model || 'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite'
].filter((m, i, arr) => Boolean(m) && arr.indexOf(m) === i);

/**
 * Executa requisição ao Gemini com retry e failover automático de modelos.
 */
async function chamarGeminiComRetry(promptPayload, generationConfig) {
  let ultimoErro = null;

  for (const modelName of MODELOS_CANDIDATOS) {
    for (let tentativa = 1; tentativa <= 2; tentativa++) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig
        });

        const result = await model.generateContent(promptPayload);
        const texto = result.response.text();
        const jsonLimpo = texto.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        return JSON.parse(jsonLimpo);
      } catch (err) {
        ultimoErro = err;
        const msg = err.message || '';
        const isTemporary = msg.includes('503') || msg.includes('429') || msg.includes('high demand') || msg.includes('temporarily');

        if (isTemporary && tentativa === 1) {
          // Breve pausa de 500ms para superar pico de concorrência
          await new Promise(r => setTimeout(r, 500));
          continue;
        }

        console.warn(`⚠️ [Gemini] Modelo ${modelName} indisponível (${msg.slice(0, 100)}...). Alternando modelo...`);
        break; // Tenta o próximo modelo
      }
    }
  }

  throw ultimoErro;
}

/**
 * Gemini escuta o paciente e monta o relatório clínico formal para a Infermedica.
 * Possui fallback clínico caso a API do Google passe por instabilidade externa temporária.
 */
export async function gerarRelatorioFormal(relatoPaciente) {
  try {
    return await chamarGeminiComRetry([
      { text: geminiConfig.prompts.relatorioFormal },
      { text: `Relato do paciente: "${relatoPaciente}"` }
    ], geminiConfig.generationConfig.clinical);
  } catch (err) {
    console.warn('⚠️ [Gemini] Instabilidade na API externa. Ativando tradutor clínico interno de resiliência:', err.message);
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
  const imageData = fs.readFileSync(caminhoImagem);
  const base64Image = imageData.toString('base64');

  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType: mimeType || 'image/jpeg'
    }
  };

  return await chamarGeminiComRetry([
    { text: geminiConfig.prompts.laudoImagem },
    imagePart,
    { text: "Analise a imagem dermatológica para o relatório da Infermedica." }
  ], geminiConfig.generationConfig.clinical);
}

/**
 * Gemini humaniza o diagnóstico retornado pela Infermedica
 */
export async function humanizarResultadoFinal(relatoOriginal, relatorioGemini, resultadoInfermedica, camada) {
  const prompt = geminiConfig.prompts.humanizacao(
    relatoOriginal,
    relatorioGemini.relatorioClinico,
    resultadoInfermedica.diagnostico?.conditions?.slice(0, 3) || [],
    resultadoInfermedica.triagem?.triage_level,
    camada
  );

  return await chamarGeminiComRetry(prompt, geminiConfig.generationConfig.humanization);
}

/**
 * Gemini formula uma pergunta investigativa acolhedora em PT-BR para afunilar as hipóteses.
 */
export async function gerarPerguntaInvestigativa(relatoPaciente, condicoes, perguntaClinica) {
  try {
    const prompt = geminiConfig.prompts.perguntaInvestigativa(relatoPaciente, condicoes, perguntaClinica);
    return await chamarGeminiComRetry(prompt, geminiConfig.generationConfig.humanization);
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
  const respostaLimpa = respostaPaciente.trim().toLowerCase();

  // Heurística rápida direta para respostas comuns de botão
  if (['sim', 's', 'positivo', 'tenho', 'com certeza'].includes(respostaLimpa)) {
    return itensSintomas.map(item => ({ id: item.id, choice_id: 'present' }));
  }
  if (['não', 'nao', 'n', 'negativo', 'não tenho', 'nada'].includes(respostaLimpa)) {
    return itensSintomas.map(item => ({ id: item.id, choice_id: 'absent' }));
  }
  if (['não sei', 'nao sei', 'não tenho certeza', 'talvez', 'duvida', 'dúvida'].includes(respostaLimpa)) {
    return itensSintomas.map(item => ({ id: item.id, choice_id: 'unknown' }));
  }

  // Se o paciente digitou uma resposta mais elaborada, usamos o Gemini para interpretar
  try {
    const prompt = geminiConfig.prompts.interpretarResposta(respostaPaciente, itensSintomas);
    const data = await chamarGeminiComRetry(prompt, geminiConfig.generationConfig.clinical);

    if (Array.isArray(data.respostas) && data.respostas.length > 0) {
      return data.respostas;
    }
  } catch (err) {
    console.warn('⚠️ Fallback ao interpretar resposta com Gemini:', err.message);
  }

  // Fallback padrão se não conseguiu interpretar
  return itensSintomas.map(item => ({ id: item.id, choice_id: 'present' }));
}
