// Type definitions for SaúdePraTodos platform
// Mirrors the updated PostgreSQL / Supabase database schema (v2)

export type Camada = 'gratuita' | 'intermediaria' | 'premium'

export type NivelUrgencia = 'verde' | 'amarelo' | 'vermelho'

export type Recomendacao = 'ubs' | 'upa' | 'teleconsulta' | 'esperar'

export type TipoLembrete = 'vacina' | 'consulta'

export type StatusLembrete = 'pendente' | 'enviado' | 'concluido'

export type TipoUnidade = 'ubs' | 'upa' | 'hospital_publico'

export type StatusContrato = 'ativo' | 'piloto' | 'encerrado'

export type TipoParceiroClinica = 'clinica' | 'plano_saude'

export type StatusTeleconsulta = 'agendada' | 'concluida' | 'cancelada'

export type UF =
  | 'AC' | 'AL' | 'AP' | 'AM' | 'BA' | 'CE' | 'DF' | 'ES'
  | 'GO' | 'MA' | 'MT' | 'MS' | 'MG' | 'PA' | 'PB' | 'PR'
  | 'PE' | 'PI' | 'RJ' | 'RN' | 'RS' | 'RO' | 'RR' | 'SC'
  | 'SP' | 'SE' | 'TO'

// ----- Database Tables -----

export interface Profile {
  id: string
  nome_completo: string
  telefone?: string | null
  data_nascimento?: string | null
  cidade: string
  uf: UF | string
  camada: Camada
  created_at: string
  updated_at: string
}

export interface SecretariaSaude {
  id: string
  municipio: string
  uf: UF | string
  responsavel_nome?: string | null
  contato_email: string
  contato_telefone?: string | null
  status_contrato: StatusContrato
  created_at: string
}

export interface UnidadeSaude {
  id: string
  secretaria_id?: string | null
  nome: string
  tipo: TipoUnidade
  endereco: string
  cidade: string
  uf: UF | string
  latitude: number
  longitude: number
  telefone?: string | null
  created_at: string
}

export interface ClinicaPlano {
  id: string
  nome: string
  tipo: TipoParceiroClinica
  cidade: string
  uf: UF | string
  status_parceria: StatusContrato
  valor_mensalidade_centavos: number
  created_at: string
}

export interface Triagem {
  id: string
  user_id: string
  sintoma_principal: string
  duracao?: string | null
  intensidade?: number | null
  respostas: Array<{ pergunta: string; resposta: any }> | Record<string, any>
  nivel_urgencia: NivelUrgencia
  recomendacao: Recomendacao
  explicacao?: string | null
  foto_storage_path?: string | null
  cidade_snapshot: string
  uf_snapshot: UF | string
  created_at: string
}

export interface Teleconsulta {
  id: string
  user_id: string
  clinica_id: string
  triagem_id?: string | null
  profissional_nome?: string | null
  data_agendamento: string
  status: StatusTeleconsulta
  valor_cobrado_centavos: number
  comissao_plataforma_centavos: number
  link_sala?: string | null
  created_at: string
}

export interface Assinatura {
  id: string
  user_id: string
  clinica_plano_id: string
  status: string
  valor_mensalidade_centavos: number
  created_at: string
  expires_at?: string | null
}

export interface Lembrete {
  id: string
  user_id: string
  tipo: TipoLembrete
  descricao: string
  data_agendada: string
  status: StatusLembrete
  created_at: string
}

// ----- Analytics & Views -----

export interface AlertaEpidemiologico {
  data_referencia: string
  cidade: string
  uf: string
  sintoma_principal: string
  nivel_urgencia: NivelUrgencia
  recomendacao: Recomendacao
  total_casos: number
}

// ----- Composite types for UI -----

export interface DashboardData {
  profile: Profile
  triagens: Triagem[]
  lembretes: Lembrete[]
}

// ----- Form types -----

