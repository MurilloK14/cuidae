/**
 * Serviço de integração com a Infermedica API v3.
 * 
 * A Infermedica é uma API médica validada clinicamente que fornece:
 * - /parse → Extração de sintomas a partir de texto livre
 * - /diagnosis → Diagnóstico com probabilidades
 * - /triage → Nível de urgência (emergência, consulta, autocuidado)
 * 
 * Docs: https://developer.infermedica.com/docs/v3
 */

import { infermedicaConfig } from '../config/aiConfig.js';

/**
 * Tradução e normalização abrangente PT-BR -> EN clínico.
 * As expressões mais longas e específicas vêm primeiro para evitar conflitos de substituição.
 */
const DICIONARIO_PT_EN = [
  // Pele / Manchas
  { pt: /\bmanchas?\s+(?:na|de|pela)\s+pele\b/gi, en: 'skin rash' },
  { pt: /\bmanchas?\s+vermelhas?\b/gi, en: 'red spots on skin' },
  { pt: /\berup[cç][aã]o\s+cut[aâ]nea\b/gi, en: 'skin rash' },
  { pt: /\bvermelhid[aã]o\b/gi, en: 'redness' },
  { pt: /\bpele\s+amarelada\b|\bicter[ií]cia\b/gi, en: 'jaundice' },
  { pt: /\bpele\s+p[aá]lida\b|\bpalidez\b/gi, en: 'skin pallor' },
  { pt: /\bcoceira\b|\bprurido\b/gi, en: 'itching' },

  // Dores e corpo
  { pt: /\bdores?\s+(?:no|pelo)\s+corpo\b|\bdor\s+muscular\b|\bmialgia\b/gi, en: 'generalized body aches' },
  { pt: /\bdores?\s+nas?\s+articula[cç][oõ]es\b|\bdor\s+nas?\s+juntas\b|\bartralgia\b/gi, en: 'joint pain' },
  { pt: /\bdor\s+de\s+cabe[cç]a\s+forte\b|\benxaqueca\b/gi, en: 'severe headache' },
  { pt: /\bdor\s+de\s+cabe[cç]a\b|\bcefaleia\b/gi, en: 'headache' },
  { pt: /\bdor\s+no\s+peito\s+(?:muito\s+forte|intensa|apertando)\b|\bdor\s+tor[aá]cica\s+grave\b/gi, en: 'severe crushing chest pain' },
  { pt: /\bdor\s+no\s+peito\b|\bdor\s+tor[aá]cica\b/gi, en: 'chest pain' },
  { pt: /\bdor\s+ao\s+engolir\b|\bdor\s+na\s+garganta\b|\bdor\s+de\s+garganta\b/gi, en: 'sore throat' },
  { pt: /\bdor\s+abdominal\s+forte\b|\bc[oó]lica\s+forte\b/gi, en: 'severe abdominal pain' },
  { pt: /\bdor\s+abdominal\b|\bdor\s+de\s+barriga\b|\bdor\s+no\s+est[oô]mago\b/gi, en: 'abdominal pain' },

  // Febre e respiratório
  { pt: /\bfebre\s+alta\b/gi, en: 'high fever' },
  { pt: /\bfebre\b/gi, en: 'fever' },
  { pt: /\bcalafrios?\b/gi, en: 'chills' },
  { pt: /\btosse\s+com\s+(?:sangue|escarro\s+com\s+sangue)\b/gi, en: 'coughing up blood' },
  { pt: /\btosse\s+com\s+(?:catarro|secre[cç][aã]o)\b|\btosse\s+produtiva\b/gi, en: 'cough with phlegm' },
  { pt: /\btosse\s+seca\b/gi, en: 'dry cough' },
  { pt: /\btosse\b/gi, en: 'cough' },
  { pt: /\bfalta\s+de\s+ar\b|\bdificuldade\s+para\s+respirar\b|\bdispneia\b/gi, en: 'shortness of breath' },
  { pt: /\bcoriza\b|\bnariz\s+escorrendo\b/gi, en: 'runny nose' },
  { pt: /\bnariz\s+entupido\b|\bcongest[aã]o\s+nasal\b/gi, en: 'nasal congestion' },
  { pt: /\bespirros?\b/gi, en: 'sneezing' },

  // Gastrointestinal e geral
  { pt: /\bn[aá]useas?\b|\benjoos?\b/gi, en: 'nausea' },
  { pt: /\bv[oô]mitos?\b/gi, en: 'vomiting' },
  { pt: /\bdiarreia\b|\bdiarr[eé]ia\b/gi, en: 'diarrhea' },
  { pt: /\bperda\s+de\s+apetite\b|\bsem\s+fome\b/gi, en: 'loss of appetite' },
  { pt: /\btontura\b|\bvertigem\b/gi, en: 'dizziness' },
  { pt: /\bcansa[cç]o\b|\bfadiga\b|\bmoleza\b/gi, en: 'fatigue' },
  { pt: /\bsuor\s+frio\b|\bsudorese\b/gi, en: 'cold sweats' },
  { pt: /\bdesmaio\b|\bs[ií]ncope\b/gi, en: 'fainting' }
];

