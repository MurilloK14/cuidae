import dotenv from 'dotenv';
dotenv.config();

/**
 * Configurações centralizadas para os motores de Inteligência Artificial:
 * 1. Google Gemini (Processamento de linguagem natural, visão computacional e humanização)
 * 2. Infermedica v3 (Motor clínico probabilístico bayesiano e triagem de urgência)
 */

export const geminiConfig = {
  apiKey: process.env.GEMINI_API_KEY || '',
  model: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
  
  // Parâmetros de geração para controle de precisão médica vs empatia
  generationConfig: {
    clinical: {
      temperature: 0.1, // Quase determinístico para extração precisa de termos clínicos
      topP: 0.8,
      maxOutputTokens: 1024
    },
    humanization: {
      temperature: 0.4, // Mais flexível e acolhedor na comunicação com o paciente
      topP: 0.9,
      maxOutputTokens: 1500
    }
  },

  // Prompts estruturados do sistema
  prompts: {
    relatorioFormal: `Você é um médico assistente de triagem de alta precisão.
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
}`,

    laudoImagem: `Você é um médico dermatologista de triagem.
Analise a imagem enviada pelo paciente e descreva com precisão médica as alterações visíveis (ex: erupção cutânea, vermelhidão, mácula, pústula, edema, etc.).

Retorne APENAS um JSON válido (sem blocos markdown, sem crases):
{
  "relatorioClinico": "descrição clínica objetiva em inglês médico dos achados visuais (ex: erythematous maculopapular rash on skin, redness)",
  "resumoPT": "descrição acolhedora em português do que foi visualizado na imagem",
  "sintomasExtraidosPT": ["achados visuais em português"],
  "idade": 30,
  "sexo": "male"
}`,

    humanizacao: (relatoOriginal, relatorioClinico, condicoes, triageLevel, camada) => `Você é o assistente "SaúdePraTodos" do SUS.
Você recebeu os seguintes dados:
- O relato original do paciente: "${relatoOriginal}"
- O relatório formal elaborado: ${relatorioClinico}
- As hipóteses diagnósticas retornadas pelo motor clínico da Infermedica:
${JSON.stringify(condicoes || [], null, 2)}
- O nível de triagem da Infermedica: ${triageLevel || 'consultation'}
- Categoria de atendimento: ${camada}

Elabore uma mensagem clara, empática e acolhedora em português brasileiro para o paciente, explicando:
1. O que foi compreendido do caso dele.
2. As hipóteses clínicas apontadas pela Infermedica (sem diagnóstico definitivo, use "possibilidade" ou "sugere").
3. A conduta recomendada (repouso, consulta na UBS, UPA ou SAMU se grave).

Retorne APENAS um JSON válido (sem markdown, sem crases):
{
  "mensagem": "Sua explicação acolhedora e completa para o paciente",
  "recomendacao": "Avaliação para [Condição mais provável]",
  "especialidade": "Clínico Geral / Medicina da Família / Emergencista",
  "prioridade": "Normal | Média | Alta | Urgente",
  "orientacao": "Instrução de cuidado imediato",
  "tipoUnidade": "UBS | UPA | SAMU"
}`,

    perguntaInvestigativa: (relatoPaciente, condicoes, perguntaClinica) => `Você é o assistente virtual humanizado e acolhedor "SaúdePraTodos" do SUS.
O paciente relatou: "${relatoPaciente}"

Com base nesse relato, o motor clínico da Infermedica levantou as seguintes hipóteses diagnósticas em avaliação:
${JSON.stringify(condicoes || [], null, 2)}

Para desempatar ou confirmar essas hipóteses com maior segurança, a Infermedica precisa investigar clinicamente:
"${perguntaClinica}"

Sua tarefa:
1. Formule uma pergunta ÚNICA, direta e muito acolhedora em português brasileiro para o paciente.
2. Explique brevemente (em 1 frase simples) por que essa pergunta é importante para entender o quadro dele.
3. Não use jargões difíceis (ex: em vez de "dor retro-orbital", diga "dor atrás dos olhos ao movimentá-los").

Retorne APENAS um JSON válido (sem blocos markdown, sem crases):
{
  "perguntaHumanizada": "texto da pergunta acolhedora e clara",
  "explicacaoBreve": "Por que estamos perguntando isso",
  "opcoesRapidas": ["Sim", "Não", "Não tenho certeza"]
}`,

    interpretarResposta: (respostaPaciente, itensSintomas) => `Você é um médico assistente de triagem de alta precisão.
O sistema perguntou sobre os seguintes itens clínicos da Infermedica:
${JSON.stringify(itensSintomas || [], null, 2)}

O paciente respondeu em linguagem natural:
"${respostaPaciente}"

Sua tarefa é mapear a resposta do paciente para cada item clínico, escolhendo exatamente entre:
- "present": o paciente confirmou ou indicou que tem o sintoma/fator
- "absent": o paciente negou ou disse que não tem o sintoma/fator
- "unknown": o paciente não sabe, não tem certeza ou não mencionou

Retorne APENAS um JSON válido (sem blocos markdown, sem crases):
{
  "respostas": [
    {
      "id": "id do item clínico (ex: s_21)",
      "choice_id": "present"
    }
  ]
}`
  }
};

