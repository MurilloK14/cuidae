import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import dotenv from 'dotenv';
import { analisarSintomas, analisarImagem as analisarImagemFallback } from './triageService.js';

dotenv.config();

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
const CANDIDATE_MODELS = ['gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest'];

const PROMPT_DIAGNOSTICO = `Você é o assistente de triagem "Cuidaê / SaúdePraTodos" do sistema de saúde brasileiro (SUS).

Você deve analisar os sintomas do paciente (descritos em texto ou inferidos de uma imagem) e gerar uma avaliação de triagem completa e humanizada.

REGRAS:
1. NUNCA faça diagnóstico definitivo. Diga "há uma possibilidade de" ou "os sintomas sugerem que pode ser".
2. Sempre recomende buscar atendimento médico presencial se houver piora.
3. Se detectar possível emergência (dor no peito, dor irradiada para o braço, falta de ar grave, AVC, hemorragia intensa, parada respiratória, fratura exposta), marque prioridade como "Urgente" e tipoUnidade como "SAMU" ou "UPA".
4. Seja empático, mas direto e acolhedor (3 a 4 frases no máximo para a mensagem principal).
5. Mencione o nome da condição provável em linguagem simples.
6. Inclua uma orientação prática e clara de cuidado imediato.

Retorne APENAS um JSON válido com esta estrutura exata:
{
  "mensagem": "Sua fala humanizada e acolhedora para o paciente",
  "recomendacao": "Possível condição clínica (ex: Avaliação para Arbovirose / Dengue)",
  "especialidade": "Especialidade médica indicada (ex: Clínico Geral / Infectologia)",
  "prioridade": "Normal | Média | Alta | Urgente",
  "orientacao": "Cuidados imediatos e orientação preventiva que o paciente deve tomar",
  "tipoUnidade": "UBS | UPA | CAPS | SAMU"
}`;

/**
 * Gemini avalia os sintomas em texto e gera o diagnóstico.
 */
export async function avaliarSintomas(textoOriginal, historico = []) {
  if (genAI) {
    let contextoPaciente = `Relato do paciente: "${textoOriginal}"`;
    if (Array.isArray(historico) && historico.length > 0) {
      const historicoTexto = historico
        .filter(m => m.texto)
        .slice(-6)
        .map(m => `${m.remetente === 'usuario' ? 'Paciente' : 'Assistente Cuidaê'}: ${m.texto}`)
        .join('\n');
      contextoPaciente = `Histórico prévio da conversa:\n${historicoTexto}\n\nNova mensagem do paciente: "${textoOriginal}"\n\nResponda de forma humanizada e atualize a triagem médica considerando o contexto acumulado.`;
    }

    for (const modelName of CANDIDATE_MODELS) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { responseMimeType: 'application/json' }
        });

        const result = await model.generateContent([
          { text: PROMPT_DIAGNOSTICO },
          { text: contextoPaciente }
        ]);

        const raw = result.response.text();
        const jsonLimpo = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(jsonLimpo);

        return {
          ...parsed,
          fonteIA: `Google Gemini (${modelName})`
        };
      } catch (err) {
        console.warn(`[Gemini] Modelo ${modelName} falhou:`, err.message);
      }
    }
  }

  // Fallback clínico
  console.log('[Triage] Usando base de conhecimento clínica de fallback');
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
 * Gemini avalia uma imagem e gera o diagnóstico.
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

    for (const modelName of CANDIDATE_MODELS) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { responseMimeType: 'application/json' }
        });

        const result = await model.generateContent([
          { text: PROMPT_DIAGNOSTICO },
          imagePart,
          { text: "Paciente enviou esta imagem para triagem. Avalie as características visíveis e sugira encaminhamento e cuidados." }
        ]);

        const raw = result.response.text();
        const jsonLimpo = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(jsonLimpo);

        return {
          ...parsed,
          fonteIA: `Google Gemini Vision (${modelName})`
        };
      } catch (err) {
        console.warn(`[Gemini Vision] Modelo ${modelName} falhou:`, err.message);
      }
    }
  }

  // Fallback dermatológico
  console.log('[Triage] Usando análise dermatológica de fallback');
  const fallback = analisarImagemFallback('Gratuito', caminhoImagem);
  return {
    mensagem: fallback.mensagem,
    recomendacao: fallback.recomendacao,
    especialidade: fallback.especialidade,
    prioridade: fallback.prioridade,
    orientacao: fallback.orientacao,
    tipoUnidade: 'UBS',
    fonteIA: 'Base Dermatológica Cuidaê (Offline/Fallback)'
  };
}
