import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import dotenv from 'dotenv';
import { analisarSintomas, analisarImagem as analisarImagemFallback } from './triageService.js';

dotenv.config();

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
const CANDIDATE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3-flash-preview',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.8-flash',
  'gemini-flash-latest'
];

const PROMPT_ANAMNESE_CONVERSACIONAL = `Você é o assistente virtual médico de triagem "Cuidaê / SaúdePraTodos" do SUS.
Seu objetivo é acolher o paciente com empatia, calor humano e escuta ativa, conduzindo uma ANAMNESE CLÍNICA CONVERSACIONAL antes de fechar o diagnóstico.

OBJETIVO DE ECONOMIA E PRECISÃO CLÍNICA:
Para economizar recursos e ser clinicamente assertivo, você NÃO deve solicitar o diagnóstico ao motor da Infermedica de forma precoce em uma mensagem curta ou vaga.
Converse com o paciente, faça 1 ou 2 perguntas objetivas para investigar a queixa e, somente quando tiver informações clínicas suficientes (ou se o caso for urgente), defina "prontoParaDiagnostico": true para gerar o JSON clínico para a Infermedica.

DIRETRIZES MÉDICAS DE DECISÃO:
1. ALERTA DE EMERGÊNCIA IMEDIATA (RED FLAGS):
   Se o paciente relatar dor forte/aperto no peito, dor irradiada para braço ou mandíbula, falta de ar severa/asfixia, suspeita de AVC (perda súbita de força, boca torta, fala enrolada), convulsão ativa, hemorragia profusa ou desmaio:
   -> Defina IMEDIATAMENTE "prontoParaDiagnostico": true
   -> "urgenciaPercebida": "Urgente"
   -> "relatorioClinico": termos universais em inglês médico do quadro de emergência.
   -> NÃO prolongue a conversa com perguntas! A prioridade é orientar atendimento médico de urgência (SAMU 192 / UPA).

2. QUANDO CONTINUAR CONVERSANDO ("prontoParaDiagnostico": false):
   Defina "prontoParaDiagnostico": false quando:
   - O paciente apenas disse um sintoma inicial ou algo genérico (ex: "estou mal", "dor de cabeça", "febre", "dor de barriga").
   - Faltam informações clínicas vitais como:
     * Tempo de evolução (há quanto tempo começou?);
     * Presença de febre ou medição de temperatura;
     * Sintomas associados (náuseas, manchas na pele, tosse, falta de ar, tontura);
     * Gravidade/intensidade ou fatores de piora/alívio.
   - Sua "mensagem" deve ser empática, humanizada e conter 1 a 2 perguntas claras para investigar o quadro.

3. QUANDO FECHAR A ANAMNESE E DIAGNOSTICAR ("prontoParaDiagnostico": true):
   Defina "prontoParaDiagnostico": true quando:
   - O paciente já informou os sintomas principais E o tempo de evolução / fatores acompanhantes; OU
   - O paciente enviou um relato inicial já muito detalhado e completo; OU
   - Já houve 2 ou mais respostas do paciente no histórico (para não estender demais a conversa); OU
   - O paciente pediu explicitamente o resultado ou disse que é só isso.
   Quando "prontoParaDiagnostico": true:
   - "relatorioClinico": gere os termos concisos em INGLÊS MÉDICO universal para alimentar a Infermedica (ex: "high fever, severe headache, retro-orbital pain, generalized body aches, duration 2 days").
   - "resumoPT": síntese clínica em português dos sintomas do paciente.
   - "sintomasExtraidosPT": array de sintomas em português.
   - "idade": idade informada pelo paciente (se não mencionou, use 30).
   - "sexo": "male" ou "female" (se não mencionou, use "male").
   - "urgenciaPercebida": "Normal" | "Média" | "Alta" | "Urgente".
   - "mensagem": uma breve frase acolhedora indicando que você compreendeu o quadro e está consolidando a avaliação médica.

FORMATO DE RESPOSTA OBRIGATÓRIO (retorne APENAS um JSON válido):
Se ainda estiver conversando:
{
  "prontoParaDiagnostico": false,
  "mensagem": "Sua resposta empática e pergunta(s) investigativa(s) para o paciente"
}

Se já tiver informações suficientes para o diagnóstico:
{
  "prontoParaDiagnostico": true,
  "mensagem": "Compreendi o seu relato. Estou compilando sua avaliação médica e consultando o motor clínico...",
  "relatorioClinico": "termo medico 1, termo medico 2 em inglês",
  "resumoPT": "resumo dos sintomas em português",
  "sintomasExtraidosPT": ["sintoma 1", "sintoma 2"],
  "idade": 30,
  "sexo": "male",
  "urgenciaPercebida": "Normal | Média | Alta | Urgente"
}`;

const PROMPT_IMAGEM_RELATORIO = `Você é um médico dermatologista de triagem.
Analise a imagem enviada pelo paciente e descreva com precisão médica as alterações visíveis (ex: erupção cutânea, vermelhidão, mácula, pústula, edema, etc.).

Retorne APENAS um JSON válido:
{
  "relatorioClinico": "descrição clínica objetiva em inglês médico dos achados visuais (ex: erythematous maculopapular rash on skin, redness)",
  "resumoPT": "descrição acolhedora em português do que foi visualizado na imagem",
  "sintomasExtraidosPT": ["achados visuais em português"],
  "idade": 30,
  "sexo": "male"
}`;

