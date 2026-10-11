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

import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'https://api.infermedica.com/v3';

const headers = {
  'App-Id': process.env.INFERMEDICA_APP_ID,
  'App-Key': process.env.INFERMEDICA_APP_KEY,
  'Content-Type': 'application/json'
};

/**
 * Usa o NLP da Infermedica para extrair sintomas de um texto.
 * Aceita texto em português.
 * 
 * @param {string} texto - Texto com sintomas (ex: "dor de cabeça e febre")
 * @param {number} idade - Idade do paciente (padrão 30)
 * @param {string} sexo - "male" ou "female" (padrão "male")
 * @returns {Array} Lista de evidências no formato { id, choice_id, name }
 */
export async function parseSintomas(texto, idade = 30, sexo = 'male') {
  const res = await fetch(`${BASE_URL}/parse`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      text: texto,
      age: { value: idade },
      sex: sexo
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Infermedica /parse falhou: ${res.status} - ${err}`);
  }

  const data = await res.json();

  // Converte as "mentions" em "evidence" para usar no /diagnosis
  return data.mentions.map((m) => ({
    id: m.id,
    choice_id: m.choice_id,
    name: m.common_name || m.name
  }));
}

/**
 * Envia os sintomas estruturados para o endpoint de diagnóstico.
 * Retorna as condições mais prováveis e pode sugerir perguntas de follow-up.
 * 
 * @param {Array} evidencias - Lista de { id, choice_id }
 * @param {number} idade
 * @param {string} sexo
 * @returns {object} { conditions, question, should_stop }
 */
export async function getDiagnostico(evidencias, idade = 30, sexo = 'male') {
  const res = await fetch(`${BASE_URL}/diagnosis`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      sex: sexo,
      age: { value: idade },
      evidence: evidencias.map(({ id, choice_id }) => ({ id, choice_id }))
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
 * Retorna o nível: emergency, consultation, self_care.
 * 
 * @param {Array} evidencias
 * @param {number} idade
 * @param {string} sexo
 * @returns {object} { triage_level, serious, description }
 */
export async function getTriagem(evidencias, idade = 30, sexo = 'male') {
  const res = await fetch(`${BASE_URL}/triage`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      sex: sexo,
      age: { value: idade },
      evidence: evidencias.map(({ id, choice_id }) => ({ id, choice_id }))
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Infermedica /triage falhou: ${res.status} - ${err}`);
  }

  return res.json();
}

/**
 * Fluxo completo: texto → parse → diagnóstico + triagem.
 * 
 * @param {string} texto - Sintomas em texto livre
 * @param {object} dadosPaciente - { idade, sexo }
 * @returns {object} Resultado completo com evidências, diagnóstico e triagem
 */
export async function fluxoCompleto(texto, dadosPaciente = {}) {
  const idade = dadosPaciente.idade || 30;
  const sexo = dadosPaciente.sexo || 'male';

  // 1. Extrai sintomas do texto
  const evidencias = await parseSintomas(texto, idade, sexo);

  if (evidencias.length === 0) {
    return {
      evidencias: [],
      diagnostico: null,
      triagem: null,
      sintomasEncontrados: false
    };
  }

  // 2. Busca diagnóstico e triagem em paralelo
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
