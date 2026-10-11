import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createClient } from '../supabase/server';

const DB_PATH = path.resolve(process.cwd(), 'data/triagens.json');

export interface TriageRecord {
  id: string;
  user_id: string;
  sintoma_principal: string;
  duracao?: string;
  intensidade?: number;
  respostas?: Array<{ pergunta: string; resposta: any }>;
  nivel_urgencia: 'verde' | 'amarelo' | 'vermelho';
  recomendacao: 'ubs' | 'upa' | 'teleconsulta' | 'esperar';
  especialidade?: string;
  explicacao: string;
  orientacao?: string;
  tipoUnidade?: string;
  mapa?: { label: string; url: string; tipo?: string } | null;
  foto_storage_path?: string | null;
  cidade_snapshot: string;
  uf_snapshot: string;
  fonteIA?: string;
  created_at: string;
}

function ensureDbFile(): void {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2), 'utf-8');
  }
}

export async function getAllTriagensFromStore(): Promise<TriageRecord[]> {
  ensureDbFile();
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw) || [];
  } catch (err) {
    console.error('[TriageStore] Erro ao ler triagens locais:', err);
    return [];
  }
}

export async function getTriagemFromStore(id: string): Promise<TriageRecord | null> {
  // 1. Tenta buscar no banco local
  const list = await getAllTriagensFromStore();
  const localMatch = list.find((t) => t.id === id);
  if (localMatch) return localMatch;

  // 2. Se não estiver no local, tenta buscar no Supabase
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('triagens')
      .select('*')
      .eq('id', id)
      .single();

    if (!error && data) {
      return data as TriageRecord;
    }
  } catch (err) {
    // Supabase offline ou projeto inativo
  }

  return null;
}

export async function saveTriagemToStore(dados: Partial<TriageRecord>): Promise<TriageRecord> {
  ensureDbFile();
  const list = await getAllTriagensFromStore();

  const id = dados.id || crypto.randomUUID();
  const record: TriageRecord = {
    id,
    user_id: dados.user_id || 'anonimo',
    sintoma_principal: dados.sintoma_principal || '',
    duracao: dados.duracao || 'Não informada',
    intensidade: dados.intensidade || 5,
    respostas: dados.respostas || [],
    nivel_urgencia: dados.nivel_urgencia || 'verde',
    recomendacao: dados.recomendacao || 'ubs',
    especialidade: dados.especialidade || 'Clínico Geral',
    explicacao: dados.explicacao || '',
    orientacao: dados.orientacao || '',
    tipoUnidade: dados.tipoUnidade || 'UBS',
    mapa: dados.mapa || null,
    foto_storage_path: dados.foto_storage_path || null,
    cidade_snapshot: dados.cidade_snapshot || 'São Paulo',
    uf_snapshot: dados.uf_snapshot || 'SP',
    fonteIA: dados.fonteIA || 'Google Gemini Flash',
    created_at: dados.created_at || new Date().toISOString(),
  };

  list.unshift(record);
  fs.writeFileSync(DB_PATH, JSON.stringify(list.slice(0, 500), null, 2), 'utf-8');

  // Tenta sincronizar com Supabase em segundo plano se disponível
  try {
    const supabase = createClient();
    await supabase.from('triagens').insert({
      id: record.id,
      user_id: record.user_id !== 'anonimo' ? record.user_id : undefined,
      sintoma_principal: record.sintoma_principal,
      duracao: record.duracao,
      intensidade: record.intensidade,
      respostas: record.respostas,
      nivel_urgencia: record.nivel_urgencia,
      recomendacao: record.recomendacao,
      explicacao: record.explicacao,
      foto_storage_path: record.foto_storage_path,
      cidade_snapshot: record.cidade_snapshot,
      uf_snapshot: record.uf_snapshot,
    });
  } catch {
    // Falha silenciosa no Supabase, dados já estão garantidos no banco local
  }

  return record;
}
