import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, '../../data/triagens.json');

// Garante que o diretório e o arquivo existem
function ensureDbFile() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2), 'utf-8');
  }
}

/**
 * Lê todas as triagens do banco de dados local.
 */
export function getAllTriagens() {
  ensureDbFile();
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw) || [];
  } catch (err) {
    console.error('[DB] Erro ao ler triagens:', err.message);
    return [];
  }
}

/**
 * Busca uma triagem pelo ID.
 */
export function getTriagemById(id) {
  const triagens = getAllTriagens();
  return triagens.find((t) => t.id === id) || null;
}

/**
 * Salva uma nova triagem no banco de dados local.
 */
export function saveTriagem(dados) {
  ensureDbFile();
  const triagens = getAllTriagens();

  const id = dados.id || crypto.randomUUID();
  const novaTriagem = {
    id,
    user_id: dados.user_id || 'anonimo',
    sintoma_principal: dados.sintoma_principal || dados.sintoma || '',
    duracao: dados.duracao || 'Não informada',
    intensidade: dados.intensidade || 5,
    respostas: dados.respostas || [],
    nivel_urgencia: dados.nivel_urgencia || 'verde',
    recomendacao: dados.recomendacao || 'ubs',
    especialidade: dados.especialidade || 'Clínico Geral',
    explicacao: dados.explicacao || dados.mensagem || '',
    orientacao: dados.orientacao || '',
    tipoUnidade: dados.tipoUnidade || 'UBS',
    mapa: dados.mapa || null,
    foto_storage_path: dados.foto_storage_path || null,
    cidade_snapshot: dados.cidade_snapshot || 'São Paulo',
    uf_snapshot: dados.uf_snapshot || 'SP',
    fonteIA: dados.fonteIA || 'Google Gemini',
    created_at: dados.created_at || new Date().toISOString()
  };

  triagens.unshift(novaTriagem);

  // Mantém os últimos 500 registros
  const trimmed = triagens.slice(0, 500);
  fs.writeFileSync(DB_PATH, JSON.stringify(trimmed, null, 2), 'utf-8');

  console.log(`[DB] Triagem salva com sucesso: ${id}`);
  return novaTriagem;
}
