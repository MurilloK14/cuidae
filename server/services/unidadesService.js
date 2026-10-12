import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, '../../data/unidades_saude.json');
const REVIEWS_PATH = path.resolve(__dirname, '../../data/avaliacoes.json');

/**
 * Garante que os arquivos JSON de dados existam
 */
export function ensureDbFile() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2), 'utf-8');
  }

  if (!fs.existsSync(REVIEWS_PATH)) {
    fs.writeFileSync(REVIEWS_PATH, JSON.stringify([], null, 2), 'utf-8');
  }
}

/**
 * Lê o arquivo JSON com tratamento de erro
 */
function readJson(filePath) {
  ensureDbFile();
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error(`Erro ao ler arquivo ${filePath}:`, error.message);
    return [];
  }
}

/**
 * Escreve dados em formato JSON
 */
function writeJson(filePath, data) {
  ensureDbFile();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Retorna todas as unidades de saúde cadastradas
 */
export async function getAllUnidades() {
  return readJson(DB_PATH);
}

/**
 * Retorna uma unidade por ID
 */
export async function getUnidadeById(id) {
  const unidades = await getAllUnidades();
  return unidades.find((u) => u.id === id) || null;
}

/**
 * Filtra unidades por categoria (ex: hospital, ubs, policlinica, caps, cras, samu)
 */
export async function getUnidadesByCategoria(categoria) {
  if (!categoria) return getAllUnidades();
  const unidades = await getAllUnidades();
  const cat = categoria.toLowerCase().trim();
  return unidades.filter((u) => u.categoria && u.categoria.toLowerCase() === cat);
}

/**
 * Filtra unidades por especialidade médica ou serviço oferecido
 */
export async function getUnidadesByEspecialidade(especialidade) {
  if (!especialidade) return getAllUnidades();
  const unidades = await getAllUnidades();
  const termo = especialidade.toLowerCase().trim();
  return unidades.filter((u) =>
    Array.isArray(u.especialidades) &&
    u.especialidades.some((esp) => esp.toLowerCase().includes(termo))
  );
}

/**
 * Busca textual ampla nas unidades (nome, endereço, bairro, especialidades)
 */
export async function searchUnidades(query) {
  if (!query || !query.trim()) {
    return getAllUnidades();
  }

  const q = query.toLowerCase().trim();
  const unidades = await getAllUnidades();

  return unidades.filter((u) => {
    const nome = (u.nome || '').toLowerCase();
    const nomeCurto = (u.nome_curto || '').toLowerCase();
    const endereco = (u.endereco || '').toLowerCase();
    const bairro = (u.bairro || '').toLowerCase();
    const tipoLabel = (u.tipo_label || '').toLowerCase();
    const categoria = (u.categoria || '').toLowerCase();
    const especialidades = Array.isArray(u.especialidades)
      ? u.especialidades.join(' ').toLowerCase()
      : '';
    const servicos = Array.isArray(u.servicos)
      ? u.servicos.join(' ').toLowerCase()
      : '';

    return (
      nome.includes(q) ||
      nomeCurto.includes(q) ||
      endereco.includes(q) ||
      bairro.includes(q) ||
      tipoLabel.includes(q) ||
      categoria.includes(q) ||
      especialidades.includes(q) ||
      servicos.includes(q)
    );
  });
}

/**
 * Salva uma nova avaliação para uma unidade
 */
export async function saveAvaliacao(unidadeId, avaliacao) {
  const reviews = readJson(REVIEWS_PATH);
  const novaAvaliacao = {
    id: crypto.randomUUID(),
    unidade_id: unidadeId,
    user_id: avaliacao.user_id || 'anonimo',
    nome: avaliacao.nome || 'Usuário Anônimo',
    nota: Number(avaliacao.nota) || 5,
    comentario: avaliacao.comentario || '',
    created_at: new Date().toISOString()
  };

  reviews.push(novaAvaliacao);
  writeJson(REVIEWS_PATH, reviews);

  return novaAvaliacao;
}

/**
 * Retorna todas as avaliações de uma determinada unidade
 */
export async function getAvaliacoesByUnidade(unidadeId) {
  const reviews = readJson(REVIEWS_PATH);
  return reviews.filter((r) => r.unidade_id === unidadeId);
}

/**
 * Calcula a distância em km entre duas coordenadas usando a fórmula de Haversine
 */
export function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Sistema de recomendação inteligente de unidades de saúde
 */
export async function getRecomendacao(diagnostico = '', especialidade = '', tipoUnidade = '', lat = null, lng = null) {
  const unidades = await getAllUnidades();
  const userLat = lat !== null && lat !== undefined && lat !== '' ? parseFloat(lat) : null;
  const userLng = lng !== null && lng !== undefined && lng !== '' ? parseFloat(lng) : null;

  const termoDiag = (diagnostico || '').toLowerCase().trim();
  const termoEsp = (especialidade || '').toLowerCase().trim();
  const termoTipo = (tipoUnidade || '').toLowerCase().trim();

  // Filtragem inicial se tipoUnidade foi especificado estritamente ou mapeamento
  let candidatas = unidades;
  if (termoTipo) {
    const unidadesDoTipo = candidatas.filter((u) => {
      const cat = (u.categoria || '').toLowerCase();
      const label = (u.tipo_label || '').toLowerCase();
      const nome = (u.nome || '').toLowerCase();
      return cat.includes(termoTipo) || label.includes(termoTipo) || nome.includes(termoTipo);
    });

    if (unidadesDoTipo.length > 0) {
      candidatas = unidadesDoTipo;
    }
  }

  const recomendacoes = candidatas.map((unidade) => {
    let score = 0;
    const motivos = [];

    // 1. Priorização por tipo de unidade / urgência
    if (termoTipo) {
      const cat = (unidade.categoria || '').toLowerCase();
      const label = (unidade.tipo_label || '').toLowerCase();
      if (cat.includes(termoTipo) || label.includes(termoTipo)) {
        score += 40;
        motivos.push(`Tipo de atendimento indicado (${unidade.tipo_label})`);
      }
    }

    // Se diagnóstico envolver urgência ou emergência e a unidade tem urgência
    const isUrgencia =
      termoDiag.includes('urg') ||
      termoDiag.includes('emerg') ||
      termoDiag.includes('grave') ||
      termoDiag.includes('dor forte') ||
      termoDiag.includes('upa') ||
      termoDiag.includes('pronto');

    if (isUrgencia && unidade.tem_urgencia) {
      score += 35;
      motivos.push('Possui serviço de urgência e emergência 24h');
    }

    // 2. Pontuação por especialidade e serviços
    let matchedSpecialty = null;
    if (Array.isArray(unidade.especialidades)) {
      for (const esp of unidade.especialidades) {
        const espLower = esp.toLowerCase();
        if (termoEsp && (espLower.includes(termoEsp) || termoEsp.includes(espLower))) {
          score += 30;
          matchedSpecialty = esp;
          break;
        } else if (termoDiag && espLower.includes(termoDiag)) {
          score += 25;
          matchedSpecialty = esp;
          break;
        }
      }
    }

    if (matchedSpecialty) {
      motivos.push(`Especialidade disponível: ${matchedSpecialty}`);
    }

    // 3. Pontuação pela avaliação do Google
    const rating = unidade.google_rating || 3.0;
    score += rating * 4; // Contribui até ~20 pontos

    // 4. Distância calculada
    let distanciaKm = null;
    if (userLat !== null && !isNaN(userLat) && userLng !== null && !isNaN(userLng)) {
      distanciaKm = calcularDistanciaKm(userLat, userLng, unidade.latitude, unidade.longitude);
      if (distanciaKm !== null) {
        // Unidades mais próximas ganham mais pontos (até 25 pontos adicionais)
        const bonusProximidade = Math.max(0, 25 - distanciaKm * 3);
        score += bonusProximidade;
        motivos.push(`Proximidade de você (~${distanciaKm} km)`);
      }
    }

    // Motivo formatado
    let motivoRecomendacao = motivos.length > 0
      ? motivos.join('. ') + '.'
      : `Unidade de referência com avaliação ${rating}/5 no Google.`;

    return {
      ...unidade,
      score: Math.round(score * 10) / 10,
      distanciaKm,
      motivoRecomendacao
    };
  });

  // Ordenar pelas melhores pontuações decrescentes
  recomendacoes.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if (a.distanciaKm !== null && b.distanciaKm !== null) {
      return a.distanciaKm - b.distanciaKm;
    }
    return (b.google_rating || 0) - (a.google_rating || 0);
  });

  return recomendacoes;
}

export default {
  ensureDbFile,
  getAllUnidades,
  getUnidadeById,
  getUnidadesByCategoria,
  getUnidadesByEspecialidade,
  searchUnidades,
  saveAvaliacao,
  getAvaliacoesByUnidade,
  getRecomendacao,
  calcularDistanciaKm
};