export const infermedicaConfig = {
  appId: process.env.INFERMEDICA_APP_ID || '',
  appKey: process.env.INFERMEDICA_APP_KEY || '',
  baseUrl: process.env.INFERMEDICA_BASE_URL || 'https://api.infermedica.com/v3',
  
  get headers() {
    return {
      'App-Id': this.appId,
      'App-Key': this.appKey,
      'Content-Type': 'application/json'
    };
  },

  // Dados de paciente padrão quando não especificado
  defaultPatient: {
    age: 30,
    sex: 'male'
  },

  // Regras do loop interativo de diagnóstico (Entrevista Dinâmica)
  interviewRules: {
    // Número máximo de perguntas por sessão para evitar fadiga do paciente
    maxQuestions: parseInt(process.env.INFERMEDICA_MAX_QUESTIONS || '6', 10),
    
    // Limiar de certeza diagnóstica: se a condição principal atingir essa probabilidade, para o loop
    confidenceThreshold: parseFloat(process.env.INFERMEDICA_CONFIDENCE_THRESHOLD || '0.80'),
    
    // Diferença mínima entre o 1º e o 2º diagnóstico para considerar afunilado
    deltaThreshold: parseFloat(process.env.INFERMEDICA_DELTA_THRESHOLD || '0.35'),
    
    // Quantidade de hipóteses diagnósticas a manter em destaque
    topConditionsCount: 3,

    // Permitir agrupamento de sintomas nas perguntas
    disableGroups: false
  }
};

/**
 * Status operacional dos serviços de IA
 */
export const aiStatus = {
  get isGeminiActive() {
    return Boolean(
      geminiConfig.apiKey &&
      geminiConfig.apiKey !== 'sua_chave_gemini_aqui' &&
      geminiConfig.apiKey !== 'SUA_CHAVE_AQUI'
    );
  },

  get isInfermedicaActive() {
    return Boolean(
      infermedicaConfig.appId &&
      infermedicaConfig.appId !== 'seu_app_id_infermedica_aqui' &&
      infermedicaConfig.appId !== 'SEU_APP_ID_AQUI' &&
      infermedicaConfig.appKey &&
      infermedicaConfig.appKey !== 'sua_app_key_infermedica_aqui' &&
      infermedicaConfig.appKey !== 'SUA_APP_KEY_AQUI'
    );
  },

  get isIntegratedMode() {
    return this.isGeminiActive && this.isInfermedicaActive;
  }
};

export default {
  gemini: geminiConfig,
  infermedica: infermedicaConfig,
  status: aiStatus
};

