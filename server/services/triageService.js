/**
 * Serviço de triagem médica.
 *
 * Contém a lógica de análise de sintomas e encaminhamento
 * com base na camada do usuário (Gratuito, Intermediário, Premium).
 *
 * No futuro, este serviço pode ser substituído por uma integração
 * com IA real (Gemini, OpenAI, etc.) para análise mais sofisticada.
 */

// Base de conhecimento de sintomas
const SINTOMAS_DB = [
  {
    palavrasChave: ['mancha', 'pele', 'vermelhidão', 'lesão', 'coceira na pele', 'erupção', 'pinta'],
    especialidade: 'Dermatologia',
    recomendacao: 'Encaminhamento para Avaliação Dermatológica',
    prioridade: 'Média',
    orientacao: 'Evite exposição solar na área afetada e não aplique pomadas sem orientação médica.'
  },
  {
    palavrasChave: ['dor no corpo', 'dor atrás dos olhos', 'febre', 'manchas vermelhas no corpo', 'dengue'],
    especialidade: 'Clínica Geral / Infectologia',
    recomendacao: 'Triagem para Arboviroses (Suspeita de Dengue/Zika)',
    prioridade: 'Alta',
    orientacao: 'Mantenha repouso e hidratação intensa. Não tome medicamentos à base de ácido acetilsalicílico (Aspirina) ou ibuprofeno.'
  },
  {
    palavrasChave: ['dor de cabeça', 'cefaleia', 'enxaqueca', 'dor na cabeça'],
    especialidade: 'Clínica Geral / Neurologia',
    recomendacao: 'Avaliação Clínica para Cefaleia',
    prioridade: 'Média',
    orientacao: 'Mantenha-se hidratado, descanse em ambiente escuro e evite telas. Se a dor for súbita e a pior da vida, procure emergência.'
  },
  {
    palavrasChave: ['tosse', 'gripe', 'resfriado', 'coriza', 'espirro', 'congestionamento', 'catarro'],
    especialidade: 'Clínica Geral',
    recomendacao: 'Avaliação de Síndrome Gripal',
    prioridade: 'Normal',
    orientacao: 'Repouse e beba bastante líquido. Use máscara se for sair de casa.'
  },
  {
    palavrasChave: ['falta de ar', 'não consigo respirar', 'asma', 'aperto ao respirar', 'chiado no peito'],
    especialidade: 'Pneumologia / Emergência',
    recomendacao: 'Avaliação Respiratória Urgente',
    prioridade: 'Urgente',
    orientacao: '⚠️ Se a falta de ar for intensa ou vier acompanhada de lábios roxos, dirija-se imediatamente à emergência ou ligue SAMU 192.'
  },
  {
    palavrasChave: ['dor no peito', 'aperto no peito', 'palpitação', 'coração acelerado', 'infarto'],
    especialidade: 'Cardiologia / Emergência',
    recomendacao: 'Avaliação Cardiológica Urgente',
    prioridade: 'Urgente',
    orientacao: '⚠️ Risco Cardíaco: Se a dor irradiar para o braço esquerdo ou mandíbula, ligue SAMU 192 imediatamente.'
  },
  {
    palavrasChave: ['dor de barriga', 'dor abdominal', 'náusea', 'vômito', 'diarreia', 'estômago', 'azia'],
    especialidade: 'Clínica Geral / Gastroenterologia',
    recomendacao: 'Avaliação para Quadro Gastrointestinal',
    prioridade: 'Média',
    orientacao: 'Mantenha-se hidratado com pequenos goles de soro ou água. Evite alimentos gordurosos e leite.'
  },
  {
    palavrasChave: ['tontura', 'pressão alta', 'pressão baixa', 'desmaio', 'vertigem', 'visão escura'],
    especialidade: 'Cardiologia / Clínica Geral',
    recomendacao: 'Aferição de Sinais Vitais e Avaliação Clínica',
    prioridade: 'Alta',
    orientacao: 'Sente-se ou deite-se para evitar quedas. Se tiver um medidor de pressão, faça a aferição. Se houver perda de consciência, busque emergência.'
  },
  {
    palavrasChave: ['corte profundo', 'sangramento', 'fratura', 'quebrei', 'osso', 'acidente', 'queimadura'],
    especialidade: 'Ortopedia / Traumatologia / Cirurgia Geral',
    recomendacao: 'Atendimento de Trauma / Emergência',
    prioridade: 'Urgente',
    orientacao: '⚠️ Não tente colocar ossos no lugar. Para sangramentos, comprima o local com pano limpo e dirija-se ao pronto-socorro.'
  },
  {
    palavrasChave: ['olho', 'visão', 'vista embaçada', 'mancha no olho', 'vermelhidão no olho', 'terçol'],
    especialidade: 'Oftalmologia',
    recomendacao: 'Encaminhamento para Avaliação Oftalmológica',
    prioridade: 'Média',
    orientacao: 'Lave os olhos com soro fisiológico. Não coce e não use colírios sem prescrição médica.'
  },
  {
    palavrasChave: ['ansiedade', 'depressão', 'insônia', 'estresse', 'angústia', 'pânico', 'tristeza'],
    especialidade: 'Psiquiatria / Psicologia',
    recomendacao: 'Encaminhamento para Acolhimento em Saúde Mental',
    prioridade: 'Média',
    orientacao: 'Você não está sozinho(a). Se precisar conversar urgentemente, o CVV atende 24h pelo número 188. Recomendamos buscar o CAPS da sua região.'
  },
  {
    palavrasChave: ['dor nas costas', 'lombalgia', 'coluna', 'dor lombar', 'pescoço', 'torcicolo'],
    especialidade: 'Ortopedia / Fisioterapia',
    recomendacao: 'Avaliação para Dor Musculoesquelética',
    prioridade: 'Normal',
    orientacao: 'Evite carregar peso, mantenha boa postura. Compressas mornas podem aliviar. Se a dor descer para a perna (ciático), relate ao médico.'
  }
];

