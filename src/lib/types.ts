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
  hipoteses_diagnosticas?: Array<{ nome: string; probabilidade: number }>
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
  // Recepção e Conduta Médica do Hospital
  anotacoes_medicas?: string
  chamado_em?: string
  medico_responsavel?: string
  sala_atendimento?: string
  created_at: string
  updated_at: string
}

// ----- Autenticação e Perfis Exclusivos de Hospitais -----

export interface UsuarioHospital {
  id: string
  email: string
  senha_hash: string
  hospital_id: string
  hospital_nome: string
  hospital_curto?: string
  hospital_cidade: string
  hospital_uf: string
  cnpj: string
  responsavel_nome: string
  cargo: string
  registro_profissional?: string
  telefone: string
  aprovado: boolean
  aprovado_por?: string
  data_aprovacao?: string
  permissoes?: string[]
}

export interface SessaoHospital {
  token: string
  user_id: string
  email: string
  hospital_id: string
  hospital_nome: string
  hospital_curto?: string
  hospital_cidade: string
  hospital_uf: string
  responsavel_nome: string
  cargo: string
  criado_em: string
}

// ----- Registro de Vacinas & Carteira de Imunização -----

export type OrigemVacina = 'meu_sus_digital' | 'caderneta_papel' | 'manual'

export interface VacinaRecord {
  id: string
  user_id: string
  nome_vacina: string
  dose: string
  data_aplicacao: string
  data_proxima_dose?: string | null
  lote?: string
  fabricante?: string
  local_aplicacao?: string
  origem_dado: OrigemVacina
  autenticado_sus: boolean
  comprovante_url?: string
  observacoes?: string
  created_at: string
}

export interface ResultadoScanVacinas {
  tipo_documento_detectado: 'meu_sus_digital' | 'caderneta_papel' | 'desconhecido'
  confianca_leitura: number
  qr_code_sus_detectado: boolean
  vacinas_extraidas: Array<{
    nome_vacina: string
    dose: string
    data_aplicacao: string
    data_proxima_dose?: string | null
    lote?: string
    fabricante?: string
    local_aplicacao?: string
  }>
  resumo_clinico: string
  recomendacoes_pni: string[]
}



// ----- Consulta de Medicamentos & Farmácia SUS (RENAME / Farmácia Popular) -----

export type CategoriaMedicamento =
  | 'Hipertensão'
  | 'Diabetes'
  | 'Dor e Febre'
  | 'Antibióticos'
  | 'Asma e Respiratório'
  | 'Saúde Mental'
  | 'Gástrico'
  | 'Colesterol'
  | 'Anti-inflamatórios'
  | 'Outros'

export type ProgramaDispensacao =
  | 'Farmácia Básica SUS (100% Gratuito)'
  | 'Farmácia Popular (Gratuito)'
  | 'Componente Especializado (Alto Custo)'

export type TipoReceitaMedicamento =
  | 'Receita Simples (Validade 30 dias)'
  | 'Receita de Uso Contínuo (Validade 180 dias)'
  | 'Receita de Controle Especial (Branca 2 vias)'
  | 'Receita Notificação B (Azul)'

export interface UnidadeDispensacao {
  id: string
  nome: string
  tipo: 'Farmácia Central' | 'UBS' | 'Farmácia Popular Conveniada'
  bairro: string
  endereco: string
  telefone?: string
  horario: string
  status_estoque: 'Disponível' | 'Estoque Baixo' | 'Sob Consulta'
  latitude?: number
  longitude?: number
  distancia_km?: number
}

export interface MedicamentoItem {
  id: string
  nome: string
  principio_ativo: string
  concentracao: string
  forma_farmaceutica: string
  categoria: CategoriaMedicamento
  programa: ProgramaDispensacao
  tipo_receita: TipoReceitaMedicamento
  indicacao: string
  documentos_exigidos: string[]
  orientacao_uso: string
  unidades_disponiveis: UnidadeDispensacao[]
}
