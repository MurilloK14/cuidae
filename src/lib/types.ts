// Type definitions for SaúdeIA platform
// These types mirror the Supabase database schema

export type Camada = 'gratuita' | 'intermediaria' | 'premium'

export type NivelUrgencia = 'verde' | 'amarelo' | 'vermelho'

export type Recomendacao = 'ubs' | 'upa' | 'teleconsulta' | 'esperar'

export type TipoLembrete = 'vacina' | 'consulta' | 'retorno' | 'exame'

export type TipoUnidade = 'ubs' | 'upa' | 'hospital' | 'clinica'

export type StatusAssinatura = 'ativa' | 'cancelada' | 'expirada'

export type PlanoAssinatura = 'intermediaria' | 'premium'

export type StatusTeleconsulta = 'agendada' | 'realizada' | 'cancelada'

export type AdminRole = 'admin' | 'secretaria' | 'viewer'

export type UF =
  | 'AC' | 'AL' | 'AP' | 'AM' | 'BA' | 'CE' | 'DF' | 'ES'
  | 'GO' | 'MA' | 'MT' | 'MS' | 'MG' | 'PA' | 'PB' | 'PR'
  | 'PE' | 'PI' | 'RJ' | 'RN' | 'RS' | 'RO' | 'RR' | 'SC'
  | 'SP' | 'SE' | 'TO'

// ----- Database Tables -----

export interface Profile {
  id: string
  nome_completo: string
  telefone: string
  data_nascimento: string // ISO date string
  cidade: string
  uf: UF
  camada: Camada
  created_at: string
  updated_at: string
}

export interface Triagem {
  id: string
  user_id: string
  sintoma_principal: string
  duracao: string
  intensidade: number
  created_at: string
}

export interface TriagemResposta {
  id: string
  triagem_id: string
  pergunta: string
  resposta: string
}

export interface TriagemFoto {
  id: string
  triagem_id: string
  storage_path: string
  descricao: string | null
  created_at: string
}

export interface TriagemResultado {
  id: string
  triagem_id: string
  nivel_urgencia: NivelUrgencia
  recomendacao: Recomendacao
  explicacao: string
  created_at: string
}

export interface Lembrete {
  id: string
  user_id: string
  tipo: TipoLembrete
  descricao: string
  data_lembrete: string // ISO date string
  concluido: boolean
}

export interface Assinatura {
  id: string
  user_id: string
  plano: PlanoAssinatura
  status: StatusAssinatura
  gateway_id: string | null
  preco_centavos: number
  created_at: string
  expires_at: string | null
}

export interface Teleconsulta {
  id: string
  user_id: string
  triagem_id: string | null
  status: StatusTeleconsulta
  data_agendamento: string
  link_sala: string | null
  preco_centavos: number
  created_at: string
}

export interface UnidadeSaude {
  id: string
  nome: string
  tipo: TipoUnidade
  endereco: string
  cidade: string
  uf: UF
  latitude: number
  longitude: number
  telefone: string | null
}

export interface AdminUser {
  id: string
  email: string
  role: AdminRole
  cidade_vinculada: string | null
  uf_vinculada: UF | null
  created_at: string
}

// ----- Composite types for UI -----

export interface TriagemComResultado extends Triagem {
  resultado: TriagemResultado | null
}

export interface DashboardData {
  profile: Profile
  triagens: TriagemComResultado[]
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
