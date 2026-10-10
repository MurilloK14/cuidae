import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const PROMPT_DIAGNOSTICO = `Você é o assistente de triagem "SaúdePraTodos" do sistema público de saúde brasileiro (SUS).

Você deve analisar os sintomas do paciente (descritos em texto ou inferidos de uma imagem) e gerar uma avaliação de triagem completa e humanizada.

REGRAS:
1. NUNCA faça diagnóstico definitivo. Diga "há uma possibilidade de" ou "os sintomas sugerem que pode ser".
2. Sempre recomende buscar atendimento médico presencial.
3. Se detectar possível emergência (dor no peito, AVC, hemorragia grave, parada respiratória), marque prioridade como "Urgente" e tipoUnidade como "SAMU".
4. Seja empático, mas direto. Use 3-4 frases no máximo para a mensagem principal.
5. Mencione o nome da condição mais provável em linguagem simples.
6. Inclua uma orientação prática de cuidado imediato.

Retorne APENAS um JSON válido (sem markdown, sem crases) com a seguinte estrutura:
{
  "mensagem": "Sua fala humanizada para o paciente",
  "recomendacao": "Possível condição clínica (ex: Avaliação para Síndrome Gripal)",
  "especialidade": "Especialidade médica indicada (ex: Clínico Geral)",
  "prioridade": "Normal | Média | Alta | Urgente",
  "orientacao": "Cuidados imediatos que o paciente deve tomar",
  "tipoUnidade": "UBS | UPA | CAPS | SAMU"
}`;

/**
 * Gemini avalia os sintomas em texto e gera o diagnóstico.
 */
export async function avaliarSintomas(textoOriginal) {
  const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

  const result = await model.generateContent([
    { text: PROMPT_DIAGNOSTICO },
    { text: `Relato do paciente: "${textoOriginal}"` }
  ]);

  const response = result.response.text();
  const jsonLimpo = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  return JSON.parse(jsonLimpo);
}

/**
 * Gemini avalia uma imagem e gera o diagnóstico.
 */
export async function avaliarImagem(caminhoImagem, mimeType) {
  const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

  const imageData = fs.readFileSync(caminhoImagem);
  const base64Image = imageData.toString('base64');

  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType: mimeType || 'image/jpeg'
    }
  };

  const result = await model.generateContent([
    { text: PROMPT_DIAGNOSTICO },
    imagePart,
    { text: "Paciente enviou esta imagem para triagem. Avalie as características visíveis e sugira encaminhamento." }
  ]);

  const response = result.response.text();
  const jsonLimpo = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  return JSON.parse(jsonLimpo);
}
