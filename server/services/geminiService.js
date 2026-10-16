import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const PROMPT_RELATORIO_FORMAL = `Você é um médico assistente de triagem de alta precisão.
O paciente descreve o que está sentindo em português brasileiro (muitas vezes em linguagem informal ou leiga).

Sua missão:
1. Analisar com cuidado os sintomas relatados.
2. Identificar a idade e sexo caso o paciente mencione (se não mencionar, use 30 e "male").
3. Gerar um RELATÓRIO CLÍNICO FORMAL em INGLÊS MÉDICO que será enviado diretamente para a API de diagnóstico da Infermedica.
   Use termos médicos universais em inglês adequados para o motor da Infermedica (ex: "skin rash", "high fever", "generalized body aches", "severe crushing chest pain", "shortness of breath", "sore throat", "nausea", "headache").

Retorne APENAS um JSON válido (sem blocos markdown, sem crases, sem explicações):
{
  "relatorioClinico": "termos médicos concisos em inglês separados por vírgula",
  "resumoPT": "resumo clínico conciso em português para o paciente",
  "sintomasExtraidosPT": ["lista de sintomas identificados em português"],
  "idade": 30,
  "sexo": "male"
}`;

const PROMPT_IMAGEM_RELATORIO = `Você é um médico dermatologista de triagem.
Analise a imagem enviada pelo paciente e descreva com precisão médica as alterações visíveis (ex: erupção cutânea, vermelhidão, mácula, pústula, edema, etc.).

Retorne APENAS um JSON válido (sem blocos markdown, sem crases):
{
  "relatorioClinico": "descrição clínica objetiva em inglês médico dos achados visuais (ex: erythematous maculopapular rash on skin, redness)",
  "resumoPT": "descrição acolhedora em português do que foi visualizado na imagem",
  "sintomasExtraidosPT": ["achados visuais em português"],
  "idade": 30,
  "sexo": "male"
}`;

/**
 * Gemini escuta o paciente e monta o relatório clínico formal para a Infermedica.
 */
export async function gerarRelatorioFormal(relatoPaciente) {
  const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

  const result = await model.generateContent([
    { text: PROMPT_RELATORIO_FORMAL },
    { text: `Relato do paciente: "${relatoPaciente}"` }
  ]);

  const texto = result.response.text();
  const jsonLimpo = texto.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  return JSON.parse(jsonLimpo);
}

/**
 * Gemini analisa uma foto enviada e monta o relatório visual formal para a Infermedica.
 */
export async function gerarRelatorioImagem(caminhoImagem, mimeType) {
  const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

  const imageData = fs.readFileSync(caminhoImagem);
  const base64Image = imageData.toString('base64');

  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType: mimeType || 'image/jpeg'
    }
  };

  const result = await model.generateContent([
    { text: PROMPT_IMAGEM_RELATORIO },
    imagePart,
    { text: "Analise a imagem dermatológica para o relatório da Infermedica." }
  ]);

  const texto = result.response.text();
  const jsonLimpo = texto.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  return JSON.parse(jsonLimpo);
}

/**
 * Gemini humaniza o diagnóstico retornado pela Infermedica
 */
export async function humanizarResultadoFinal(relatoOriginal, relatorioGemini, resultadoInfermedica, camada) {
  const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

  const promptHumanizacao = `Você é o assistente "SaúdePraTodos" do SUS.
Você recebeu os seguintes dados:
- O relato original do paciente: "${relatoOriginal}"
- O relatório formal elaborado: ${relatorioGemini.relatorioClinico}
- As hipóteses diagnósticas retornadas pelo motor clínico da Infermedica:
${JSON.stringify(resultadoInfermedica.diagnostico?.conditions?.slice(0, 3) || [], null, 2)}
- O nível de triagem da Infermedica: ${resultadoInfermedica.triagem?.triage_level || 'consultation'}
- Categoria de atendimento: ${camada}

Elabore uma mensagem clara, empática e acolhedora em português brasileiro para o paciente, explicando:
1. O que foi compreendido do caso dele.
2. As hipóteses clínicas apontadas pela Infermedica (sem diagnóstico definitivo, use "possibilidade" ou "sugere").
3. A conduta recomendada (repouso, consulta na UBS, UPA ou SAMU se grave).

Retorne APENAS um JSON válido:
{
  "mensagem": "Sua explicação acolhedora e completa para o paciente",
  "recomendacao": "Avaliação para [Condição mais provável]",
  "especialidade": "Clínico Geral / Medicina da Família / Emergencista",
  "prioridade": "Normal | Média | Alta | Urgente",
  "orientacao": "Instrução de cuidado imediato",
  "tipoUnidade": "UBS | UPA | SAMU"
}`;

  const result = await model.generateContent(promptHumanizacao);
  const texto = result.response.text();
  const jsonLimpo = texto.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  return JSON.parse(jsonLimpo);
}
