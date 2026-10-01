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
