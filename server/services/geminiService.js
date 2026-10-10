import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ============================================================
// PASSO 1: Gemini ESCUTA o paciente e extrai os sintomas → JSON
// ============================================================

const PROMPT_EXTRACAO = `Você é um assistente médico de triagem. O paciente vai descrever o que está sentindo em português brasileiro.

Sua tarefa é EXTRAIR as informações e retornar APENAS um JSON válido (sem markdown, sem crases, sem explicação) no formato:

{
  "sintomasTexto": "Tradução concisa dos sintomas para inglês médico, separados por vírgula (ex: headache, fever, nausea)",
  "idade": 30,
  "sexo": "male",
  "urgenciaPercebida": "baixa | media | alta | critica"
}

REGRAS:
- Se o paciente não mencionar idade, use 30.
- Se o paciente não mencionar sexo, use "male".
- "sintomasTexto" DEVE ser em inglês médico para alimentar o sistema de diagnóstico.
- Se detectar possível emergência (dor no peito, AVC, hemorragia grave, parada respiratória), marque urgenciaPercebida como "critica".`;

/**
 * Gemini escuta o texto do paciente e extrai os sintomas em formato estruturado.
 */
export async function extrairSintomas(textoOriginal) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

  const result = await model.generateContent([
    { text: PROMPT_EXTRACAO },
    { text: `Relato do paciente: "${textoOriginal}"` }
  ]);

  const response = result.response.text();
  const jsonLimpo = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  return JSON.parse(jsonLimpo);
}

// ============================================================
// PASSO 2 (imagem): Gemini ANALISA a foto e descreve o que vê
// ============================================================

const PROMPT_IMAGEM = `Você é um assistente médico de triagem analisando uma imagem enviada pelo paciente.

Observe a imagem e retorne APENAS um JSON válido (sem markdown, sem crases) no formato:

{
  "sintomasTexto": "Descrição em inglês médico do que você observa na imagem (ex: skin lesion, redness, swelling)",
  "descricaoVisual": "Descrição em português do que você observa para explicar ao paciente",
  "idade": 30,
  "sexo": "male",
  "urgenciaPercebida": "baixa | media | alta | critica"
}

REGRAS:
- NUNCA faça diagnóstico definitivo. Use "possível" ou "aparente".
- Descreva características visuais: cor, tamanho, textura, localização.
- Se parecer grave (ferida aberta profunda, queimadura extensa), marque como "alta" ou "critica".`;

/**
 * Gemini analisa uma imagem e extrai os sintomas visuais.
 */
export async function extrairSintomasDeImagem(caminhoImagem, mimeType) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

  const imageData = fs.readFileSync(caminhoImagem);
  const base64Image = imageData.toString('base64');

  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType: mimeType || 'image/jpeg'
    }
  };

  const result = await model.generateContent([
    { text: PROMPT_IMAGEM },
    imagePart
  ]);

  const response = result.response.text();
  const jsonLimpo = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  return JSON.parse(jsonLimpo);
}

// ============================================================
// PASSO 3: Gemini LÊ o resultado da Infermedica e FALA pro paciente
// ============================================================

const PROMPT_HUMANIZAR = `Você é o assistente de triagem "SaúdePraTodos" do sistema público de saúde brasileiro (SUS).

Você vai receber o resultado de um sistema de diagnóstico médico profissional (Infermedica).
Sua tarefa é TRADUZIR esse resultado técnico em uma mensagem ACOLHEDORA e CLARA para o paciente, em português brasileiro.

REGRAS:
1. NUNCA faça diagnóstico definitivo. Diga "há uma possibilidade de" ou "o sistema sugere que pode ser".
2. Sempre recomende buscar atendimento médico presencial.
3. Se a triagem indicar "emergency", instrua a ligar SAMU 192 IMEDIATAMENTE.
4. Seja empático, mas direto. Use 3-4 frases no máximo.
5. Mencione o nome da condição mais provável em linguagem simples.
6. Inclua uma orientação prática de cuidado imediato.

Retorne APENAS um JSON válido (sem markdown, sem crases):
{
  "mensagem": "Sua fala humanizada para o paciente",
  "recomendacao": "Nome do encaminhamento (ex: Avaliação Clínica para Síndrome Gripal)",
  "especialidade": "Especialidade médica indicada",
  "prioridade": "Normal | Média | Alta | Urgente",
  "orientacao": "Cuidados imediatos que o paciente deve tomar",
  "tipoUnidade": "UBS | UPA | Hospital | CAPS | SAMU"
}`;

/**
 * Gemini lê o resultado da Infermedica e gera uma resposta humanizada.
 */
export async function humanizarDiagnostico(sintomasOriginais, resultadoInfermedica, camada) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

  // Monta um resumo do que a Infermedica retornou
  const resumo = montarResumoInfermedica(resultadoInfermedica);

  const result = await model.generateContent([
    { text: PROMPT_HUMANIZAR },
    { text: `
DADOS DO PACIENTE:
- Sintomas relatados: "${sintomasOriginais}"
- Plano de saúde: ${camada}

RESULTADO DO SISTEMA DE DIAGNÓSTICO (Infermedica):
${resumo}

Com base nesses dados, gere a resposta humanizada para o paciente.` }
  ]);

  const response = result.response.text();
  const jsonLimpo = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  return JSON.parse(jsonLimpo);
}

/**
 * Monta um resumo legível do resultado da Infermedica para o Gemini interpretar.
 */
function montarResumoInfermedica(resultado) {
  const partes = [];

  // Sintomas identificados
  if (resultado.evidencias && resultado.evidencias.length > 0) {
    const nomes = resultado.evidencias.map((e) => e.name).join(', ');
    partes.push(`Sintomas identificados: ${nomes}`);
  }

  // Condições mais prováveis
  if (resultado.diagnostico?.conditions?.length > 0) {
    const top3 = resultado.diagnostico.conditions.slice(0, 3);
    const condicoes = top3.map((c) =>
      `- ${c.common_name || c.name}: ${(c.probability * 100).toFixed(1)}% de probabilidade`
    ).join('\n');
    partes.push(`\nCondições mais prováveis:\n${condicoes}`);
  }

  // Nível de triagem
  if (resultado.triagem) {
    const nivelMap = {
      'emergency': 'EMERGÊNCIA — precisa de atendimento imediato',
      'emergency_ambulance': 'EMERGÊNCIA — precisa de ambulância (SAMU 192)',
      'consultation': 'CONSULTA — deve procurar atendimento médico',
      'consultation_24': 'CONSULTA em 24h — agendar atendimento',
      'self_care': 'AUTOCUIDADO — pode tratar em casa com orientação'
    };
    const nivelTexto = nivelMap[resultado.triagem.triage_level] || resultado.triagem.triage_level;
    partes.push(`\nNível de triagem: ${nivelTexto}`);

    if (resultado.triagem.serious?.length > 0) {
      const serios = resultado.triagem.serious.map((s) => s.common_name || s.name).join(', ');
      partes.push(`Condições sérias a considerar: ${serios}`);
    }
  }

  // Pergunta de follow-up (se houver)
  if (resultado.diagnostico?.question) {
    partes.push(`\nO sistema gostaria de perguntar: "${resultado.diagnostico.question.text}"`);
  }

  if (partes.length === 0) {
    partes.push('Nenhum sintoma claro foi identificado pelo sistema de diagnóstico.');
  }

  return partes.join('\n');
}
