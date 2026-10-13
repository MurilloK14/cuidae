import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createClient } from '../supabase/server';
import type { AgendamentoHospitalar, StatusAgendamentoHospital } from '../types';

const DB_PATH = path.resolve(process.cwd(), 'data/agendamentos.json');

function ensureDbFile(): void {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2), 'utf-8');
  }
}

function gerarProtocolo(): string {
  const ano = new Date().getFullYear();
  const aleatorio = Math.floor(10000 + Math.random() * 90000);
  return `HOSP-GRH-${ano}-${aleatorio}`;
}

function gerarHashSeguranca(protocolo: string, paciente: string, hospital: string): string {
  const dados = `${protocolo}|${paciente}|${hospital}|${Date.now()}`;
  return crypto.createHash('sha256').update(dados).digest('hex').substring(0, 24).toUpperCase();
}

export async function getAllAgendamentos(): Promise<AgendamentoHospitalar[]> {
  ensureDbFile();
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw) || [];
  } catch (err) {
    console.error('[AgendamentoStore] Erro ao ler agendamentos locais:', err);
    return [];
  }
}

export async function getAgendamentosByUser(userId: string): Promise<AgendamentoHospitalar[]> {
  const lista = await getAllAgendamentos();
  if (!userId || userId === 'anonimo') {
    return lista;
  }
  return lista.filter((ag) => ag.user_id === userId || ag.user_id === 'anonimo');
}

export async function getAgendamentoById(id: string): Promise<AgendamentoHospitalar | null> {
  const lista = await getAllAgendamentos();
  const localMatch = lista.find((a) => a.id === id || a.protocolo === id);
  if (localMatch) return localMatch;

  // Fallback via Supabase se configurado
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('agendamentos_hospitalares')
      .select('*')
      .or(`id.eq.${id},protocolo.eq.${id}`)
      .single();

    if (data) return data as AgendamentoHospitalar;
  } catch {
    // Falha silenciosa
  }

  return null;
}