const PROMPT_DIAGNOSTICO_DIRETO = `Você é o assistente de triagem "Cuidaê / SaúdePraTodos" do sistema de saúde brasileiro (SUS).

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

async function executarComModelos(fn) {
  let ultimoErro = null;
  for (const modelName of CANDIDATE_MODELS) {
    for (let tentativa = 0; tentativa < 2; tentativa++) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { responseMimeType: 'application/json' }
        });
        return await fn(model, modelName);
      } catch (err) {
        ultimoErro = err;
        console.warn(`[Gemini] Falha no modelo ${modelName} (tentativa ${tentativa + 1}):`, err.message);
        if (tentativa === 0) {
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
    }
  }
  throw ultimoErro || new Error('Nenhum modelo Gemini respondeu');
}

/**
 * Conduz anamnese clínica conversacional.
 */
export async function conduzirAnamneseOuDiagnostico(sintomaAtual, historico = []) {
  if (!genAI) throw new Error('GEMINI_API_KEY não configurada');

  const mensagensUsuario = historico.filter(m => m.remetente === 'usuario').length + 1;

  let contextoHistorico = '';
  if (Array.isArray(historico) && historico.length > 0) {
    const historicoTexto = historico
      .filter((m) => m && m.texto)
      .slice(-8)
      .map((m) => `${m.remetente === 'usuario' ? 'Paciente' : 'Assistente Cuidaê'}: ${m.texto}`)
      .join('\n');
    contextoHistorico = `HISTÓRICO DA CONVERSA:\n${historicoTexto}\n\n`;
  }

  const promptFinal = `${contextoHistorico}NOVA MENSAGEM DO PACIENTE (Turno ${mensagensUsuario}):\n"${sintomaAtual}"\n
OBSERVAÇÃO DO TURNO:
O paciente já enviou ${mensagensUsuario} mensagem(ns) nesta sessão.
${mensagensUsuario >= 3 ? 'Atenção: Já foram feitas perguntas suficientes. Defina "prontoParaDiagnostico": true para não cansar o paciente, a menos que a mensagem seja completamente sem sentido.' : 'Avalie se ainda é necessário fazer 1 pergunta ou se o quadro já é claro o bastante para fechar a anamnese.'}`;

  try {
    return await executarComModelos(async (model) => {
      const result = await model.generateContent([
        { text: PROMPT_ANAMNESE_CONVERSACIONAL },
        { text: promptFinal }
      ]);

      const texto = result.response.text();
      const jsonLimpo = texto.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(jsonLimpo);
    });
  } catch (err) {
    console.warn('[Gemini Anamnese] Ativando protocolo clínico de anamnese de fallback:', err.message);
    // Consolida todas as falas do paciente no histórico para não perder a queixa principal
    const falasPaciente = (historico || [])
      .filter((m) => m && m.remetente === 'usuario' && m.texto)
      .map((m) => m.texto);
    if (!falasPaciente.includes(sintomaAtual)) {
      falasPaciente.push(sintomaAtual);
    }
    const queixaCompleta = falasPaciente.join(', ');

    const s = queixaCompleta.toLowerCase();
    const isUrgente = s.includes('peito') || s.includes('falta de ar') || s.includes('desmaio') || s.includes('sangue') || s.includes('avc') || s.includes('braço');

    if (isUrgente) {
      return {
        prontoParaDiagnostico: true,
        mensagem: 'Identifiquei sintomas com sinais de alerta imediato. Estou gerando sua triagem para direcionamento de urgência agora.',
        relatorioClinico: queixaCompleta,
        resumoPT: queixaCompleta,
        sintomasExtraidosPT: falasPaciente,
        idade: 30,
        sexo: 'male',
        urgenciaPercebida: 'Urgente'
      };
    }

    if (mensagensUsuario < 2 && queixaCompleta.length < 50) {
      return {
        prontoParaDiagnostico: false,
        mensagem: 'Entendo o que você está sentindo. Para que possamos te orientar com precisão: há quantos dias esse sintoma começou e você notou febre, dor no corpo ou alguma outra queixa associada?'
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
      urgenciaPercebida: 'Média'
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

  return executarComModelos(async (model) => {
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
    : relatorioClinicoOuGemini.relatorioClinico;

  const promptHumanizacao = `Você é o assistente "SaúdePraTodos" do SUS.
Você recebeu os seguintes dados:
- O relato do paciente: "${relatoOriginal}"
- O relatório formal elaborado na anamnese: ${relatorioClinico}
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

  return executarComModelos(async (model) => {
    const result = await model.generateContent(promptHumanizacao);
    const texto = result.response.text();
    const jsonLimpo = texto.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(jsonLimpo);
  });
}

/**
 * Avaliação direta de sintomas (fallback quando Infermedica estiver indisponível)
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

    try {
      return await executarComModelos(async (model, modelName) => {
        const result = await model.generateContent([
          { text: PROMPT_DIAGNOSTICO_DIRETO },
          { text: contextoPaciente }
        ]);

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

  // Fallback clínico local
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
