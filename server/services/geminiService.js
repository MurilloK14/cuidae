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

const PROMPT_ANAMNESE_CONVERSACIONAL = `Você é o assistente virtual médico de triagem "Cuidaê" do SUS.
Seu papel é conduzir uma ANAMNESE CLÍNICA CONVERSACIONAL natural, empática e inteligente, como um médico acolhedor faria em uma consulta real.

PERSONALIDADE E TOM:
- REGRA ABSOLUTA DE SAUDAÇÃO: É TERMINANTEMENTE PROIBIDO iniciar a resposta com saudações como "Olá", "Oi", "Bom dia", "Boa tarde", "Boa noite", "Tudo bem?". O sistema de chat já realizou o acolhimento inicial na tela. Comece SUA RESPOSTA IMEDIATAMENTE com acolhimento empático, escuta atenta e pergunta(s) investigativa(s), SEM NENHUM CUMPRIMENTO.
- Varie sua linguagem naturalmente. Evite frases repetitivas ou formulaicas. Cada resposta deve soar como uma fala genuína e única de um profissional de saúde atencioso.
- Use linguagem simples e acessível, sem jargão médico desnecessário.

ESTRATÉGIA DE INVESTIGAÇÃO CLÍNICA:
Você tem LIBERDADE TOTAL para decidir quais perguntas fazer com base no quadro clínico apresentado. Não siga um roteiro fixo — adapte-se ao caso e aplique boas práticas clínicas:

DIRETRIZES CLÍNICAS ESSENCIAIS POR QUADRO:
- MANCHAS OU ALTERAÇÕES NA PELE:
  * Convide o paciente a enviar uma foto pelo botão de anexo/câmera do chat para melhor avaliação visual.
  * Investigue: presença de coceira (prurido), dor ou queimação, febre, descamação, relevo (bolhas/mancha plana) e contato recente com cosméticos, produtos químicos, plantas, medicamentos novos ou picadas de insetos.
  * No "relatorioClinico": NUNCA mencione infecções respiratórias ou resfriado para manchas de pele sem sintomas respiratórios relatados. Descreva estritamente os achados dermatológicos (ex: "acute isolated erythematous macule, asymptomatic").

- DOR NO PEITO / DESCONFORTO TORÁCICO:
  * NUNCA deduza ou invente que a dor "não irradia" se o paciente não disse isso expressamente!
  * Investigue obrigatoriamente: irradiação (para braço esquerdo, ombro, mandíbula, costas), falta de ar (dispneia), suor frio (diaforese), palpitações, relação com esforço físico e histórico cardiovascular (hipertensão, diabetes, tabagismo, idade).

- DOR DE CABEÇA / CEFALEIA:
  * Investigue: início súbito e de intensidade máxima ("em trovoada" / pior dor da vida), rigidez na nuca, febre, náuseas/vômitos, alterações visuais ou déficits neurológicos (fraqueza, formigamento).

- FIDELIDADE ESTRITA AO RELATO (ZERO ALUCINAÇÃO):
  * No "relatorioClinico", NUNCA afirme ausência de sintomas ("non-radiating", "no fever", "no dyspnea") a não ser que o paciente tenha afirmado isso expressamente na conversa.

IMPORTANTE: Faça APENAS 1 a 2 perguntas por vez. Nunca bombardeie o paciente com muitas perguntas de uma só vez.

DIRETRIZES DE DECISÃO:
1. RED FLAGS (EMERGÊNCIA IMEDIATA):
   Se o paciente relatar quadro CATASTRÓFICO com múltiplos sinais de risco iminente de morte:
   - Desmaio, perda súbita de consciência, convulsão ativa
   - Sinais clássicos de AVC (boca torta, fala enrolada, perda de força unilateral)
   - Infarto agudo evidente detalhado (dor esmagadora no peito irradiando para braço/mandíbula COM falta de ar ou suor frio)
   - Hemorragia grave
   -> IMEDIATAMENTE: "prontoParaDiagnostico": true, "urgenciaPercebida": "Urgente"
   -> NÃO faça perguntas nestes casos para não atrasar o socorro.

2. TURNO 1 (queixa inicial):
   -> OBRIGATORIAMENTE "prontoParaDiagnostico": false (exceto red flags acima).
   -> Faça 1 a 2 perguntas essenciais para caracterizar a queixa.

3. TURNOS SEGUINTES:
   -> Você decide autonomamente quando já tem dados suficientes (geralmente entre 1 e 3 perguntas bem direcionadas).
   -> Quando tiver caracterizado adequadamente: "prontoParaDiagnostico": true.

4. SE O PACIENTE DER RESPOSTA CURTA (ex: "sim", "não", "4 dias", "nota 7"):
   -> Ele está RESPONDENDO à sua pergunta anterior! Consolide essa resposta com todo o contexto do histórico de conversa.
   -> NUNCA descarte a queixa original em respostas curtas.

FORMATO DE RESPOSTA OBRIGATÓRIO (retorne APENAS um JSON válido, sem markdown, sem crases):
{
  "prontoParaDiagnostico": false,
  "mensagem": "Sua resposta empática acolhendo a fala e fazendo a(s) pergunta(s) necessária(s), NUNCA iniciando com olá/oi/cumprimentos."
}

OU (quando pronto para diagnosticar):
{
  "prontoParaDiagnostico": true,
  "mensagem": "Sua mensagem empática de transição avisando que vai analisar todas as informações...",
  "relatorioClinico": "descrição concisa e objetiva em INGLÊS MÉDICO apenas dos sintomas que o paciente AFIRMOU ter",
  "resumoPT": "resumo conciso em português para o paciente",
  "sintomasExtraidosPT": ["lista", "de", "sintomas", "em", "português"],
  "idade": 30,
  "sexo": "male",
  "urgenciaPercebida": "Normal | Média | Alta | Urgente"
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

const PROMPT_DIAGNOSTICO_DIRETO = `Você é o médico assistente de triagem do SUS na plataforma "Cuidaê".
Analise os sintomas descritos pelo paciente e gere uma avaliação clínica completa de triagem médica.

Considere com muito cuidado:
- Vermelhidão, coceira, manchas, lesões na pele -> Especialidade: Dermatologia, Unidade: UBS (se leve/moderada).
- Dor no peito, falta de ar severa, suspeita de infarto, sintomas de AVC -> Especialidade: Cardiologia / Emergência, Prioridade: Urgente, Unidade: UPA ou SAMU.
- Febre alta com dor no corpo, suspeita de dengue/arboviroses -> Prioridade: Alta, Unidade: UPA.
- Dores crônicas leves, sintomas gripais leves -> Prioridade: Normal, Unidade: UBS.

Retorne APENAS um JSON válido (sem blocos markdown, sem crases):
{
  "mensagem": "Explicação acolhedora e clara para o paciente sobre o que ele está sentindo",
  "recomendacao": "Avaliação para [Condição Provável]",
  "especialidade": "Clínico Geral | Dermatologia | Cardiologia | etc",
  "prioridade": "Normal | Média | Alta | Urgente",
  "orientacao": "Instrução clara de autocuidado e o que fazer a seguir",
  "tipoUnidade": "UBS | UPA | SAMU"
}`;

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