/**
 * Analisa os sintomas descritos pelo paciente e retorna um encaminhamento.
 */
export function analisarSintomas(sintoma, camada) {
  const sintomaLower = sintoma.toLowerCase();

  // Procura correspondência na base de sintomas
  const match = SINTOMAS_DB.find((entry) =>
    entry.palavrasChave.some((palavra) => sintomaLower.includes(palavra))
  );

  if (match) {
    return {
      recomendacao: match.recomendacao,
      especialidade: match.especialidade,
      local: getLocal(camada, match.prioridade),
      prioridade: match.prioridade,
      orientacao: match.orientacao,
      mensagem: `Identifiquei sintomas relacionados a ${match.especialidade}. ${match.orientacao}`
    };
  }

  // Resposta genérica quando não encontra correspondência
  return {
    recomendacao: 'Orientação de Cuidados e Triagem',
    especialidade: 'Clínica Geral',
    local: getLocal(camada, 'Normal'),
    prioridade: 'Normal',
    orientacao: 'Se os sintomas persistirem ou piorarem, procure atendimento médico presencial.',
    mensagem: 'Obrigado pelas informações. Registrei seus sintomas e recomendo acompanhamento adequado. Se os sintomas persistirem, procure uma Unidade Básica de Saúde.'
  };
}

/**
 * Analisa uma imagem enviada pelo paciente (simulação).
 * No futuro, integrar com modelo de ML para dermatologia.
 */
export function analisarImagem(camada, nomeArquivo) {
  return {
    recomendacao: 'Encaminhamento para Avaliação Dermatológica',
    especialidade: 'Dermatologia',
    local: getLocal(camada, 'Média'),
    prioridade: 'Média',
    orientacao: 'Evite exposição solar na área afetada e não aplique medicamentos sem orientação médica.',
    mensagem: `🔍 Imagem "${nomeArquivo}" recebida e analisada. Detectamos uma possível alteração cutânea que requer avaliação profissional. Evite exposição solar na área afetada.`,
    arquivoRecebido: nomeArquivo
  };
}

/**
 * Retorna a mensagem de boas-vindas do chatbot.
 */
export function getMensagemBoasVindas() {
  return {
    remetente: 'bot',
    texto: 'Olá! Sou o assistente virtual do SaúdePraTodos. Descreva o que está sentindo ou envie uma foto de uma mancha/alteração na pele.',
    timestamp: new Date().toISOString()
  };
}

/**
 * Determina o local de atendimento com base na camada e prioridade.
 */
function getLocal(camada, prioridade) {
  if (prioridade === 'Urgente') {
    return 'UPA / Pronto-Socorro mais próximo — SAMU 192';
  }

  switch (camada) {
    case 'Premium':
      return 'Teleconsulta Imediata com Especialista';
    case 'Intermediário':
      return 'Teleconsulta com Especialista (Atendimento em até 24h)';
    case 'Gratuito':
    default:
      return 'UBS Mais Próxima (Atendimento Presencial)';
  }
}