// Tradução de termos médicos comuns do inglês para português
const NOMES_CONDICOES_PT = {
  'Common cold': 'Resfriado Comum',
  'Acute viral throat infection': 'Faringite Viral Aguda',
  'Acute viral pharyngitis': 'Faringite Viral',
  'Acute streptococcal pharyngitis': 'Faringite Estreptocócica (Bacteriana)',
  'Influenza': 'Gripe (Influenza)',
  'Dengue': 'Dengue',
  'Dengue fever': 'Dengue',
  'Chikungunya': 'Chikungunya',
  'Zika fever': 'Febre Zika',
  'COVID-19': 'COVID-19',
  'Gastroenteritis': 'Gastroenterite',
  'Viral gastroenteritis': 'Virose Gastrointestinal',
  'Bacterial gastroenteritis': 'Infecção Gastrointestinal Bacteriana',
  'Migraine': 'Enxaqueca',
  'Tension headache': 'Cefaleia Tensional',
  'Acute sinusitis': 'Sinusite Aguda',
  'Pneumonia': 'Pneumonia',
  'Heart attack': 'Infarto Agudo do Miocárdio',
  'Myocardial infarction': 'Infarto Agudo do Miocárdio',
  'Angina pectoris': 'Angina de Peito',
  'Asthma exacerbation': 'Crise de Asma',
  'Measles': 'Sarampo',
  'Rubella': 'Rubéola',
  'Chickenpox': 'Varicela (Catapora)',
  'Allergic reaction': 'Reação Alérgica'
};

const NOMES_SINTOMAS_PT = {
  'Fever': 'Febre',
  'Fever between 38°C and 40°C or between 100.4 and 104°F': 'Febre (38°C a 40°C)',
  'High fever': 'Febre Alta',
  'Headache': 'Dor de cabeça',
  'Headache, severe': 'Dor de cabeça forte',
  'Body aches': 'Dores no corpo',
  'Generalized body aches': 'Dores generalizadas no corpo',
  'Skin rash': 'Manchas ou erupções na pele',
  'Skin changes': 'Alterações na pele',
  'Cough': 'Tosse',
  'Sore throat': 'Dor de garganta',
  'Nausea': 'Náusea/Enjoo',
  'Vomiting': 'Vômito',
  'Diarrhea': 'Diarreia',
  'Shortness of breath': 'Falta de ar',
  'Joint pain': 'Dor nas articulações/juntas',
  'Fatigue': 'Fadiga/Cansaço',
  'Dizziness': 'Tontura',
  'Chest pain': 'Dor no peito',
  'Runny nose': 'Coriza',
  'Chills': 'Calafrios'
};

export function traduzirParaInglesClinico(texto) {
  let resultado = texto;
  for (const { pt, en } of DICIONARIO_PT_EN) {
    resultado = resultado.replace(pt, en);
  }
  return resultado;
}

export function traduzirNomeCondicao(nome) {
  return NOMES_CONDICOES_PT[nome] || nome;
}

export function traduzirNomeSintoma(nome) {
  return NOMES_SINTOMAS_PT[nome] || nome;
}

/**
 * Sanitiza evidências para a Infermedica, aceitando apenas fontes válidas pela API:
 * 'initial', 'suggest' e 'predefined'. Qualquer outra é omitida.
 */
export function sanitizarEvidencias(evidencias) {
  return (evidencias || []).map(({ id, choice_id, source }) => {
    const item = { id, choice_id };
    if (source === 'initial' || source === 'suggest' || source === 'predefined') {
      item.source = source;
    }
    return item;
  });
}

/**
 * Usa o NLP da Infermedica para extrair sintomas de um texto.
 */
