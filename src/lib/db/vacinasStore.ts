import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createClient } from '../supabase/server';
import type { VacinaRecord, OrigemVacina } from '../types';

const DB_PATH = path.resolve(process.cwd(), 'data/vacinas.json');

function ensureDbFile(): void {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DB_PATH)) {
    const seed: VacinaRecord[] = [
      {
        id: 'vac-seed-01',
        user_id: 'anonimo',
        nome_vacina: 'COVID-19 (Comirnaty Bivalente)',
        dose: 'Reforço Bivalente',
        data_aplicacao: '2024-04-10',
        data_proxima_dose: '2025-04-10',
        lote: 'FP8291',
        fabricante: 'Pfizer / BioNTech',
        local_aplicacao: 'UBS Severiano Moraes Filho - Garanhuns/PE',
        origem_dado: 'meu_sus_digital',
        autenticado_sus: true,
        observacoes: 'Registro oficial sincronizado via Meu SUS Digital',
        created_at: new Date('2024-04-10T10:00:00Z').toISOString(),
      },
      {
        id: 'vac-seed-02',
        user_id: 'anonimo',
        nome_vacina: 'Febre Amarela (Atenuada)',
        dose: 'Dose Única',
        data_aplicacao: '2019-07-22',
        data_proxima_dose: null,
        lote: '197VFA042Z',
        fabricante: 'Fiocruz / Bio-Manguinhos',
        local_aplicacao: 'Centro de Saúde da Mulher e da Criança',
        origem_dado: 'caderneta_papel',
        autenticado_sus: true,
        observacoes: 'Digitalizado da caderneta física de vacinação da infância',
        created_at: new Date('2024-01-15T14:30:00Z').toISOString(),
      },
      {
        id: 'vac-seed-03',
        user_id: 'anonimo',
        nome_vacina: 'Influenza Trivalente (Gripe)',
        dose: 'Dose Anual',
        data_aplicacao: '2025-05-18',
        data_proxima_dose: '2026-05-18',
        lote: '254INF019',
        fabricante: 'Instituto Butantan',
        local_aplicacao: 'UBS Magano - Garanhuns/PE',
        origem_dado: 'meu_sus_digital',
        autenticado_sus: true,
        observacoes: 'Campanha Nacional de Vacinação contra a Gripe',
        created_at: new Date('2025-05-18T09:15:00Z').toISOString(),
      },
      {
        id: 'vac-seed-04',
        user_id: 'anonimo',
        nome_vacina: 'Hepatite B (Recombinante)',
        dose: '3ª Dose',
        data_aplicacao: '2018-09-10',
        data_proxima_dose: null,
        lote: 'HPB8831',
        fabricante: 'Instituto Butantan',
        local_aplicacao: 'UBS Heliópolis - Garanhuns/PE',
        origem_dado: 'caderneta_papel',
        autenticado_sus: false,
        observacoes: 'Esquema básico completo de 3 doses',
        created_at: new Date('2024-02-10T16:00:00Z').toISOString(),
      },
    ];
    fs.writeFileSync(DB_PATH, JSON.stringify(seed, null, 2), 'utf-8');
  }
}

export async function getAllVacinas(): Promise<VacinaRecord[]> {
  ensureDbFile();
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw) || [];
  } catch (err) {
    console.error('[VacinasStore] Erro ao ler vacinas locais:', err);
    return [];
  }
}

export async function getVacinasByUser(userId: string): Promise<VacinaRecord[]> {
  const todas = await getAllVacinas();
  if (!userId || userId === 'anonimo') {
    return todas;
  }
  return todas.filter((v) => v.user_id === userId || v.user_id === 'anonimo');
}

