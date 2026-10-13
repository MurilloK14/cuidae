import fs from 'fs';
import path from 'path';

export interface HorarioAgendamento {
  id: string;
  horario: string;
  turno: 'manha' | 'tarde' | 'plantao_urgencia' | 'noite';
  vagas: number;
  ativo: boolean;
}

export interface HospitalConfig {
  hospital_id: string;
  hospital_nome: string;
  turnos_ativos: {
    manha: boolean;
    tarde: boolean;
    plantao_urgencia: boolean;
  };
  horarios: HorarioAgendamento[];
  consultorios: string[];
  tempo_medio_consulta_minutos: number;
  chamador_voz_padrao: boolean;
  modo_noturno_recepcao: boolean;
  notificacoes_urgencia_sonora: boolean;
  especialidades: string[];
}

const CONFIG_PATH = path.resolve(process.cwd(), 'data/hospital_config.json');

function ensureConfigFile(): void {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(CONFIG_PATH)) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify({}, null, 2), 'utf-8');
  }
}

export function getAllHospitalConfigs(): Record<string, HospitalConfig> {
  ensureConfigFile();
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    return JSON.parse(raw) || {};
  } catch (err) {
    console.error('[HospitalConfigStore] Erro ao ler configs:', err);
    return {};
  }
}

export function saveAllHospitalConfigs(configs: Record<string, HospitalConfig>): void {
  ensureConfigFile();
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(configs, null, 2), 'utf-8');
  } catch (err) {
    console.error('[HospitalConfigStore] Erro ao salvar configs:', err);
  }
}

export function getHospitalConfig(hospitalId: string, hospitalNome = 'Hospital Geral'): HospitalConfig {
  const configs = getAllHospitalConfigs();
  if (configs[hospitalId]) {
    return configs[hospitalId];
  }

  // Se não existir configuração específica para o ID, cria uma padrão
  const defaultConfig: HospitalConfig = {
    hospital_id: hospitalId,
    hospital_nome: hospitalNome,
    turnos_ativos: {
      manha: true,
      tarde: true,
      plantao_urgencia: true,
    },
    horarios: [
      { id: 'h-0800', horario: '08:00', turno: 'manha', vagas: 3, ativo: true },
      { id: 'h-0900', horario: '09:00', turno: 'manha', vagas: 4, ativo: true },
      { id: 'h-1000', horario: '10:00', turno: 'manha', vagas: 4, ativo: true },
      { id: 'h-1100', horario: '11:00', turno: 'manha', vagas: 3, ativo: true },
      { id: 'h-1400', horario: '14:00', turno: 'tarde', vagas: 4, ativo: true },
      { id: 'h-1500', horario: '15:00', turno: 'tarde', vagas: 4, ativo: true },
      { id: 'h-1600', horario: '16:00', turno: 'tarde', vagas: 3, ativo: true },
      { id: 'h-plantao', horario: 'Plantão 24h Imediato', turno: 'plantao_urgencia', vagas: 10, ativo: true },
    ],
    consultorios: [
      'Consultório 1 - Acolhimento',
      'Consultório 2 - Triagem Rápida',
      'Consultório 3 - Clínica Geral',
      'Recepção Geral',
    ],
    tempo_medio_consulta_minutos: 20,
    chamador_voz_padrao: true,
    modo_noturno_recepcao: false,
    notificacoes_urgencia_sonora: true,
    especialidades: ['Clínica Médica', 'Urgência e Emergência', 'Triagem Geral'],
  };

  configs[hospitalId] = defaultConfig;
  saveAllHospitalConfigs(configs);
  return defaultConfig;
}

export function addHorarioToHospital(
  hospitalId: string,
  horario: string,
  turno: 'manha' | 'tarde' | 'plantao_urgencia' | 'noite',
  vagas = 3
): HospitalConfig {
  const config = getHospitalConfig(hospitalId);
  const existing = config.horarios.find((h) => h.horario === horario);
  if (existing) {
    existing.ativo = true;
    existing.vagas = vagas;
    existing.turno = turno;
  } else {
    config.horarios.push({
      id: `h-${Date.now()}`,
      horario,
      turno,
      vagas,
      ativo: true,
    });
  }

  // Ordena horários
  config.horarios.sort((a, b) => a.horario.localeCompare(b.horario));

  const all = getAllHospitalConfigs();
  all[hospitalId] = config;
  saveAllHospitalConfigs(all);
  return config;
}

export function removeHorarioFromHospital(hospitalId: string, horarioOrId: string): HospitalConfig {
  const config = getHospitalConfig(hospitalId);
  config.horarios = config.horarios.filter((h) => h.id !== horarioOrId && h.horario !== horarioOrId);

  const all = getAllHospitalConfigs();
  all[hospitalId] = config;
  saveAllHospitalConfigs(all);
  return config;
}

export function updateHospitalConfig(hospitalId: string, updates: Partial<HospitalConfig>): HospitalConfig {
  const current = getHospitalConfig(hospitalId);
  const updated: HospitalConfig = {
    ...current,
    ...updates,
    hospital_id: hospitalId,
  };

  const all = getAllHospitalConfigs();
  all[hospitalId] = updated;
  saveAllHospitalConfigs(all);
  return updated;
}
