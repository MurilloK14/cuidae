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
  { pt: /\bdor(?:es)?\s+(?:no|pelo)\s+corpo\b|\bdor\s+muscular\b|\bmialgia\b/gi, en: 'generalized body aches' },
  { pt: /\bdor(?:es)?\s+nas?\s+articula[cç][oõ]es\b|\bdor(?:es)?\s+nas?\s+juntas\b|\bartralgia\b/gi, en: 'joint pain' },
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
  // Dores no peito e cardiovasculares
  'Non-specific chest pain': 'Dor torácica a esclarecer (Dor no peito)',
  'Chest pain, non-specific': 'Dor no peito a esclarecer',
  'Atypical chest pain': 'Dor torácica atípica',
  'Costochondritis': 'Costocondrite (Dor articular/muscular no peito)',
  'Angina pectoris': 'Angina de Peito',
  'Unstable angina': 'Angina Instável',
  'Heart attack': 'Infarto Agudo do Miocárdio',
  'Myocardial infarction': 'Infarto Agudo do Miocárdio',
  'Pericarditis': 'Pericardite (Inflamação no coração)',
  'Arrhythmia': 'Arritmia Cardíaca',
  'Tachycardia': 'Taquicardia (Coração acelerado)',
  'Palpitations': 'Palpitações Cardíacas',
  'Hypertension': 'Hipertensão Arterial',
  'Hypertensive crisis': 'Crise Hipertensiva',
  'Hypotension': 'Hipotensão (Pressão Baixa)',
  'Syncope': 'Síncope (Desmaio)',

  // Dores musculares e esqueléticas
  'Muscle strain': 'Distensão ou Tensão Muscular',
  'Intercostal muscle strain': 'Tensão muscular intercostal (entre as costelas)',
  'Musculoskeletal pain': 'Dor Musculoesquelética',
  'Low back pain': 'Dor Lombar (Lombalgia)',
  'Lumbago': 'Lombalgia',
  'Neck pain': 'Dor no Pescoço (Cervicalgia)',
  'Sciatica': 'Dor Ciática (Ciatalgia)',
  'Fibromyalgia': 'Fibromialgia',

  // Gastrointestinal
  'Gastroesophageal reflux disease': 'Refluxo Gastroesofágico (DRGE)',
  'GERD': 'Refluxo Gastroesofágico',
  'Gastritis': 'Gastrite',
  'Acute gastritis': 'Gastrite Aguda',
  'Peptic ulcer disease': 'Úlcera Péptica',
  'Dyspepsia': 'Dispepsia (Indigestão)',
  'Gastroenteritis': 'Gastroenterite',
  'Viral gastroenteritis': 'Virose Gastrointestinal',
  'Bacterial gastroenteritis': 'Infecção Gastrointestinal Bacteriana',
  'Food poisoning': 'Intoxicação Alimentar',
  'Appendicitis': 'Apendicite',
  'Cholecystitis': 'Colecistite (Inflamação na Vesícula)',
  'Pancreatitis': 'Pancreatite',

  // Respiratório e infecciosas
  'Common cold': 'Resfriado Comum',
  'Acute viral throat infection': 'Faringite Viral Aguda',
  'Acute viral pharyngitis': 'Faringite Viral',
  'Acute streptococcal pharyngitis': 'Faringite Estreptocócica (Bacteriana)',
  'Influenza': 'Gripe (Influenza)',
  'Acute bronchitis': 'Bronquite Aguda',
  'Bronchitis': 'Bronquite',
  'Pneumonia': 'Pneumonia',
  'Asthma': 'Asma',
  'Asthma exacerbation': 'Crise de Asma',
  'Chronic obstructive pulmonary disease': 'DPOC (Doença Pulmonar Obstrutiva Crônica)',
  'Acute sinusitis': 'Sinusite Aguda',
  'Sinusitis': 'Sinusite',
  'Pharyngitis': 'Faringite',
  'Acute pharyngitis': 'Faringite Aguda',
  'Tonsillitis': 'Amigdalite',
  'COVID-19': 'COVID-19',
  'Dengue': 'Dengue',
  'Dengue fever': 'Dengue',
  'Chikungunya': 'Chikungunya',
  'Zika fever': 'Febre Zika',
  'Urinary tract infection': 'Infecção Urinária (ITU)',
  'Cystitis': 'Cistite',

  // Neurológico e saúde mental
  'Migraine': 'Enxaqueca',
  'Tension headache': 'Cefaleia Tensional',
  'Panic attack': 'Ataque de Pânico / Ansiedade',
  'Panic disorder': 'Transtorno de Pânico',
  'Generalized anxiety disorder': 'Ansiedade Generalizada',
  'Vertigo': 'Vertigem / Labirintite',

  // Alergias e pele
  'Allergic reaction': 'Reação Alérgica',
  'Allergic rhinitis': 'Rinite Alérgica',
  'Contact dermatitis': 'Dermatite de Contato',
  'Atopic dermatitis': 'Dermatite Atópica',
  'Urticaria': 'Urticária',
  'Measles': 'Sarampo',
  'Rubella': 'Rubéola',
  'Chickenpox': 'Varicela (Catapora)'
};