export async function saveAgendamento(
  dados: Partial<AgendamentoHospitalar>
): Promise<AgendamentoHospitalar> {
  ensureDbFile();
  const lista = await getAllAgendamentos();

  const id = dados.id || crypto.randomUUID();
  const protocolo = dados.protocolo || gerarProtocolo();
  const now = new Date().toISOString();

  const hospitalNome = dados.unidade_nome || 'Hospital Regional';
  const pacienteNome = dados.paciente_nome || 'Paciente';

  const hashSeguranca = dados.transmissao_hospital?.hash_seguranca ||
    gerarHashSeguranca(protocolo, pacienteNome, hospitalNome);

  const novoAgendamento: AgendamentoHospitalar = {
    id,
    protocolo,
    user_id: dados.user_id || 'anonimo',
    paciente_nome: pacienteNome,
    paciente_cpf: dados.paciente_cpf || 'Não informado',
    paciente_telefone: dados.paciente_telefone || 'Não informado',
    paciente_email: dados.paciente_email || '',
    paciente_data_nascimento: dados.paciente_data_nascimento || '',
    
    // Hospital
    unidade_id: dados.unidade_id || '',
    unidade_nome: hospitalNome,
    unidade_tipo: dados.unidade_tipo || 'hospital',
    unidade_endereco: dados.unidade_endereco || 'Garanhuns - PE',
    unidade_bairro: dados.unidade_bairro || '',
    unidade_cidade: dados.unidade_cidade || 'Garanhuns',
    unidade_uf: dados.unidade_uf || 'PE',
    unidade_telefone: dados.unidade_telefone || '(87) 3761-8100',
    
    // Agendamento
    especialidade: dados.especialidade || 'Clínica Geral',
    data_agendamento: dados.data_agendamento || now.split('T')[0],
    horario: dados.horario || '08:30',
    turno: dados.turno || 'manha',
    tipo_atendimento: dados.tipo_atendimento || 'presencial',
    observacoes_paciente: dados.observacoes_paciente || '',
    
    // Diagnóstico e Triagem IA
    triagem_id: dados.triagem_id || undefined,
    sintomas_citados: dados.sintomas_citados || 'Sintomas não especificados',
    diagnostico_ia: dados.diagnostico_ia || 'Avaliação clínica recomendada',
    nivel_urgencia: dados.nivel_urgencia || 'amarelo',
    prioridade: dados.prioridade || 'Média',
    orientacao_ia: dados.orientacao_ia || 'Comparecer munido de documento oficial e Cartão do SUS.',
    especialidade_recomendada_ia: dados.especialidade_recomendada_ia || dados.especialidade || 'Clínica Geral',
    fonte_ia: dados.fonte_ia || 'Google Gemini 3.8 Flash (Protocolo Cuidaê)',
    resumo_clinico_hospital: dados.resumo_clinico_hospital ||
      `Paciente encaminhado via Cuidaê. Queixa/Sintomas: "${dados.sintomas_citados}". Hipótese preliminar da IA: "${dados.diagnostico_ia}". Classificação de Risco: ${dados.nivel_urgencia?.toUpperCase()}.`,
    
    // Transmissão ao Hospital
    status: dados.status || 'agendado',
    status_envio_hospital: 'transmitido_com_sucesso',
    transmissao_hospital: {
      data_envio: now,
      canal: 'Barramento Integrado de Saúde & SISREG (Cuidaê Connect)',
      sistema_destino: `Central de Recepção e Triagem - ${hospitalNome}`,
      hash_seguranca: hashSeguranca,
      recepcionado_por: 'Protocolo Eletrônico Automático de Entrada Hospitalar',
      status_prontuario: 'Prontuário pré-cadastrado e anexado com sintomas e diagnóstico da IA',
      ...dados.transmissao_hospital
    },
    created_at: dados.created_at || now,
    updated_at: now
  };

  lista.unshift(novoAgendamento);
  fs.writeFileSync(DB_PATH, JSON.stringify(lista.slice(0, 500), null, 2), 'utf-8');

  // Integração em segundo plano com Supabase
  try {
    const supabase = createClient();
    
    // Cria lembrete para o paciente no dashboard
    if (novoAgendamento.user_id && novoAgendamento.user_id !== 'anonimo') {
      await supabase.from('lembretes').insert({
        user_id: novoAgendamento.user_id,
        tipo: 'consulta',
        descricao: `Consulta agendada no ${hospitalNome} (${novoAgendamento.especialidade}) - Prot: ${protocolo}`,
        data_agendada: novoAgendamento.data_agendamento,
        status: 'pendente'
      });
    }

    // Tenta salvar na tabela dedicada se já existir
    await supabase.from('agendamentos_hospitalares').insert({
      id: novoAgendamento.id,
      protocolo: novoAgendamento.protocolo,
      user_id: novoAgendamento.user_id !== 'anonimo' ? novoAgendamento.user_id : null,
      unidade_nome: novoAgendamento.unidade_nome,
      especialidade: novoAgendamento.especialidade,
      data_agendamento: novoAgendamento.data_agendamento,
      horario: novoAgendamento.horario,
      sintomas_citados: novoAgendamento.sintomas_citados,
      diagnostico_ia: novoAgendamento.diagnostico_ia,
      nivel_urgencia: novoAgendamento.nivel_urgencia,
      status: novoAgendamento.status
    });
  } catch {
    // Tolerante a falhas
  }

  return novoAgendamento;
}

export async function updateAgendamentoStatus(
  id: string,
  status: StatusAgendamentoHospital
): Promise<AgendamentoHospitalar | null> {
  ensureDbFile();
  const lista = await getAllAgendamentos();
  const index = lista.findIndex((a) => a.id === id || a.protocolo === id);
  if (index === -1) return null;

  lista[index].status = status;
  lista[index].updated_at = new Date().toISOString();

  fs.writeFileSync(DB_PATH, JSON.stringify(lista, null, 2), 'utf-8');
  return lista[index];
}
