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
   -> OBRIGATORIAMENTE "prontoParaDiagnostico": false (exceto red flags acima)
   -> Faça 1-2 perguntas investigativas direcionadas para começar a mapear as possíveis causas.

3. REGRAS PARA INVESTIGAÇÃO vs ENCERRAMENTO DA ANAMNESE:
   A) QUANDO CONTINUAR PERGUNTANDO ("prontoParaDiagnostico": false):
      - Se você AINDA NÃO TEM dados clínicos suficientes para delinear causas e hipóteses diagnósticas claras;
      - O paciente precisa de uma avaliação precisa: faça perguntas clínicas direcionadas para afunilar as possibilidades (ex: características da lesão/dor, formato/relevo, evolução no tempo, fatores de melhora ou piora, contato com substâncias/produtos, novos medicamentos tomados, sintomas associados);
      - NUNCA encerre a anamnese de forma precipitada com apenas 1 ou 2 respostas monossilábicas ou vagas. Continue perguntando com acolhimento até ter um quadro com possíveis causas.

   B) QUANDO FECHAR A ANAMNESE ("prontoParaDiagnostico": true):
      Feche a anamnese SOMENTE quando uma das condições abaixo for atendida:
      1. Você já colheu informações clínicas suficientes e consistentes que permitam apontar com clareza as causas e hipóteses diagnósticas mais prováveis;
      2. OU o paciente já enviou um relato detalhado, completo e elucidativo desde o início;
      3. OU o paciente pediu explicitamente o resultado ou conclusão ("o que eu tenho?", "qual o diagnóstico?", "pode concluir");
      4. OU já foram feitas diversas perguntas investigativas (4 ou mais turnos com respostas do paciente no histórico) e, mesmo com a investigação aprofundada, o quadro permanece atípico.
   Quando fechar:
   - "relatorioClinico": termos concisos em INGLÊS MÉDICO para alimentar o motor clínico Infermedica (ex: "substernal chest pain, duration 2 days, mild intensity, worse with movement, no fever")
   - "resumoPT": síntese clínica em português
   - "sintomasExtraidosPT": array de sintomas em português
   - "idade": idade informada (ou 30 se não mencionou)
   - "sexo": "male" ou "female" (ou "male" se não mencionou)
   - "urgenciaPercebida": "Normal" | "Média" | "Alta" | "Urgente"
   - "mensagem": frase acolhedora indicando que compreendeu e está gerando a avaliação

FORMATO DE RESPOSTA (retorne APENAS JSON válido):
Se ainda conversando:
{
  "prontoParaDiagnostico": false,
  "mensagem": "Sua resposta empática com pergunta(s) investigativa(s)"
}

Se pronto para diagnóstico:
{
  "prontoParaDiagnostico": true,
  "mensagem": "Frase acolhedora de transição",
  "relatorioClinico": "termos médicos em inglês",
  "resumoPT": "resumo em português",
  "sintomasExtraidosPT": ["sintoma 1", "sintoma 2"],
  "idade": 30,
  "sexo": "male",
  "urgenciaPercebida": "Normal"
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
          generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 500, temperature: 0.5 }
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