const NOMES_SINTOMAS_PT = {
  'Fever': 'Febre',
  'Fever between 38°C and 40°C or between 100.4 and 104°F': 'Febre (38°C a 40°C)',
  'High fever': 'Febre Alta',
  'Headache': 'Dor de cabeça',
  'Headache, severe': 'Dor de cabeça forte',
  'Severe headache': 'Dor de cabeça forte',
  'Headache, throbbing': 'Dor de cabeça latejante',
  'Headache, pressing': 'Pressão ou aperto na cabeça',
  'Abdominal pain': 'Dor abdominal',
  'Stomach pain': 'Dor de estômago',
  'Muscle pain': 'Dor muscular',
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
  if (!nome) return 'Condição em investigação';
  if (NOMES_CONDICOES_PT[nome]) return NOMES_CONDICOES_PT[nome];

  const chaveInsensivel = Object.keys(NOMES_CONDICOES_PT).find(
    (k) => k.toLowerCase() === nome.toLowerCase()
  );
  if (chaveInsensivel) return NOMES_CONDICOES_PT[chaveInsensivel];

  let traduzido = nome;
  const termos = [
    [/\bnon-specific chest pain\b/gi, 'Dor torácica a esclarecer (Dor no peito)'],
    [/\bchest pain\b/gi, 'Dor no peito'],
    [/\bnon-specific\b/gi, 'inespecífica(o)'],
    [/\babdominal pain\b/gi, 'dor abdominal'],
    [/\bheadache\b/gi, 'dor de cabeça'],
    [/\bmuscle strain\b/gi, 'distensão/tensão muscular'],
    [/\bback pain\b/gi, 'dor nas costas'],
    [/\bacute\b/gi, 'agudo(a)'],
    [/\bchronic\b/gi, 'crônico(a)'],
    [/\binfection\b/gi, 'infecção'],
    [/\binflammation\b/gi, 'inflamação'],
    [/\bsyndrome\b/gi, 'síndrome'],
    [/\bdisease\b/gi, 'doença'],
    [/\bdisorder\b/gi, 'transtorno']
  ];

  for (const [regex, sub] of termos) {
    traduzido = traduzido.replace(regex, sub);
  }

  return traduzido;
}