export async function saveVacina(
  userId: string,
  dados: Partial<VacinaRecord>
): Promise<VacinaRecord> {
  ensureDbFile();
  const todas = await getAllVacinas();

  const id = dados.id || `vac-${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();

  const nova: VacinaRecord = {
    id,
    user_id: userId || 'anonimo',
    nome_vacina: (dados.nome_vacina || 'Vacina Não Identificada').trim(),
    dose: (dados.dose || '1ª Dose').trim(),
    data_aplicacao: dados.data_aplicacao || now.split('T')[0],
    data_proxima_dose: dados.data_proxima_dose || null,
    lote: dados.lote?.trim() || undefined,
    fabricante: dados.fabricante?.trim() || undefined,
    local_aplicacao: dados.local_aplicacao?.trim() || 'Unidade Básica de Saúde (SUS)',
    origem_dado: dados.origem_dado || 'manual',
    autenticado_sus: Boolean(dados.autenticado_sus),
    comprovante_url: dados.comprovante_url,
    observacoes: dados.observacoes?.trim() || '',
    created_at: dados.created_at || now,
  };

  todas.unshift(nova);
  fs.writeFileSync(DB_PATH, JSON.stringify(todas.slice(0, 500), null, 2), 'utf-8');

  // Sincroniza em segundo plano com Supabase se disponível
  try {
    const supabase = createClient();
    await supabase.from('vacinas_paciente').insert({
      id: nova.id,
      user_id: nova.user_id !== 'anonimo' ? nova.user_id : null,
      nome_vacina: nova.nome_vacina,
      dose: nova.dose,
      data_aplicacao: nova.data_aplicacao,
      data_proxima_dose: nova.data_proxima_dose,
      lote: nova.lote,
      fabricante: nova.fabricante,
      local_aplicacao: nova.local_aplicacao,
      origem_dado: nova.origem_dado,
      autenticado_sus: nova.autenticado_sus,
      observacoes: nova.observacoes,
    });
  } catch {
    // Tolerante a falhas se tabela ou credencial Supabase não estiverem ativas
  }

  return nova;
}

export async function saveMultiplasVacinas(
  userId: string,
  lista: Array<Partial<VacinaRecord>>,
  origem: OrigemVacina = 'meu_sus_digital',
  autenticadoSus = true
): Promise<VacinaRecord[]> {
  const salvas: VacinaRecord[] = [];
  for (const item of lista) {
    if (!item.nome_vacina || item.nome_vacina.trim().length === 0) continue;
    const salva = await saveVacina(userId, {
      ...item,
      origem_dado: item.origem_dado || origem,
      autenticado_sus: item.autenticado_sus !== undefined ? item.autenticado_sus : autenticadoSus,
    });
    salvas.push(salva);
  }
  return salvas;
}

export async function deleteVacina(id: string, userId?: string): Promise<boolean> {
  ensureDbFile();
  const todas = await getAllVacinas();
  const filtradas = todas.filter((v) => {
    if (v.id !== id) return true;
    if (userId && userId !== 'anonimo' && v.user_id !== userId && v.user_id !== 'anonimo') {
      return true; // Não permite excluir vacina de outro usuário
    }
    return false;
  });

  if (filtradas.length === todas.length) return false;

  fs.writeFileSync(DB_PATH, JSON.stringify(filtradas, null, 2), 'utf-8');

  // Supabase fallback delete
  try {
    const supabase = createClient();
    await supabase.from('vacinas_paciente').delete().eq('id', id);
  } catch {
    // Tolerante a falhas
  }

  return true;
}

export interface EstatisticasVacinais {
  totalDoses: number;
  verificadasSus: number;
  cadernetaFisica: number;
  ultimasAplicadas: VacinaRecord[];
  alertasReforco: Array<{
    vacina: string;
    motivo: string;
    urgencia: 'baixa' | 'media' | 'alta';
  }>;
}

export function calcularEstatisticasVacinais(vacinas: VacinaRecord[]): EstatisticasVacinais {
  const totalDoses = vacinas.length;
  const verificadasSus = vacinas.filter((v) => v.autenticado_sus || v.origem_dado === 'meu_sus_digital').length;
  const cadernetaFisica = vacinas.filter((v) => v.origem_dado === 'caderneta_papel').length;

  const alertasReforco: Array<{
    vacina: string;
    motivo: string;
    urgencia: 'baixa' | 'media' | 'alta';
  }> = [];

  const anoAtual = new Date().getFullYear();

  // 1. Checa vacina da gripe anual
  const temGripeRecente = vacinas.some((v) => {
    const nome = v.nome_vacina.toLowerCase();
    const ano = new Date(v.data_aplicacao).getFullYear();
    return (nome.includes('gripe') || nome.includes('influenza')) && ano >= anoAtual - 1;
  });

  if (!temGripeRecente) {
    alertasReforco.push({
      vacina: 'Influenza (Gripe)',
      motivo: `Campanha de vacinação ${anoAtual} disponível gratuitamente em qualquer UBS.`,
      urgencia: 'media',
    });
  }

  // 2. Checa vacina contra Tétano (reforço a cada 10 anos)
  const tetano = vacinas.filter((v) => {
    const n = v.nome_vacina.toLowerCase();
    return n.includes('tétano') || n.includes('tetano') || n.includes('dupla adulto') || n.includes('dt');
  });

  if (tetano.length === 0) {
    alertasReforco.push({
      vacina: 'Dupla Adulto (Difteria e Tétano)',
      motivo: 'Recomendada dose de reforço a cada 10 anos no SUS para todos os adultos.',
      urgencia: 'baixa',
    });
  }

  // 3. Checa COVID-19 bivalente
  const covid = vacinas.some((v) => v.nome_vacina.toLowerCase().includes('covid'));
  if (!covid) {
    alertasReforco.push({
      vacina: 'COVID-19 Bivalente',
      motivo: 'Esquema vacinal de proteção contra variantes recomendado pelo PNI.',
      urgencia: 'alta',
    });
  }

  const ultimasAplicadas = [...vacinas]
    .sort((a, b) => new Date(b.data_aplicacao).getTime() - new Date(a.data_aplicacao).getTime())
    .slice(0, 5);

  return {
    totalDoses,
    verificadasSus,
    cadernetaFisica,
    ultimasAplicadas,
    alertasReforco,
  };
}