export function removerSaudacaoRepetida(texto) {
  if (!texto) return texto;
  const limpo = texto
    .replace(/^(olá|ola|oi|bom dia|boa tarde|boa noite|saudações)[!,\.\s\-]+/i, '')
    .replace(/^(olá|ola|oi),?\s*(tudo bem|como vai|como você está|sou a cuidaê|sou o cuidaê)[!,\.\s\-?]+/i, '')
    .trim();
  return limpo ? limpo.charAt(0).toUpperCase() + limpo.slice(1) : texto;
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
      const parsed = JSON.parse(jsonLimpo);
      if (parsed && parsed.mensagem) {
        parsed.mensagem = removerSaudacaoRepetida(parsed.mensagem);
      }
      return parsed;
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

    // Emergência crítica evidente (quando o paciente já descreveu colapso ou múltiplos sinais clássicos de IAM/AVC)
    const temColapsoOuInconsciencia = s.includes('desmaio') || s.includes('desmaiei') || s.includes('inconsciente') || s.includes('convuls');
    const temAvcEvidente = (s.includes('boca torta') || s.includes('perda de forca') || s.includes('perda de força')) || (s.includes('avc') && s.includes('lado'));
    const temHemorragiaGrave = s.includes('hemorragia') || s.includes('sangue pela boca') || s.includes('vomitando sangue');
    const temIamClassicoCompleto = (s.includes('peito') || s.includes('toracica') || s.includes('torácica')) &&
      (s.includes('braço') || s.includes('braco') || s.includes('mandibula') || s.includes('mandíbula') || s.includes('irradi')) &&
      (s.includes('insuportavel') || s.includes('insuportável') || s.includes('falta de ar') || s.includes('suor frio') || s.includes('aperta'));

    const isEmergenciaCatastrofica = temColapsoOuInconsciencia || temAvcEvidente || temHemorragiaGrave || temIamClassicoCompleto;

    if (isEmergenciaCatastrofica) {
      return {
        prontoParaDiagnostico: true,
        mensagem: 'Identifiquei sintomas com sinais de alerta crítico imediato. Estou gerando sua triagem de urgência para direcionamento imediato ao serviço de emergência (SAMU 192 / UPA).',
        relatorioClinico: queixaCompleta,
        resumoPT: queixaCompleta,
        sintomasExtraidosPT: falasPaciente,
        idade: 30,
        sexo: 'male',
        urgenciaPercebida: 'Urgente'
      };
    }

    // Se é o primeiro turno do paciente e relatou dor no peito sem duração ou intensidade:
    if (mensagensUsuario < 2 && (s.includes('peito') || s.includes('toracica') || s.includes('torácica'))) {
      return {
        prontoParaDiagnostico: false,
        mensagem: 'Compreendo sua preocupação com essa dor no peito. Para avaliarmos com segurança e precisão: há quanto tempo ela começou (minutos, horas ou dias), de 0 a 10 qual é a intensidade (e se é aperto, queimação ou pontada), e se você sente que ela espalha para o braço/mandíbula ou se piora ao apertar o peito / respirar fundo?'
      };
    }

    if (mensagensUsuario < 2 && queixaCompleta.length < 80) {
      return {
        prontoParaDiagnostico: false,
        mensagem: 'Entendo o que você está sentindo. Para que possamos te orientar com precisão: há quantos dias esse sintoma começou, de 0 a 10 qual a intensidade do incômodo e você notou febre ou outra queixa associada?'
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

  // Filtra hipóteses com probabilidade estatística relevante (>= 15%)
  // Hipóteses residuais abaixo de 15% (como 7% de Resfriado Comum para manchas de pele)
  // são ruído bayesiano de base da Infermedica e não devem contaminar o laudo.
  const condicoesRelevantes = (resultadoInfermedica.diagnostico?.conditions || [])
    .filter((c) => c.probability >= 0.15)
    .slice(0, 5);

  const diagnosticoTexto = condicoesRelevantes.length > 0
    ? JSON.stringify(condicoesRelevantes, null, 2)
    : 'A Infermedica não atingiu limiar estatístico (>= 15%) para as evidências pontuais. Como médico assistente de triagem, analise o conjunto de sintomas e o histórico clínico para levantar as 2 a 4 hipóteses diagnósticas e possíveis causas mais prováveis.';

  const promptHumanizacao = `Você é o assistente clínico médico "Cuidaê" do SUS, responsável por realizar a avaliação diagnóstica compreensiva e humanizada para o paciente.

DADOS RECEBIDOS:
- Relato do paciente: "${relatoOriginal}"
- Relatório clínico da anamnese: ${relatorioClinico}
- Hipóteses diagnósticas do motor clínico Infermedica:
${diagnosticoTexto}
- Nível de triagem Infermedica: ${resultadoInfermedica.triagem?.triage_level || 'consultation'}
- Sintomas identificados: ${JSON.stringify(resultadoInfermedica.evidencias?.map((e) => e.name) || [])}

REGRAS ABSOLUTAS:
1. NUNCA DEIXE COMO "A ESCLARECER" OU SEM CAUSAS PROVÁVEIS:
   - É TERMINANTEMENTE PROIBIDO responder "Quadro clínico a esclarecer", "Avaliação a esclarecer" ou termos evasivos vazios.
   - O paciente busca entender o que pode estar causando seu problema. Você DEVE SEMPRE elencar e explicar as 2 a 4 hipóteses clínicas mais prováveis (possíveis causas) para o quadro apresentado!
   - Se a Infermedica não tiver trazido hipóteses fortes, use seu raciocínio médico para indicar as causas mais comuns e plausíveis (ex: para mancha na pele sem outros sintomas: Dermatite de Contato, Reação Alérgica / Farmacodermia, Urticária ou Pitiríase; para dor no peito sem sinais agudos: Dor Musculoesquelética / Costocondrite ou Refluxo Gastroesofágico; para dor de cabeça: Cefaleia Tensional ou Enxaqueca).
   - NUNCA sugira resfriado comum para manchas isoladas na pele.

2. TUDO OBRIGATORIAMENTE EM PORTUGUÊS DO BRASIL:
   - É terminantemente proibido exibir qualquer termo em inglês. Traduza todos os termos médicos.

3. A "mensagem" deve ser COMPLETA e DETALHADA (mínimo 4-6 frases):
   - Comece acolhendo o paciente e reconhecendo o quadro detalhado que ele descreveu;
   - Explique detalhadamente cada uma das POSSÍVEIS CAUSAS clínicas consideradas e o que cada uma significa em linguagem simples;
   - Informe com clareza o nível de urgência e o tipo de unidade recomendada (UBS, UPA ou SAMU);
   - Finalize com orientações práticas imediatas de cuidado e sinais de alerta para procurar emergência.

4. A "recomendacao" DEVE conter o nome das principais possíveis causas em português claro (ex: "Avaliação para Dermatite de Contato / Reação Alérgica Cutânea" ou "Avaliação para Cefaleia Tensional / Enxaqueca").

5. O campo "hipotesesClinicas" DEVE ser uma lista (array de strings) com as 2 a 4 possíveis causas diagnósticas em português (ex: ["Dermatite de Contato", "Reação Alérgica Cutânea", "Farmacodermia"]).

6. A "orientacao" deve incluir cuidados práticos específicos para o caso (não genéricos) e sinais de alerta.

Retorne APENAS um JSON válido:
{
  "mensagem": "Explicação completa, humanizada e detalhada descrevendo as possíveis causas clínicas (4-6 frases)",
  "recomendacao": "Avaliação para [Causas Principais Prováveis em Português Claro]",
  "especialidade": "Especialidade médica indicada (ex: Dermatologia, Clínica Geral, Neurologia)",
  "prioridade": "Normal | Média | Alta | Urgente",
  "orientacao": "Orientações específicas de cuidado imediato e sinais de alerta",
  "tipoUnidade": "UBS | UPA | SAMU",
  "hipotesesClinicas": ["Possível Causa 1", "Possível Causa 2", "Possível Causa 3"]
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