export interface CadastroFormData {
  nome_completo: string
  email: string
  senha: string
  confirmar_senha: string
  telefone: string
  data_nascimento: string
  cidade: string
  uf: UF | ''
  aceite_termos: boolean
}

export interface LoginFormData {
  email: string
  senha: string
}

export interface TriagemFormData {
  sintoma_principal: string
  duracao: string
  intensidade: number
  tem_febre: string
  tem_dor: string
  local_dor: string
  toma_medicamento: string
  qual_medicamento: string
  tem_condicao_cronica: string[]
  esta_gravida: string
  foto: File | null
  descricao_foto: string
}

// ----- Health Units & Reviews -----

export type CategoriaUnidade = 'hospital' | 'policlinica' | 'caps' | 'ubs' | 'cras' | 'creas' | 'samu'

export interface UnidadeSaudeCompleta {
  id: string
  nome: string
  nome_curto?: string
  categoria: CategoriaUnidade
  tipo_label: string
  endereco: string
  bairro: string
  cidade: string
  uf: string
  telefone: string
  telefones_adicionais?: string[]
  horario: string
  horario_detalhe?: string
  latitude: number
  longitude: number
  especialidades: string[]
  servicos?: string[]
  google_rating: number
  google_total_avaliacoes: number
  google_maps_url: string
  badge?: string
  status: string
  status_color: string
  sus_gratuito: boolean
  tem_urgencia: boolean
  observacoes?: string
  imagem: string
  created_at: string
  google_reviews?: GoogleReview[]
  // Computed fields from recommendation API
  score?: number
  distanciaKm?: number
  motivoRecomendacao?: string
}

export interface GoogleReview {
  autor: string
  nota: number
  data_relativa: string
  texto: string
  foto_perfil?: string | null
}

export interface AvaliacaoUnidade {
  id: string
  unidade_id: string
  user_id: string
  nome: string
  nota: number
  comentario: string
  created_at: string
}

export type OrdenacaoUnidades = 'recomendacao' | 'distancia' | 'avaliacao' | 'nome'

// ----- Agendamentos Hospitalares com Diagnóstico de IA -----

export type StatusAgendamentoHospital = 'agendado' | 'confirmado' | 'em_atendimento' | 'concluido' | 'cancelado'

export type StatusEnvioHospital = 'transmitido_com_sucesso' | 'recepcionado' | 'em_processamento'

export interface TransmissaoHospitalDetalhes {
  data_envio: string
  canal: string
  sistema_destino: string
  hash_seguranca: string
  recepcionado_por: string
  status_prontuario: string
}

export interface AgendamentoHospitalar {
  id: string
  protocolo: string
  user_id: string
  paciente_nome: string
  paciente_cpf: string
  paciente_telefone: string
  paciente_email?: string
  paciente_data_nascimento?: string
  // Hospital / Unidade
  unidade_id: string
  unidade_nome: string
  unidade_tipo: string
  unidade_endereco: string
  unidade_bairro?: string
  unidade_cidade: string
  unidade_uf: string
  unidade_telefone: string
  // Agendamento
  especialidade: string
  data_agendamento: string
  horario: string
  turno: 'manha' | 'tarde' | 'plantao_urgencia'
  tipo_atendimento: 'presencial' | 'triagem_hospitalar' | 'retorno' | 'exame'
  observacoes_paciente?: string
  // Diagnóstico e Triagem IA
  triagem_id?: string
  sintomas_citados: string
  diagnostico_ia: string
  nivel_urgencia: NivelUrgencia
  prioridade: string
  orientacao_ia: string
  especialidade_recomendada_ia?: string
  fonte_ia: string
  resumo_clinico_hospital: string
  // Transmissão
  status: StatusAgendamentoHospital
  status_envio_hospital: StatusEnvioHospital
  transmissao_hospital: TransmissaoHospitalDetalhes
  created_at: string
  updated_at: string
}