export async function parseSintomas(texto, idade = infermedicaConfig.defaultPatient.age, sexo = infermedicaConfig.defaultPatient.sex) {
  const textoTraduzido = traduzirParaInglesClinico(texto);

  const res = await fetch(`${infermedicaConfig.baseUrl}/parse`, {
    method: 'POST',
    headers: infermedicaConfig.headers,
    body: JSON.stringify({
      text: textoTraduzido,
      age: { value: idade },
      sex: sexo
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Infermedica /parse falhou: ${res.status} - ${err}`);
  }

  const data = await res.json();

  return data.mentions.map((m) => ({
    id: m.id,
    choice_id: m.choice_id,
    name: m.common_name || m.name
  }));
}

/**
 * Envia os sintomas estruturados para o endpoint de diagnóstico.
 */
export async function getDiagnostico(evidencias, idade = infermedicaConfig.defaultPatient.age, sexo = infermedicaConfig.defaultPatient.sex) {
  const res = await fetch(`${infermedicaConfig.baseUrl}/diagnosis`, {
    method: 'POST',
    headers: infermedicaConfig.headers,
    body: JSON.stringify({
      sex: sexo,
      age: { value: idade },
      evidence: sanitizarEvidencias(evidencias)
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Infermedica /diagnosis falhou: ${res.status} - ${err}`);
  }

  return res.json();
}

/**
 * Faz a triagem de urgência com base nos sintomas.
 */
export async function getTriagem(evidencias, idade = infermedicaConfig.defaultPatient.age, sexo = infermedicaConfig.defaultPatient.sex) {
  const res = await fetch(`${infermedicaConfig.baseUrl}/triage`, {
    method: 'POST',
    headers: infermedicaConfig.headers,
    body: JSON.stringify({
      sex: sexo,
      age: { value: idade },
      evidence: sanitizarEvidencias(evidencias)
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Infermedica /triage falhou: ${res.status} - ${err}`);
  }

  return res.json();
}

/**
 * Formata os resultados clínicos da Infermedica exibindo as principais hipóteses diagnósticas em português.
 */
export function formatarResultadoInfermedica(resultadoMedico) {
  const { evidencias, diagnostico, triagem } = resultadoMedico;

  const mapaPrioridade = {
    emergency_ambulance: 'Urgente',
    emergency: 'Urgente',
    consultation_24: 'Alta',
    consultation: 'Média',
    self_care: 'Normal'
  };

  const mapaUnidade = {
    emergency_ambulance: 'SAMU',
    emergency: 'UPA',
    consultation_24: 'UPA',
    consultation: 'UBS',
    self_care: 'UBS'
  };

  const prioridade = mapaPrioridade[triagem?.triage_level] || 'Normal';
  const tipoUnidade = mapaUnidade[triagem?.triage_level] || 'UBS';

  // Obtém as 3 condições mais prováveis identificadas pela Infermedica
  const condicoes = (diagnostico?.conditions || []).slice(0, 3);
  const condicaoPrincipal = condicoes[0];
  const nomePrincipalPT = condicaoPrincipal ? traduzirNomeCondicao(condicaoPrincipal.common_name || condicaoPrincipal.name) : 'Condição em investigação';
  const probPrincipal = condicaoPrincipal ? `${(condicaoPrincipal.probability * 100).toFixed(0)}%` : '';

  // Lista de sintomas traduzidos
  const sintomasFormatados = (evidencias || [])
    .map(e => traduzirNomeSintoma(e.name))
    .join(', ');

  // Lista de hipóteses diagnósticas para mostrar ao paciente
  const listaHipoteses = condicoes
    .map(c => `• ${traduzirNomeCondicao(c.common_name || c.name)} (${(c.probability * 100).toFixed(0)}%)`)
    .join('\n');

  let mensagem = '';
  if (prioridade === 'Urgente') {
    mensagem = `⚠️ ALERTA DE URGÊNCIA: A análise clínica da Infermedica identificou sintomas que requerem atenção médica imediata.\n\n` +
      `Sintomas identificados: ${sintomasFormatados}.\n\n` +
      `Principais hipóteses clínicas:\n${listaHipoteses}\n\n` +
      `Por favor, procure a unidade de emergência mais próxima ou acione o SAMU 192 imediatamente.`;
  } else if (prioridade === 'Alta') {
    mensagem = `A análise clínica da Infermedica identificou os sintomas: ${sintomasFormatados}.\n\n` +
      `Hipóteses diagnósticas avaliadas:\n${listaHipoteses}\n\n` +
      `Recomendamos avaliação médica presencial em até 24 horas (como em uma UPA ou AMA) para realização de exames complementares.`;
  } else if (prioridade === 'Média') {
    mensagem = `A análise clínica da Infermedica avaliou seus sintomas: ${sintomasFormatados}.\n\n` +
      `Hipóteses diagnósticas mais prováveis:\n${listaHipoteses}\n\n` +
      `É recomendada consulta em uma Unidade Básica de Saúde (UBS) para acompanhamento clínico.`;
  } else {
    mensagem = `A análise clínica da Infermedica avaliou seus sintomas: ${sintomasFormatados}.\n\n` +
      `Hipóteses diagnósticas prováveis:\n${listaHipoteses}\n\n` +
      `O quadro atual é de baixa gravidade. Se os sintomas persistirem ou surgirem novos sinais de alerta, procure a UBS mais próxima.`;
  }

  let orientacao = 'Mantenha repouso, hidratação frequente e monitore a temperatura.';
  if (triagem?.triage_level === 'emergency_ambulance' || triagem?.triage_level === 'emergency') {
    orientacao = 'Não faça esforço físico e dirija-se imediatamente à emergência mais próxima.';
  } else if (triagem?.triage_level === 'consultation_24') {
    orientacao = 'Mantenha hidratação oral contínua e procure atendimento médico em até 24 horas.';
  }

  return {
    mensagem,
    recomendacao: `Avaliação clínica para ${nomePrincipalPT} (${probPrincipal})`,
    especialidade: tipoUnidade === 'SAMU' || tipoUnidade === 'UPA' ? 'Clínica Médica / Emergencista' : 'Clínico Geral / Medicina da Família',
    prioridade,
    orientacao,
    tipoUnidade
  };
}

/**
 * Fluxo completo: texto → parse → diagnóstico + triagem.
 */
export async function fluxoCompleto(texto, dadosPaciente = {}) {
  const idade = dadosPaciente.idade || 30;
  const sexo = dadosPaciente.sexo || 'male';

  const evidencias = await parseSintomas(texto, idade, sexo);

  if (evidencias.length === 0) {
    return {
      evidencias: [],
      diagnostico: null,
      triagem: null,
      sintomasEncontrados: false
    };
  }

  const [diagnostico, triagem] = await Promise.all([
    getDiagnostico(evidencias, idade, sexo),
    getTriagem(evidencias, idade, sexo)
  ]);

  return {
    evidencias,
    diagnostico,
    triagem,
    sintomasEncontrados: true
  };
}

/**
 * Executa uma rodada do motor de diagnóstico interativo da Infermedica
 * e avalia se o afunilamento atingiu as regras de parada.
 */
export async function executarPassoDiagnostico(evidencias, dadosPaciente = {}) {
  const idade = dadosPaciente.idade || infermedicaConfig.defaultPatient.age;
  const sexo = dadosPaciente.sexo || infermedicaConfig.defaultPatient.sex;

  const res = await fetch(`${infermedicaConfig.baseUrl}/diagnosis`, {
    method: 'POST',
    headers: infermedicaConfig.headers,
    body: JSON.stringify({
      sex: sexo,
      age: { value: idade },
      evidence: sanitizarEvidencias(evidencias),
      extras: {
        disable_groups: infermedicaConfig.interviewRules.disableGroups
      }
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Infermedica /diagnosis falhou: ${res.status} - ${err}`);
  }

  const data = await res.json();
  const condicoes = data.conditions || [];
  const top1 = condicoes[0];
  const top2 = condicoes[1];

  // Quantidade de perguntas respondidas na entrevista
  const totalPerguntado = evidencias.filter(e => e.source !== 'initial').length;

  const atingiuCerteza = top1 && top1.probability >= infermedicaConfig.interviewRules.confidenceThreshold;
  const diferencaExpressiva = top1 && top2 && (top1.probability - top2.probability) >= infermedicaConfig.interviewRules.deltaThreshold;
  const atingiuLimite = totalPerguntado >= infermedicaConfig.interviewRules.maxQuestions;
  const semMaisPerguntas = !data.question;

  const finalizado = Boolean(data.should_stop || atingiuCerteza || diferencaExpressiva || atingiuLimite || semMaisPerguntas);

  let triagem = null;
  if (finalizado) {
    try {
      triagem = await getTriagem(evidencias, idade, sexo);
    } catch (errTriagem) {
      console.warn('⚠️ Falha ao buscar triagem final:', errTriagem.message);
    }
  }

  return {
    finalizado,
    condicoes: condicoes.slice(0, infermedicaConfig.interviewRules.topConditionsCount),
    question: data.question || null,
    triagem,
    evidencias,
    diagnostico: data
  };
}
