'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Building2,
  Users,
  AlertTriangle,
  AlertOctagon,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Calendar,
  Sparkles,
  Search,
  RefreshCw,
  Volume2,
  VolumeX,
  Stethoscope,
  ChevronRight,
  ExternalLink,
  Printer,
  FileText,
  User,
  HeartPulse,
  Phone,
  MapPin,
  Check,
  X,
  Send,
  Loader2,
  ArrowLeft,
  Lock,
  ShieldAlert,
  LogOut,
  Key,
  Copy,
  Mail,
  Trash2,
  Plus,
  Sliders,
  Settings,
  Sun,
  Moon,
  ToggleLeft,
  ToggleRight,
  SlidersHorizontal,
} from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import type { AgendamentoHospitalar, StatusAgendamentoHospital, NivelUrgencia } from '@/lib/types'

export default function PainelHospitalPage() {
  // Autenticação e Exclusividade Hospitalar
  const [hospitalSessao, setHospitalSessao] = useState<any>(null)
  const [verificandoAuth, setVerificandoAuth] = useState(true)
  const [autenticadoHospital, setAutenticadoHospital] = useState(false)
  const [loginRapidoLoading, setLoginRapidoLoading] = useState(false)
  const [modalCredenciamentoAberto, setModalCredenciamentoAberto] = useState(false)
  const [emailCopiado, setEmailCopiado] = useState(false)

  // Navegação entre Fila e Configurações
  const [abaAtiva, setAbaAtiva] = useState<'fila' | 'configuracoes'>('fila')

  // Configurações e Opções de Agendamento da Unidade
  const [configHospital, setConfigHospital] = useState<any>(null)
  const [carregandoConfig, setCarregandoConfig] = useState(false)
  const [novoHorario, setNovoHorario] = useState('')
  const [novoTurno, setNovoTurno] = useState<'manha' | 'tarde' | 'plantao_urgencia'>('manha')
  const [novasVagas, setNovasVagas] = useState(3)
  const [salvandoHorario, setSalvandoHorario] = useState(false)
  const [excluindoHorarioId, setExcluindoHorarioId] = useState<string | null>(null)
  const [feedbackConfig, setFeedbackConfig] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)

  const [agendamentos, setAgendamentos] = useState<AgendamentoHospitalar[]>([])
  const [hospitais, setHospitais] = useState<any[]>([])
  const [metricas, setMetricas] = useState({
    total: 0,
    aguardando: 0,
    emAtendimento: 0,
    concluidos: 0,
    urgentes: 0,
    amarelos: 0,
    verdes: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filtros
  const [unidadeFiltro, setUnidadeFiltro] = useState('todas')
  const [statusFiltro, setStatusFiltro] = useState('todos')
  const [urgenciaFiltro, setUrgenciaFiltro] = useState('todas')
  const [busca, setBusca] = useState('')
  const [consultorioAtivo, setConsultorioAtivo] = useState('Consultório 1 - Acolhimento')
  const [vozAtiva, setVozAtiva] = useState(true)

  // Modal / Drawer de Prontuário Selecionado
  const [pacienteSelecionado, setPacienteSelecionado] = useState<AgendamentoHospitalar | null>(null)
  const [anotacaoMedica, setAnotacaoMedica] = useState('')
  const [salvandoAnotacao, setSalvandoAnotacao] = useState(false)
  const [sucessoAnotacao, setSucessoAnotacao] = useState(false)

  // Carregar Configurações e Horários do Hospital
  const carregarConfigHospital = async (targetId?: string, targetNome?: string) => {
    try {
      setCarregandoConfig(true)
      const hId = targetId || hospitalSessao?.hospital_id || '7a1b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d'
      const hNome = targetNome || hospitalSessao?.hospital_nome || 'Hospital Regional Dom Moura'
      const res = await fetch(`/api/hospital/config?hospitalId=${encodeURIComponent(hId)}&hospitalNome=${encodeURIComponent(hNome)}`)
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.config) {
          setConfigHospital(data.config)
        }
      }
    } catch (err) {
      console.error('Erro ao buscar configuração hospitalar:', err)
    } finally {
      setCarregandoConfig(false)
    }
  }

  // Checagem de sessão hospitalar
  const verificarSessaoHospital = async () => {
    try {
      setVerificandoAuth(true)
      const res = await fetch('/api/hospital/auth/me')
      const data = await res.json()
      if (data.authenticated && data.hospital) {
        setHospitalSessao(data.hospital)
        setAutenticadoHospital(true)
        if (data.hospital.hospital_id) {
          setUnidadeFiltro(data.hospital.hospital_id)
        }
        carregarConfigHospital(data.hospital.hospital_id, data.hospital.hospital_nome)
      } else {
        setAutenticadoHospital(false)
        carregarConfigHospital()
      }
    } catch (err) {
      console.error('Erro ao verificar sessão hospitalar:', err)
      setAutenticadoHospital(false)
    } finally {
      setVerificandoAuth(false)
    }
  }

  useEffect(() => {
    verificarSessaoHospital()
  }, [])

  // Login de Demonstração Homologado (Hospital Regional Dom Moura)
  const handleLoginRapido = async () => {
    setLoginRapidoLoading(true)
    try {
      const res = await fetch('/api/hospital/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'hospital.dommoura@cuidae.med.br',
          senha: 'Hospital@2026',
        }),
      })
      const data = await res.json()
      if (data.success && data.session) {
        setHospitalSessao(data.session)
        setAutenticadoHospital(true)
        setUnidadeFiltro(data.session.hospital_id)
        carregarConfigHospital(data.session.hospital_id, data.session.hospital_nome)
        await carregarPainel()
      }
    } catch (err) {
      console.error('Erro no login rápido de teste:', err)
    } finally {
      setLoginRapidoLoading(false)
    }
  }

  const handleLogoutHospital = async () => {
    try {
      await fetch('/api/hospital/auth/logout', { method: 'POST' })
    } catch (err) {
      // ignore
    }
    setHospitalSessao(null)
    setAutenticadoHospital(false)
    window.location.href = '/hospital/login'
  }

  // Gestão de Horários de Agendamento do Hospital
  const handleAdicionarHorario = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!novoHorario.trim()) {
      setFeedbackConfig({ tipo: 'erro', texto: 'Informe o horário a ser adicionado (ex: 08:30 ou 14:00).' })
      return
    }

    setSalvandoHorario(true)
    setFeedbackConfig(null)
    try {
      const targetId = hospitalSessao?.hospital_id || '7a1b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d'
      const res = await fetch('/api/hospital/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_horario',
          hospitalId: targetId,
          horario: novoHorario.trim(),
          turno: novoTurno,
          vagas: Number(novasVagas) || 3,
        }),
      })

      const data = await res.json()
      if (data.success && data.config) {
        setConfigHospital(data.config)
        setNovoHorario('')
        setFeedbackConfig({ tipo: 'sucesso', texto: `Horário ${novoHorario} cadastrado e liberado para os pacientes agendarem!` })
        setTimeout(() => setFeedbackConfig(null), 4000)
      } else {
        setFeedbackConfig({ tipo: 'erro', texto: data.error || 'Erro ao adicionar horário.' })
      }
    } catch (err: any) {
      setFeedbackConfig({ tipo: 'erro', texto: err.message || 'Erro de comunicação ao adicionar horário.' })
    } finally {
      setSalvandoHorario(false)
    }
  }

  const handleExcluirHorario = async (horarioId: string, horarioTexto: string) => {
    setExcluindoHorarioId(horarioId)
    setFeedbackConfig(null)
    try {
      const targetId = hospitalSessao?.hospital_id || '7a1b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d'
      const res = await fetch('/api/hospital/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_horario',
          hospitalId: targetId,
          horarioId,
        }),
      })

      const data = await res.json()
      if (data.success && data.config) {
        setConfigHospital(data.config)
        setFeedbackConfig({ tipo: 'sucesso', texto: `Horário ${horarioTexto} excluído da grade de agendamento.` })
        setTimeout(() => setFeedbackConfig(null), 4000)
      } else {
        setFeedbackConfig({ tipo: 'erro', texto: data.error || 'Erro ao excluir horário.' })
      }
    } catch (err: any) {
      setFeedbackConfig({ tipo: 'erro', texto: err.message || 'Erro ao conectar à API de horários.' })
    } finally {
      setExcluindoHorarioId(null)
    }
  }

  const handleAlternarTurno = async (turnoKey: 'manha' | 'tarde' | 'plantao_urgencia') => {
    if (!configHospital) return
    const turnosAtualizados = {
      ...configHospital.turnos_ativos,
      [turnoKey]: !configHospital.turnos_ativos[turnoKey],
    }

    try {
      const targetId = hospitalSessao?.hospital_id || '7a1b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d'
      const res = await fetch('/api/hospital/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_general',
          hospitalId: targetId,
          configUpdates: {
            turnos_ativos: turnosAtualizados,
          },
        }),
      })

      const data = await res.json()
      if (data.success && data.config) {
        setConfigHospital(data.config)
        setFeedbackConfig({ tipo: 'sucesso', texto: 'Turnos de atendimento atualizados com sucesso.' })
        setTimeout(() => setFeedbackConfig(null), 3000)
      }
    } catch (err) {
      console.error('Erro ao alternar turno:', err)
    }
  }

  const copiarEmailAdmin = () => {
    navigator.clipboard.writeText('murillokennedy12@gmail.com')
    setEmailCopiado(true)
    setTimeout(() => setEmailCopiado(false), 3000)
  }

  // Efeito sonoro / Chamada de voz do paciente
  const chamarPacienteVoz = (ag: AgendamentoHospitalar) => {
    if (!vozAtiva) return

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const texto = `Atenção. Paciente ${ag.paciente_nome}, comparecer ao ${consultorioAtivo}. Triagem prioridade ${ag.nivel_urgencia}.`
      const utterance = new SpeechSynthesisUtterance(texto)
      utterance.lang = 'pt-BR'
      utterance.rate = 0.95
      window.speechSynthesis.speak(utterance)
    }
  }

  const carregarPainel = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (unidadeFiltro !== 'todas') params.set('unidadeId', unidadeFiltro)
      if (statusFiltro !== 'todos') params.set('status', statusFiltro)
      if (urgenciaFiltro !== 'todas') params.set('urgencia', urgenciaFiltro)
      if (busca.trim()) params.set('busca', busca.trim())

      const res = await fetch(`/api/hospital/painel?${params.toString()}`)
      if (!res.ok) throw new Error('Não foi possível carregar a fila hospitalar')
      const data = await res.json()

      setAgendamentos(data.agendamentos || [])
      if (data.metricas) setMetricas(data.metricas)
      if (data.hospitais) setHospitais(data.hospitais)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Erro ao consultar fila hospitalar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarPainel()
  }, [unidadeFiltro, statusFiltro, urgenciaFiltro])

  // Atualizar status do paciente (Chamar, Em Atendimento, Concluir)
  const atualizarStatus = async (
    id: string,
    novoStatus: StatusAgendamentoHospital,
    ag?: AgendamentoHospitalar
  ) => {
    try {
      if (ag && novoStatus === 'em_atendimento') {
        chamarPacienteVoz(ag)
      }

      const res = await fetch(`/api/agendamentos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: novoStatus,
          chamado_em: novoStatus === 'em_atendimento' ? new Date().toISOString() : undefined,
          sala_atendimento: consultorioAtivo,
          medico_responsavel: 'Equipe de Acolhimento e Triagem Hospitalar',
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setAgendamentos((prev) =>
          prev.map((item) => (item.id === id ? data.agendamento : item))
        )
        if (pacienteSelecionado?.id === id) {
          setPacienteSelecionado(data.agendamento)
        }
        // Atualiza contadores
        carregarPainel()
      }
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
    }
  }

  // Salvar conduta médica
  const handleSalvarAnotacao = async () => {
    if (!pacienteSelecionado) return
    setSalvandoAnotacao(true)
    setSucessoAnotacao(false)

    try {
      const res = await fetch(`/api/agendamentos/${pacienteSelecionado.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: pacienteSelecionado.status,
          anotacoes_medicas: anotacaoMedica.trim(),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setPacienteSelecionado(data.agendamento)
        setAgendamentos((prev) =>
          prev.map((item) => (item.id === pacienteSelecionado.id ? data.agendamento : item))
        )
        setSucessoAnotacao(true)
        setTimeout(() => setSucessoAnotacao(false), 3000)
      }
    } catch (err) {
      console.error('Erro ao salvar anotação:', err)
    } finally {
      setSalvandoAnotacao(false)
    }
  }

  // Abre drawer do paciente
  const abrirProntuario = (ag: AgendamentoHospitalar) => {
    setPacienteSelecionado(ag)
    setAnotacaoMedica(ag.anotacoes_medicas || '')
    setSucessoAnotacao(false)
  }

  const urgenciaStyles = {
    vermelho: {
      border: 'border-red-300',
      bgBadge: 'bg-red-100 text-red-800 border-red-200',
      dot: 'bg-red-600',
      label: 'Emergência (Vermelho)',
    },
    amarelo: {
      border: 'border-amber-300',
      bgBadge: 'bg-amber-100 text-amber-800 border-amber-200',
      dot: 'bg-amber-500',
      label: 'Urgente (Amarelo)',
    },
    verde: {
      border: 'border-emerald-300',
      bgBadge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500',
      label: 'Pouco Urgente (Verde)',
    },
  }

  if (verificandoAuth) {
    return (
      <div className="max-w-4xl mx-auto py-24 px-4 text-center font-jakarta">
        <div className="inline-flex p-4 rounded-2xl bg-blue-50 text-blue-600 mb-4 animate-pulse">
          <Building2 className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Verificando credenciais hospitalares...</h2>
        <p className="text-sm text-slate-500 mt-1">Conectando ao barramento institucional de urgência Cuidaê</p>
      </div>
    )
  }

  if (!autenticadoHospital) {
    return (
      <div className="min-h-screen bg-slate-50/60 dark:bg-[#090e17] py-8 sm:py-12 px-4 transition-colors duration-200">
        <div className="max-w-2xl mx-auto animate-fade-in font-jakarta">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-6 sm:p-9 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#091426] to-slate-800 text-white flex items-center justify-center mx-auto shadow-md relative">
            <Building2 className="w-8 h-8 text-emerald-400" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center border-2 border-white dark:border-slate-900">
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 uppercase tracking-wider mb-3">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              Ambiente Exclusivo para Hospitais Homologados
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#091426] dark:text-white tracking-tight">
              Acesso Restrito ao Painel Hospitalar
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed max-w-lg mx-auto">
              Este painel realiza a gestão da fila de acolhimento de urgência, chamador de pacientes por voz e prontuários médicos transmitidos pela inteligência artificial do Cuidaê.
              <br /><br />
              Por sigilo médico e conformidade legal, o acesso é <strong>exclusivo para recepcionistas e equipes médicas autorizadas</strong>.
            </p>
          </div>

          {/* Card de Teste Imediato com 1 Clique */}
          <div className="bg-gradient-to-br from-blue-50/90 to-emerald-50/80 dark:from-blue-950/40 dark:to-emerald-950/30 border border-blue-200/80 dark:border-blue-900/60 rounded-2xl p-5 text-left shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Deseja testar este painel agora?
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white uppercase tracking-wider">
                Perfil de Teste Liberado
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
              Criamos e homologamos o perfil do <strong>Hospital Regional Dom Moura (HRDM)</strong> para você testar todas as funcionalidades:
            </p>
            <div className="bg-white/95 dark:bg-slate-800 rounded-xl p-3 text-xs font-mono text-slate-800 dark:text-slate-100 border border-blue-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <div><strong>E-mail:</strong> hospital.dommoura@cuidae.med.br</div>
                <div><strong>Senha:</strong> Hospital@2026</div>
              </div>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 font-sans font-semibold px-2 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                Dr. Roberto Albuquerque (Chefe de Triagem)
              </span>
            </div>

            <button
              type="button"
              onClick={handleLoginRapido}
              disabled={loginRapidoLoading}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition shadow-md disabled:opacity-70"
            >
              {loginRapidoLoading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  <span>Acessar com Perfil Homologado (Hospital Regional Dom Moura)</span>
                </>
              )}
            </button>
          </div>

          {/* Ações Secundárias */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
            <Link
              href="/hospital/login"
              className="px-5 py-3 rounded-xl bg-[#091426] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition shadow-xs"
            >
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>Acessar Portal Exclusivo do Hospital</span>
            </Link>

            <button
              type="button"
              onClick={() => setModalCredenciamentoAberto(true)}
              className="px-5 py-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition"
            >
              <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Credenciar Nova Unidade</span>
            </button>
          </div>
        </div>

        {/* Modal Informativo de Credenciamento */}
        {modalCredenciamentoAberto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200/80 relative">
              <button
                onClick={() => setModalCredenciamentoAberto(false)}
                className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Credenciamento de Unidade Hospitalar</h3>
                  <p className="text-xs text-slate-500">Liberação de acesso pelo administrador</p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-3 mb-4">
                <p className="leading-relaxed">
                  Para criar um novo perfil e conectar sua unidade hospitalar, é necessário entrar em contato direto com o administrador para validação do CNPJ e credenciamento oficial:
                </p>

                <div className="bg-white border border-amber-200 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono font-bold text-slate-800">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span>murillokennedy12@gmail.com</span>
                  </div>

                  <div className="flex items-center gap-1.5 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={copiarEmailAdmin}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-sans font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1 flex-1 sm:flex-none justify-center"
                    >
                      {emailCopiado ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{emailCopiado ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                    <a
                      href="mailto:murillokennedy12@gmail.com?subject=Credenciamento%20de%20Unidade%20Hospitalar%20-%20Cuida%C3%AA"
                      className="px-3 py-1.5 rounded-lg text-[11px] font-sans font-semibold bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1 flex-1 sm:flex-none justify-center"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir E-mail</span>
                    </a>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setModalCredenciamentoAberto(false)}
                  className="px-5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-[#090e17] px-4 sm:px-6 lg:px-8 py-6 sm:py-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-6 pb-20 font-jakarta animate-fade-in">
      
      {/* Barra de Status Institucional Superior */}
      <div className="bg-[#091426] text-white px-5 py-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              Barramento SISREG Conectado • {hospitalSessao?.hospital_nome || 'Hospital Regional Dom Moura'}
            </span>
          </div>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-xs text-slate-300 hidden sm:inline">
            Resp: {hospitalSessao?.responsavel_nome || 'Corpo Clínico'} ({hospitalSessao?.cargo || 'Triagem'})
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <ThemeToggle />

          <button
            onClick={() => setVozAtiva(!vozAtiva)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition ${
              vozAtiva
                ? 'bg-blue-500/20 text-blue-200 border-blue-400/30'
                : 'bg-white/10 text-slate-400 border-white/10'
            }`}
            title="Ativar ou desativar chamador de voz de pacientes"
          >
            {vozAtiva ? <Volume2 className="w-3.5 h-3.5 text-blue-300" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Chamador de Senhas: {vozAtiva ? 'Ligado' : 'Mudo'}</span>
          </button>

          <button
            onClick={handleLogoutHospital}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30 transition"
            title="Sair do Perfil Hospitalar"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair do Hospital</span>
          </button>

          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>App Paciente</span>
          </Link>
        </div>
      </div>

      {/* Header com Seletor de Hospital e Consultório */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-[#122748] text-white flex items-center justify-center shadow-md">
            <Building2 className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#091426] dark:text-white tracking-tight">
                Painel da Recepção e Triagem Hospitalar
              </h1>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-blue-100 dark:bg-blue-900/50 text-[#1a6edb] dark:text-blue-300">
                Hospital Connect
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Fila de acolhimento em tempo real com prontuário de inteligência artificial antecipado.
            </p>
          </div>
        </div>

        {/* Seletores da Equipe */}
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
              Hospital Ativo:
            </label>
            <select
              value={unidadeFiltro}
              onChange={(e) => setUnidadeFiltro(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-[#091426] dark:text-slate-100 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2b85ff]/30"
            >
              <option value="todas">Todos os Hospitais (Visão Geral)</option>
              {hospitais.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
              Consultório / Guichê:
            </label>
            <select
              value={consultorioAtivo}
              onChange={(e) => setConsultorioAtivo(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-[#091426] dark:text-slate-100 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2b85ff]/30"
            >
              <option value="Consultório 1 - Acolhimento">Consultório 1 - Acolhimento</option>
              <option value="Consultório 2 - Triagem Rápida">Consultório 2 - Triagem Rápida</option>
              <option value="Consultório 3 - Clínica Geral">Consultório 3 - Clínica Geral</option>
              <option value="Consultório 4 - Emergência">Consultório 4 - Emergência</option>
              <option value="Recepção Central - Guichê 1">Recepção Central - Guichê 1</option>
            </select>
          </div>
        </div>
      </div>

      {/* Abas Principais: Fila de Acolhimento vs Configurações & Horários */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          type="button"
          onClick={() => setAbaAtiva('fila')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs sm:text-sm transition-all ${
            abaAtiva === 'fila'
              ? 'border-[#2b85ff] text-[#2b85ff] dark:text-blue-400 bg-white dark:bg-slate-900 rounded-t-xl shadow-2xs'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Fila de Acolhimento & IA</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-[#1a6edb] dark:bg-blue-900/50 dark:text-blue-300 font-extrabold">
            {metricas.total}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva('configuracoes')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs sm:text-sm transition-all ${
            abaAtiva === 'configuracoes'
              ? 'border-[#2b85ff] text-[#2b85ff] dark:text-blue-400 bg-white dark:bg-slate-900 rounded-t-xl shadow-2xs'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Configurações & Horários de Agendamento</span>
          {configHospital?.horarios?.length ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold">
              {configHospital.horarios.length} horários
            </span>
          ) : null}
        </button>
      </div>

      {/* VIEW DE CONFIGURAÇÕES DO HOSPITAL & HORÁRIOS */}
      {abaAtiva === 'configuracoes' && (
        <div className="space-y-6 animate-fade-in">
          {/* Feedback Alertas */}
          {feedbackConfig && (
            <div
              className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-center justify-between gap-3 animate-fade-in ${
                feedbackConfig.tipo === 'sucesso'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {feedbackConfig.tipo === 'sucesso' ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400" />
                )}
                <span>{feedbackConfig.texto}</span>
              </div>
              <button
                type="button"
                onClick={() => setFeedbackConfig(null)}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 1. DADOS INSTITUCIONAIS DA UNIDADE */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/20 text-[#2b85ff] dark:text-blue-400 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#091426] dark:text-white">
                    {hospitalSessao?.hospital_nome || 'Hospital Regional Dom Moura'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    ID SISREG: {hospitalSessao?.hospital_id || '7a1b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d'} • Credenciado Cuidaê
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 self-start sm:self-auto">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Unidade Homologada
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700 space-y-1">
                <span className="text-slate-400 dark:text-slate-500 block font-semibold uppercase text-[10px]">Responsável Técnico</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  {hospitalSessao?.responsavel_nome || 'Dr. Roberto Albuquerque'} ({hospitalSessao?.cargo || 'Triagem'})
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700 space-y-1">
                <span className="text-slate-400 dark:text-slate-500 block font-semibold uppercase text-[10px]">E-mail de Contato</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 font-mono">
                  {hospitalSessao?.email || 'hospital.dommoura@cuidae.med.br'}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700 space-y-1">
                <span className="text-slate-400 dark:text-slate-500 block font-semibold uppercase text-[10px]">Tempo Médio Estimado</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  {configHospital?.tempo_medio_consulta_minutos || 20} minutos por acolhimento
                </span>
              </div>
            </div>
          </div>

          {/* 2. GESTÃO DE HORÁRIOS DE AGENDAMENTO (ADICIONAR / EXCLUIR) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#2b85ff]" />
                  <h3 className="text-base font-bold text-[#091426] dark:text-white">
                    Grade de Horários Disponíveis para Agendamento
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Adicione e exclua horários da agenda. As mudanças refletem imediatamente no formulário de agendamento online dos pacientes.
                </p>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-900/40 text-[#2b85ff] dark:text-blue-300 border border-blue-200 dark:border-blue-800 self-start sm:self-auto">
                {configHospital?.horarios?.length || 0} horários cadastrados
              </span>
            </div>

            {/* Formulário: Adicionar Novo Horário */}
            <form
              onSubmit={handleAdicionarHorario}
              className="bg-slate-50 dark:bg-slate-800/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-4"
            >
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#2b85ff]" />
                <h4 className="text-xs sm:text-sm font-bold text-[#091426] dark:text-white">
                  Adicionar Novo Horário à Agenda:
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Horário (HH:MM):
                  </label>
                  <input
                    type="text"
                    required
                    value={novoHorario}
                    onChange={(e) => setNovoHorario(e.target.value)}
                    placeholder="Ex: 08:30 ou 14:00"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-[#091426] dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2b85ff]/30 focus:border-[#2b85ff]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Turno:
                  </label>
                  <select
                    value={novoTurno}
                    onChange={(e) => setNovoTurno(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-semibold text-[#091426] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2b85ff]/30"
                  >
                    <option value="manha">Manhã (07h às 12h)</option>
                    <option value="tarde">Tarde (13h às 18h)</option>
                    <option value="plantao_urgencia">Plantão de Urgência 24h</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Vagas Simultâneas:
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={novasVagas}
                    onChange={(e) => setNovasVagas(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-[#091426] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2b85ff]/30"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={salvandoHorario}
                    className="w-full py-2 px-4 rounded-xl bg-[#2b85ff] hover:bg-blue-600 disabled:opacity-60 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    {salvandoHorario ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Adicionar Horário</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* Lista dos Horários Cadastrados */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Horários Ativos no Sistema:
              </h4>

              {carregandoConfig && (
                <div className="py-8 text-center space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#2b85ff] mx-auto" />
                  <p className="text-xs text-slate-400">Carregando grade de horários...</p>
                </div>
              )}

              {!carregandoConfig && (!configHospital?.horarios || configHospital.horarios.length === 0) && (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Nenhum horário cadastrado. Use o formulário acima para adicionar novos horários.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {configHospital?.horarios?.map((h: any) => {
                  const isExcluindo = excluindoHorarioId === h.id

                  const turnoBadges: Record<string, { label: string; color: string }> = {
                    manha: { label: 'Manhã', color: 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300' },
                    tarde: { label: 'Tarde', color: 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300' },
                    plantao_urgencia: { label: 'Plantão 24h', color: 'bg-red-100 dark:bg-red-950/70 text-red-800 dark:text-red-300' },
                  }
                  const badgeTurno = turnoBadges[h.turno] || turnoBadges.manha

                  return (
                    <div
                      key={h.id}
                      className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 shadow-2xs flex items-center justify-between gap-3 group hover:border-slate-300 dark:hover:border-slate-700 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-[#2b85ff]" />
                          <span className="font-bold text-sm text-[#091426] dark:text-white">
                            {h.horario}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <span className={`px-2 py-0.5 rounded-full font-bold ${badgeTurno.color}`}>
                            {badgeTurno.label}
                          </span>
                          <span className="text-slate-400 dark:text-slate-500">
                            {h.vagas} vagas
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleExcluirHorario(h.id, h.horario)}
                        disabled={isExcluindo}
                        title={`Excluir horário ${h.horario}`}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition border border-transparent hover:border-red-200 dark:hover:border-red-800 disabled:opacity-40"
                      >
                        {isExcluindo ? (
                          <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* 3. TURNOS HABILITADOS NA UNIDADE */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Sliders className="w-5 h-5 text-[#2b85ff]" />
              <h3 className="text-base font-bold text-[#091426] dark:text-white">
                Turnos de Atendimento Habilitados
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { key: 'manha', label: 'Turno da Manhã', desc: '07:00 às 12:00' },
                { key: 'tarde', label: 'Turno da Tarde', desc: '13:00 às 18:00' },
                { key: 'plantao_urgencia', label: 'Plantão Urgência 24h', desc: 'Atendimento contínuo' },
              ].map((t) => {
                const ativo = configHospital?.turnos_ativos?.[t.key] ?? true
                return (
                  <div
                    key={t.key}
                    onClick={() => handleAlternarTurno(t.key as any)}
                    className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                      ativo
                        ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 opacity-70'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#091426] dark:text-white">
                        {t.label}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{t.desc}</p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        ativo
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {ativo ? 'Ativo' : 'Pausado'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 4. RECURSOS DA RECEPÇÃO & MODO ESCURO */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Settings className="w-5 h-5 text-[#2b85ff]" />
              <h3 className="text-base font-bold text-[#091426] dark:text-white">
                Preferências da Recepção & Modo Escuro
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 flex items-center justify-between">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#091426] dark:text-white flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-[#2b85ff]" />
                    Chamador de Senhas por Voz
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Sintetiza voz em português ao chamar o paciente para a sala
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setVozAtiva(!vozAtiva)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                    vozAtiva
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {vozAtiva ? 'Ligado' : 'Mudo'}
                </button>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 flex items-center justify-between">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#091426] dark:text-white flex items-center gap-1.5">
                    <Moon className="w-4 h-4 text-indigo-500" />
                    Modo Escuro do Painel
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Alterna o tema visual para a recepção ou guichê
                  </p>
                </div>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW DA FILA DE ACOLHIMENTO E ATENDIMENTO */}
      {abaAtiva === 'fila' && (
        <>

      {/* CARDS DE MÉTRICAS HOSPITALARES */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase text-slate-400 dark:text-slate-500 block">Total Recebidos</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-[#091426] dark:text-white">{metricas.total}</span>
            <Users className="w-5 h-5 text-slate-400" />
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">Agendados pela rede</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/60 shadow-2xs space-y-1 bg-gradient-to-br from-amber-50/40 dark:from-amber-950/30 to-white dark:to-slate-900">
          <span className="text-[11px] font-bold uppercase text-amber-700 dark:text-amber-400 block">Aguardando</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-amber-900 dark:text-amber-300">{metricas.aguardando}</span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">Na sala de espera</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-blue-200 dark:border-blue-900/60 shadow-2xs space-y-1 bg-gradient-to-br from-blue-50/40 dark:from-blue-950/30 to-white dark:to-slate-900">
          <span className="text-[11px] font-bold uppercase text-blue-700 dark:text-blue-400 block">Em Atendimento</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-[#1a6edb] dark:text-blue-300">{metricas.emAtendimento}</span>
            <Stethoscope className="w-5 h-5 text-[#2b85ff]" />
          </div>
          <span className="text-[10px] text-blue-700 dark:text-blue-400 font-medium">Em consultório</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-red-200 dark:border-red-900/60 shadow-2xs space-y-1 bg-gradient-to-br from-red-50/40 dark:from-red-950/30 to-white dark:to-slate-900">
          <span className="text-[11px] font-bold uppercase text-red-700 dark:text-red-400 block">Emergência</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-red-700 dark:text-red-400">{metricas.urgentes}</span>
            <AlertOctagon className="w-5 h-5 text-red-500 animate-pulse" />
          </div>
          <span className="text-[10px] text-red-700 dark:text-red-400 font-bold">Manchester Vermelho</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/60 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase text-amber-600 dark:text-amber-400 block">Urgência</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{metricas.amarelos}</span>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">Manchester Amarelo</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 shadow-2xs space-y-1 bg-gradient-to-br from-emerald-50/40 dark:from-emerald-950/30 to-white dark:to-slate-900">
          <span className="text-[11px] font-bold uppercase text-emerald-700 dark:text-emerald-400 block">Concluídos</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-emerald-800 dark:text-emerald-300">{metricas.concluidos}</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">Atendidos hoje</span>
        </div>

      </div>

      {/* BARRA DE FILTROS E BUSCA */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Campo de Busca */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && carregarPainel()}
            placeholder="Buscar por paciente, protocolo, sintoma ou diagnóstico de IA..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-[#091426] dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2b85ff]/30 focus:border-[#2b85ff]"
          />
        </div>

        {/* Filtros em Abas Rápidas */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          <button
            onClick={() => setStatusFiltro('todos')}
            className={`px-3 py-1.5 rounded-xl transition ${
              statusFiltro === 'todos'
                ? 'bg-[#091426] dark:bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Todos
          </button>

          <button
            onClick={() => setStatusFiltro('agendado')}
            className={`px-3 py-1.5 rounded-xl transition ${
              statusFiltro === 'agendado'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Aguardando ({metricas.aguardando})
          </button>

          <button
            onClick={() => setStatusFiltro('em_atendimento')}
            className={`px-3 py-1.5 rounded-xl transition ${
              statusFiltro === 'em_atendimento'
                ? 'bg-[#2b85ff] text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Em Consulta ({metricas.emAtendimento})
          </button>

          <button
            onClick={() => setUrgenciaFiltro(urgenciaFiltro === 'vermelho' ? 'todas' : 'vermelho')}
            className={`px-3 py-1.5 rounded-xl transition border flex items-center gap-1 ${
              urgenciaFiltro === 'vermelho'
                ? 'bg-red-600 text-white border-red-600 shadow-xs'
                : 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-100'
            }`}
          >
            <AlertOctagon className="w-3 h-3" />
            Só Vermelhos ({metricas.urgentes})
          </button>

          <button
            onClick={carregarPainel}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition ml-1"
            title="Recarregar Fila"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

      </div>

      {/* FILA DE PACIENTES EM TEMPO REAL */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#2b85ff]" />
            <h3 className="font-extrabold text-base text-[#091426] dark:text-white">
              Fila de Acolhimento e Entrada de Pacientes
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              ({agendamentos.length} na fila filtrada)
            </span>
          </div>

          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
            Clique no paciente para abrir o prontuário de IA e registrar conduta médica
          </span>
        </div>

        {loading && (
          <div className="py-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#2b85ff] animate-spin mx-auto" />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Atualizando fila hospitalar em tempo real...</p>
          </div>
        )}

        {!loading && agendamentos.length === 0 && (
          <div className="py-16 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <h4 className="text-base font-bold text-slate-700 dark:text-slate-300">Fila livre ou nenhum paciente encontrado</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Não há pacientes pendentes para os filtros selecionados no momento.
            </p>
          </div>
        )}

        {!loading && agendamentos.length > 0 && (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {agendamentos.map((ag) => {
              const cfg = urgenciaStyles[ag.nivel_urgencia] || urgenciaStyles.amarelo
              const isEmAtendimento = ag.status === 'em_atendimento'
              const isConcluido = ag.status === 'concluido'

              return (
                <div
                  key={ag.id}
                  className={`p-5 sm:p-6 transition-all hover:bg-blue-50/30 dark:hover:bg-slate-800/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    isEmAtendimento ? 'bg-blue-50/40 dark:bg-blue-950/20 border-l-4 border-l-[#2b85ff]' : ''
                  }`}
                >
                  {/* Informações Principais do Paciente */}
                  <div className="space-y-2 flex-1 min-w-0">
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black text-[#2b85ff] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-lg border border-blue-100 dark:border-blue-900/60">
                        {ag.protocolo}
                      </span>

                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${cfg.bgBadge}`}>
                        <span className={`w-2 h-2 rounded-full ${cfg.dot}`}></span>
                        {cfg.label}
                      </span>

                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {ag.especialidade}
                      </span>

                      {isEmAtendimento && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-600 text-white animate-pulse">
                          <Stethoscope className="w-3 h-3" />
                          Em Consulta ({ag.sala_atendimento || consultorioAtivo})
                        </span>
                      )}

                      {isConcluido && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                          <Check className="w-3 h-3" />
                          Atendimento Concluído
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base sm:text-lg font-black text-[#091426] dark:text-white">
                          {ag.paciente_nome}
                        </h4>
                        <span className="text-xs text-slate-400 font-mono">
                          CPF: {ag.paciente_cpf}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Hospital de Destino: <strong className="text-slate-700 dark:text-slate-200">{ag.unidade_nome}</strong> • Contato: {ag.paciente_telefone}
                      </p>
                    </div>

                    {/* LAUDO DE IA E SINTOMAS EM DESTAQUE */}
                    <div className="bg-slate-50 dark:bg-slate-800/70 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-700 space-y-1.5 text-xs">
                      <div className="flex items-start gap-1.5">
                        <strong className="text-slate-700 dark:text-slate-300 shrink-0">📋 Sintomas Citados:</strong>
                        <span className="text-slate-700 dark:text-slate-300 italic font-medium">
                          "{ag.sintomas_citados}"
                        </span>
                      </div>

                      <div className="flex items-start gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#2b85ff] dark:text-blue-400 shrink-0 mt-0.5" />
                        <strong className="text-[#2b85ff] dark:text-blue-400 shrink-0">🧠 Hipótese IA (Infermedica + Gemini):</strong>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {ag.diagnostico_ia}
                        </span>
                      </div>

                      {ag.hipoteses_diagnosticas && ag.hipoteses_diagnosticas.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {ag.hipoteses_diagnosticas.map((h, idx) => (
                            <span key={idx} className="text-[10px] font-bold bg-blue-100/70 dark:bg-blue-950/80 text-[#2b85ff] dark:text-blue-300 px-2 py-0.5 rounded-md border border-blue-200/60 dark:border-blue-800/40">
                              {h.nome} ({h.probabilidade}%)
                            </span>
                          ))}
                        </div>
                      )}

                      {ag.anotacoes_medicas && (
                        <div className="flex items-start gap-1.5 pt-1 border-t border-slate-200/60 dark:border-slate-700 text-emerald-800 dark:text-emerald-300">
                          <strong className="shrink-0 font-bold">🩺 Conduta Médica Registrada:</strong>
                          <span className="line-clamp-1">{ag.anotacoes_medicas}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Data: {ag.data_agendamento}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Horário: {ag.horario}
                      </span>
                    </div>

                  </div>

                  {/* Ações da Equipe Médica e Enfermagem */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end gap-2 shrink-0">
                    
                    {/* Botão de Chamar Paciente (Voz + Status) */}
                    <button
                      type="button"
                      onClick={() => atualizarStatus(ag.id, 'em_atendimento', ag)}
                      className="px-4 py-2.5 bg-[#2b85ff] hover:bg-blue-600 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Chamar Paciente</span>
                    </button>

                    {/* Botão Concluir Atendimento */}
                    {isEmAtendimento && (
                      <button
                        type="button"
                        onClick={() => atualizarStatus(ag.id, 'concluido', ag)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1 whitespace-nowrap"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Concluir</span>
                      </button>
                    )}

                    {/* Botão Abrir Prontuário */}
                    <button
                      type="button"
                      onClick={() => abrirProntuario(ag)}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition flex items-center gap-1 whitespace-nowrap"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#2b85ff] dark:text-blue-400" />
                      <span>Abrir Prontuário IA</span>
                    </button>

                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
        </>
      )}

      {/* DRAWER / MODAL DE PRONTUÁRIO CLÍNICO DA IA SELECIONADO */}
      {pacienteSelecionado && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 p-6 sm:p-8 animate-scale-up">
            
            {/* Header do Prontuário */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black bg-blue-50 dark:bg-blue-950/60 text-[#2b85ff] dark:text-blue-400 px-2.5 py-1 rounded-xl border border-blue-100 dark:border-blue-900/60">
                    Prot: {pacienteSelecionado.protocolo}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                    pacienteSelecionado.nivel_urgencia === 'vermelho' ? 'bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300' :
                    pacienteSelecionado.nivel_urgencia === 'amarelo' ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300' :
                    'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                  }`}>
                    Manchester: {pacienteSelecionado.nivel_urgencia}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-[#091426] dark:text-white">
                  Prontuário de Triagem • {pacienteSelecionado.paciente_nome}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Documento: {pacienteSelecionado.paciente_cpf} • Tel: {pacienteSelecionado.paciente_telefone}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPacienteSelecionado(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ficha Clínica da IA na Íntegra */}
            <div className="space-y-4">
              
              <div className="bg-blue-50/60 dark:bg-blue-950/40 rounded-2xl p-4 border border-blue-100 dark:border-blue-900/60 space-y-2">
                <span className="text-xs font-extrabold uppercase text-[#2b85ff] dark:text-blue-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Hipótese Diagnóstica Preliminar (Infermedica + Gemini):
                </span>
                <p className="text-base font-bold text-[#091426] dark:text-white">
                  {pacienteSelecionado.diagnostico_ia}
                </p>

                {pacienteSelecionado.hipoteses_diagnosticas && pacienteSelecionado.hipoteses_diagnosticas.length > 0 && (
                  <div className="pt-2 border-t border-blue-200/60 dark:border-blue-900/40 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                      📊 Diagnóstico Diferencial (Motor Infermedica API):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {pacienteSelecionado.hipoteses_diagnosticas.map((h, i) => (
                        <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-[#2b85ff] dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          <span>• {h.nome}</span>
                          <span className="bg-blue-100 dark:bg-blue-950 px-1.5 py-0.5 rounded text-[11px] text-blue-700 dark:text-blue-300 font-extrabold">
                            {h.probabilidade}%
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Especialidade indicada: <strong>{pacienteSelecionado.especialidade}</strong> • Fonte: {pacienteSelecionado.fonte_ia}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/70 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700 space-y-1">
                <span className="text-xs font-extrabold uppercase text-slate-700 dark:text-slate-300 block">
                  📋 Sintomas Relatados pelo Paciente:
                </span>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed italic">
                  "{pacienteSelecionado.sintomas_citados}"
                </p>
              </div>

              {pacienteSelecionado.orientacao_ia && (
                <div className="bg-slate-50 dark:bg-slate-800/70 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700 space-y-1">
                  <span className="text-xs font-extrabold uppercase text-slate-700 dark:text-slate-300 block">
                    💡 Orientações Preliminares Emitidas:
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {pacienteSelecionado.orientacao_ia}
                  </p>
                </div>
              )}

              {/* Registro de Conduta Médica do Plantonista */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-extrabold text-[#091426] dark:text-slate-200 uppercase tracking-wider">
                  🩺 Evolução e Conduta da Equipe Médica no Hospital:
                </label>
                <textarea
                  rows={3}
                  value={anotacaoMedica}
                  onChange={(e) => setAnotacaoMedica(e.target.value)}
                  placeholder="Registre a conduta clínica: pressão arterial, medicação prescrita, exames laboratoriais solicitados..."
                  className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-[#091426] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2b85ff]/30 focus:border-[#2b85ff] resize-none"
                />

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleSalvarAnotacao}
                    disabled={salvandoAnotacao}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition"
                  >
                    {salvandoAnotacao ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Salvando Conduta...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Salvar no Prontuário</span>
                      </>
                    )}
                  </button>

                  {sucessoAnotacao && (
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Conduta médica salva com sucesso!
                    </span>
                  )}
                </div>
              </div>

            </div>

            {/* Botões do Rodapé do Modal */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => chamarPacienteVoz(pacienteSelecionado)}
                className="px-4 py-2.5 bg-blue-50 dark:bg-blue-950/60 text-[#2b85ff] dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
              >
                <Volume2 className="w-4 h-4" />
                <span>Chamar no Alto-Falante</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => atualizarStatus(pacienteSelecionado.id, 'concluido', pacienteSelecionado)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Concluir Atendimento</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      </div>
    </div>
  )
}