export function traduzirNomeSintoma(nome) {
  return NOMES_SINTOMAS_PT[nome] || nome;
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

  const todasCondicoes = diagnostico?.conditions || [];
  const condicoes = todasCondicoes.filter(c => c.probability >= 0.15).slice(0, 3);
  const condicaoPrincipal = condicoes[0] || todasCondicoes[0];
  const nomePrincipalPT = condicaoPrincipal ? traduzirNomeCondicao(condicaoPrincipal.common_name || condicaoPrincipal.name) : 'Condição em investigação';
  const probPrincipal = condicaoPrincipal ? `${(condicaoPrincipal.probability * 100).toFixed(0)}%` : '';

  // Lista de sintomas traduzidos
  const sintomasFormatados = (evidencias || [])
    .map(e => traduzirNomeSintoma(e.name))
    .join(', ');

  const textoSintomas = sintomasFormatados ? `os sintomas: ${sintomasFormatados}` : 'as queixas relatadas';

  let hipotesesAlternativas = [];
  let nomeFallback = 'Investigação Clínica com Médico';

  const evNomes = (evidencias || []).map(e => (e.name || '').toLowerCase());
  if (evNomes.some(n => n.includes('skin') || n.includes('rash') || n.includes('itch') || n.includes('pele'))) {
    nomeFallback = 'Dermatite de Contato / Reação Alérgica Cutânea';
    hipotesesAlternativas = [
      '• Dermatite de Contato (Possível causa)',
      '• Reação Alérgica / Farmacodermia (Possível causa)',
      '• Micose superficial / Pitiríase (Possível causa)'
    ];
  } else if (evNomes.some(n => n.includes('chest') || n.includes('peito'))) {
    nomeFallback = 'Dor Torácica Musculoesquelética / Refluxo';
    hipotesesAlternativas = [
      '• Dor Musculoesquelética / Costocondrite (Possível causa)',
      '• Refluxo Gastroesofágico (Possível causa)',
      '• Ansiedade / Tensão física (Possível causa)'
    ];
  } else if (evNomes.some(n => n.includes('headache') || n.includes('cabeça'))) {
    nomeFallback = 'Cefaleia Tensional / Enxaqueca';
    hipotesesAlternativas = [
      '• Cefaleia Tensional (Possível causa)',
      '• Enxaqueca (Possível causa)',
      '• Cefaleia por estresse / cansaço visual (Possível causa)'
    ];
  } else if (evNomes.some(n => n.includes('abdominal') || n.includes('stomach') || n.includes('estômago'))) {
    nomeFallback = 'Desconforto Gastrointestinal / Dispepsia';
    hipotesesAlternativas = [
      '• Gastrite / Dispepsia funcional (Possível causa)',
      '• Espasmo intestinal / Gastroenterite leve (Possível causa)'
    ];
  }

  const nomePrincipalPTFinal = condicaoPrincipal ? traduzirNomeCondicao(condicaoPrincipal.common_name || condicaoPrincipal.name) : nomeFallback;

  const listaHipoteses = condicoes.length > 0
    ? condicoes.map(c => `• ${traduzirNomeCondicao(c.common_name || c.name)} (${(c.probability * 100).toFixed(0)}%)`).join('\n')
    : hipotesesAlternativas.join('\n');

  const blocoHipoteses = listaHipoteses ? `\n\nHipóteses clínicas e possíveis causas a investigar:\n${listaHipoteses}\n\n` : '\n\n';

  let mensagem = '';
  if (prioridade === 'Urgente') {
    mensagem = `⚠️ ALERTA DE URGÊNCIA: A análise clínica da Infermedica identificou sinais que requerem atenção médica imediata.\n\n` +
      `Sintomas identificados: ${sintomasFormatados || 'Sintomas agudos'}.${blocoHipoteses}` +
      `Por favor, procure a unidade de emergência mais próxima (UPA ou Hospital) ou acione o SAMU 192 imediatamente.`;
  } else if (prioridade === 'Alta') {
    mensagem = `A análise clínica da Infermedica identificou ${textoSintomas}.${blocoHipoteses}` +
      `Recomendamos avaliação médica presencial em até 24 horas (em uma UPA ou AMA) para realização de exames complementares e conduta adequada.`;
  } else if (prioridade === 'Média') {
    mensagem = `A análise clínica da Infermedica avaliou ${textoSintomas}.${blocoHipoteses}` +
      `É recomendada consulta em uma Unidade Básica de Saúde (UBS) ou agendamento clínico para acompanhamento.`;
  } else {
    mensagem = `A análise clínica da Infermedica avaliou ${textoSintomas}.${blocoHipoteses}` +
      `O quadro atual é de baixa gravidade. Se os sintomas persistirem, se agravarem ou surgirem novos sinais de alerta, procure a UBS mais próxima.`;
  }

  let orientacao = 'Mantenha repouso, hidratação frequente e monitore a temperatura.';
  if (triagem?.triage_level === 'emergency_ambulance' || triagem?.triage_level === 'emergency') {
    orientacao = 'Não faça esforço físico e dirija-se imediatamente à emergência mais próxima.';
  } else if (triagem?.triage_level === 'consultation_24') {
    orientacao = 'Mantenha hidratação oral contínua e procure atendimento médico em até 24 horas.';
  }

  return {
    mensagem,
    recomendacao: probPrincipal ? `Avaliação clínica para ${nomePrincipalPT} (${probPrincipal})` : `Avaliação clínica para ${nomePrincipalPT}`,
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
