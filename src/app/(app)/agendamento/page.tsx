'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  Building2,
  Stethoscope,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Send,
  Loader2,
  MapPin,
  Phone,
  ArrowLeft,
  ArrowRight,
  Info,
  User,
  FileText,
  Search,
  ExternalLink,
  ChevronRight,
  HeartPulse,
  Activity
} from 'lucide-react'
import type { UnidadeSaudeCompleta, NivelUrgencia } from '@/lib/types'

function AgendamentoContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const triagemIdParam = searchParams.get('triagemId') || ''
  const unidadeIdParam = searchParams.get('unidadeId') || ''
  const especialidadeParam = searchParams.get('especialidade') || ''
  const sintomasParam = searchParams.get('sintomas') || ''
  const diagnosticoParam = searchParams.get('diagnostico') || ''

  // Loading states
  const [carregandoDadosIniciais, setCarregandoDadosIniciais] = useState(true)
  const [unidades, setUnidades] = useState<UnidadeSaudeCompleta[]>([])
  const [triagensRecentes, setTriagensRecentes] = useState<any[]>([])

  // Formulário State
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<UnidadeSaudeCompleta | null>(null)
  const [buscaUnidade, setBuscaUnidade] = useState('')
  const [especialidade, setEspecialidade] = useState(especialidadeParam)
  const [dataAgendamento, setDataAgendamento] = useState('')
  const [horario, setHorario] = useState('08:30')
  const [turno, setTurno] = useState<'manha' | 'tarde' | 'plantao_urgencia'>('manha')
  const [tipoAtendimento, setTipoAtendimento] = useState<'presencial' | 'triagem_hospitalar' | 'retorno' | 'exame'>('presencial')
  const [observacoes, setObservacoes] = useState('')
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<string[]>([
    '08:00', '08:30', '09:15', '10:00', '10:45', '11:30',
    '13:30', '14:15', '15:00', '15:45', '16:30', '17:15'
  ])
  const [carregandoHorarios, setCarregandoHorarios] = useState(false)

  // Dados do Paciente
  const [pacienteNome, setPacienteNome] = useState('')
  const [pacienteCpf, setPacienteCpf] = useState('')
  const [pacienteTelefone, setPacienteTelefone] = useState('')
  const [pacienteEmail, setPacienteEmail] = useState('')

  // Dados da Triagem e Diagnóstico de IA
  const [triagemId, setTriagemId] = useState(triagemIdParam)
  const [sintomasCitados, setSintomasCitados] = useState(sintomasParam)
  const [diagnosticoIa, setDiagnosticoIa] = useState(diagnosticoParam)
  const [nivelUrgencia, setNivelUrgencia] = useState<NivelUrgencia>('amarelo')
  const [prioridadeIa, setPrioridadeIa] = useState('Alta')
  const [orientacaoIa, setOrientacaoIa] = useState('')
  const [fonteIa, setFonteIa] = useState('Google Gemini 3.8 Flash (Protocolo Cuidaê)')

  // Estado da Análise rápida de IA no próprio formulário
  const [analisandoIa, setAnalisandoIa] = useState(false)
  const [mensagemIa, setMensagemIa] = useState('')

  // Estado de Submissão e Transmissão
  const [etapaTransmissao, setEtapaTransmissao] = useState<'ocioso' | 'conectando' | 'transmitindo' | 'concluido'>('ocioso')
  const [erroEnvio, setErroEnvio] = useState<string | null>(null)

  // Definir data mínima como amanhã
  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().split('T')[0]

  // Carregar Unidades de Saúde e Dados da Triagem
  useEffect(() => {
    async function inicializar() {
      setCarregandoDadosIniciais(true)
      try {
        // 1. Carrega unidades
        const resUnidades = await fetch('/api/unidades')
        if (resUnidades.ok) {
          const dataUnidades = await resUnidades.json()
          const lista: UnidadeSaudeCompleta[] = dataUnidades.unidades || []
          setUnidades(lista)

          if (unidadeIdParam) {
            const encontrada = lista.find(
              (u) => u.id === unidadeIdParam || u.nome.toLowerCase().includes(unidadeIdParam.toLowerCase())
            )
            if (encontrada) setUnidadeSelecionada(encontrada)
          } else {
            // Default: Primeiro hospital de referência (ex: HRDM)
            const hospitalPrincipal = lista.find((u) => u.categoria === 'hospital') || lista[0]
            if (hospitalPrincipal) setUnidadeSelecionada(hospitalPrincipal)
          }
        }

        // 2. Se houver triagemIdParam, carregar dados detalhados da triagem
        if (triagemIdParam) {
          try {
            const resTriagem = await fetch(`/api/triage/resultado/${triagemIdParam}`)
            if (resTriagem.ok) {
              const dadosTriagem = await resTriagem.json()
              if (dadosTriagem) {
                setSintomasCitados(dadosTriagem.sintoma_principal || '')
                setDiagnosticoIa(dadosTriagem.recomendacao || dadosTriagem.explicacao || '')
                setNivelUrgencia(dadosTriagem.nivel_urgencia || 'amarelo')
                setOrientacaoIa(dadosTriagem.orientacao || dadosTriagem.explicacao || '')
                if (dadosTriagem.especialidade) setEspecialidade(dadosTriagem.especialidade)
                if (dadosTriagem.fonteIA) setFonteIa(dadosTriagem.fonteIA)
              }
            }
          } catch (e) {
            console.warn('Falha ao carregar triagem por ID:', e)
          }
        }

        // 3. Tenta carregar perfil do paciente
        try {
          const resPerfil = await fetch('/api/agendamentos')
          // apenas verifica conexão
        } catch {
          // ignore
        }
      } catch (err) {
        console.error('Erro na inicialização do agendamento:', err)
      } finally {
        setCarregandoDadosIniciais(false)
      }
    }

    inicializar()
  }, [triagemIdParam, unidadeIdParam, especialidadeParam])

  // Se a unidade mudar e não houver especialidade selecionada, adotar a primeira disponível nela
  useEffect(() => {
    if (unidadeSelecionada && Array.isArray(unidadeSelecionada.especialidades) && unidadeSelecionada.especialidades.length > 0) {
      if (!especialidade || !unidadeSelecionada.especialidades.includes(especialidade)) {
        setEspecialidade(unidadeSelecionada.especialidades[0])
      }
    }
  }, [unidadeSelecionada])

  // Sincroniza em tempo real com a grade de horários configurada pela unidade hospitalar
  useEffect(() => {
    async function carregarHorariosHospital() {
      if (!unidadeSelecionada?.id) return
      try {
        setCarregandoHorarios(true)
        const res = await fetch(
          `/api/hospital/config?hospitalId=${encodeURIComponent(unidadeSelecionada.id)}&hospitalNome=${encodeURIComponent(unidadeSelecionada.nome)}`
        )
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.config?.horarios && Array.isArray(data.config.horarios)) {
            const ativos = data.config.horarios
              .filter((h: any) => h.ativo !== false)
              .map((h: any) => h.horario)
            if (ativos.length > 0) {
              setHorariosDisponiveis(ativos)
              if (!ativos.includes(horario)) {
                setHorario(ativos[0])
              }
            }
          }
        }
      } catch (e) {
        console.warn('Falha ao obter horários configurados pelo hospital, mantendo grade padrão:', e)
      } finally {
        setCarregandoHorarios(false)
      }
    }
    carregarHorariosHospital()
  }, [unidadeSelecionada])

  // Filtrar unidades na busca
  const unidadesFiltradas = unidades.filter((u) => {
    if (!buscaUnidade.trim()) return true
    const q = buscaUnidade.toLowerCase()
    return (
      u.nome.toLowerCase().includes(q) ||
      u.tipo_label.toLowerCase().includes(q) ||
      u.bairro?.toLowerCase().includes(q) ||
      u.especialidades?.some((e) => e.toLowerCase().includes(q))
    )
  })

  // Disparar análise da IA caso o paciente não venha de triagem prévia
  const handleAnalisarComIA = async () => {
    if (!sintomasCitados || sintomasCitados.trim().length < 5) {
      alert('Por favor, descreva seus sintomas detalhadamente para a IA avaliar.')
      return
    }

    setAnalisandoIa(true)
    setMensagemIa('')
    try {
      const res = await fetch('/api/triage/symptoms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sintoma: sintomasCitados.trim(), camada: 'Gratuito' }),
      })

      if (!res.ok) throw new Error('Falha na resposta do assistente de triagem')
      const data = await res.json()

      if (data.triagem) {
        setDiagnosticoIa(data.triagem.recomendacao || 'Avaliação clínica recomendada')
        setNivelUrgencia(data.triagem.nivel_urgencia || 'amarelo')
        setPrioridadeIa(data.triagem.prioridade || 'Alta')
        setOrientacaoIa(data.triagem.orientacao || data.texto || '')
        if (data.triagem.especialidade) setEspecialidade(data.triagem.especialidade)
        if (data.fonteIA) setFonteIa(data.fonteIA)
        if (data.id) setTriagemId(data.id)
        setMensagemIa('Diagnóstico e condutas clínicas gerados com sucesso pela IA!')
      }
    } catch (err: any) {
      alert(`Não foi possível analisar com a IA agora: ${err.message}. Você pode preencher manualmente.`)
    } finally {
      setAnalisandoIa(false)
    }
  }

  // Enviar Agendamento e Transmitir ao Hospital
  const handleSubmitAgendamento = async (e: React.FormEvent) => {
    e.preventDefault()
    setErroEnvio(null)

    if (!unidadeSelecionada) {
      setErroEnvio('Selecione um hospital ou unidade de saúde de destino.')
      return
    }

    if (!dataAgendamento) {
      setErroEnvio('Selecione a data desejada para o atendimento.')
      return
    }

    if (!pacienteNome.trim()) {
      setErroEnvio('Informe o nome completo do paciente.')
      return
    }

    if (!sintomasCitados.trim()) {
      setErroEnvio('Descreva os sintomas do paciente que serão transmitidos à equipe do hospital.')
      return
    }

    if (!diagnosticoIa.trim()) {
      setErroEnvio('Clique no botão "Analisar Sintomas com IA" ou informe a hipótese diagnóstica.')
      return
    }

    // Iniciar animação de transmissão hospitalar
    setEtapaTransmissao('conectando')

    try {
      await new Promise((r) => setTimeout(r, 600))
      setEtapaTransmissao('transmitindo')

      const payload = {
        triagem_id: triagemId || undefined,
        unidade_id: unidadeSelecionada.id,
        unidade_nome: unidadeSelecionada.nome,
        unidade_tipo: unidadeSelecionada.categoria || 'hospital',
        unidade_endereco: unidadeSelecionada.endereco,
        unidade_bairro: unidadeSelecionada.bairro || '',
        unidade_cidade: unidadeSelecionada.cidade || 'Garanhuns',
        unidade_uf: unidadeSelecionada.uf || 'PE',
        unidade_telefone: unidadeSelecionada.telefone,
        especialidade: especialidade || 'Clínica Geral',
        data_agendamento: dataAgendamento,
        horario,
        turno,
        tipo_atendimento: tipoAtendimento,
        observacoes_paciente: observacoes,
        paciente_nome: pacienteNome.trim(),
        paciente_cpf: pacienteCpf.trim() || 'Não informado',
        paciente_telefone: pacienteTelefone.trim() || '(87) 99999-0000',
        paciente_email: pacienteEmail.trim() || '',
        sintomas_citados: sintomasCitados.trim(),
        diagnostico_ia: diagnosticoIa.trim(),
        nivel_urgencia: nivelUrgencia,
        prioridade: prioridadeIa,
        orientacao_ia: orientacaoIa.trim() || 'Apresentar documento de identificação na recepção central.',
        especialidade_recomendada_ia: especialidade,
        fonte_ia: fonteIa,
        resumo_clinico_hospital: `Paciente: ${pacienteNome.trim()} • Sintomas Citados: "${sintomasCitados.trim()}" • Diagnóstico Preliminar IA: "${diagnosticoIa.trim()}" • Manchester: ${nivelUrgencia.toUpperCase()} • Especialidade: ${especialidade} • Cuidados Preliminares: ${orientacaoIa.trim()}`,
      }

      const res = await fetch('/api/agendamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao processar agendamento hospitalar.')
      }

      setEtapaTransmissao('concluido')
      await new Promise((r) => setTimeout(r, 800))

      // Redireciona para o comprovante de transmissão
      router.push(`/agendamento/confirmacao/${data.agendamento.id}`)
    } catch (err: any) {
      console.error(err)
      setEtapaTransmissao('ocioso')
      setErroEnvio(err.message || 'Falha de comunicação com o servidor. Tente novamente.')
    }
  }

  const urgenciaBadgeConfig = {
    verde: { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500', label: 'Prioridade Verde (Pouco Urgente)' },
    amarelo: { bg: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500', label: 'Prioridade Amarela (Urgente)' },
    vermelho: { bg: 'bg-red-50 text-red-800 border-red-200', dot: 'bg-red-500', label: 'Prioridade Vermelha (Emergência)' },
  }

  const urgenciaAtual = urgenciaBadgeConfig[nivelUrgencia] || urgenciaBadgeConfig.amarelo

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-16 font-jakarta">
      
      {/* Header com Navegação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/triagem"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#2b85ff] transition mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Triagem
          </Link>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-blue-50 text-[#2b85ff] rounded-xl shadow-xs">
              <Calendar className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#091426] tracking-tight">
                Agendamento Hospitalar Integrado
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Envio direto do agendamento com os <strong>sintomas</strong> e o <strong>diagnóstico da inteligência artificial</strong> para o hospital.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/agendamento/meus-agendamentos"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl border border-slate-200 shadow-xs transition self-start sm:self-auto"
        >
          <FileText className="w-4 h-4 text-[#2b85ff]" />
          Meus Agendamentos
        </Link>
      </div>

      {/* Banner Informativo de Integração Hospitalar */}
      <div className="bg-gradient-to-r from-blue-900 via-[#122748] to-[#091426] rounded-2xl p-6 sm:p-7 text-white shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-blue-100 backdrop-blur-md border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            Barramento de Saúde Conectado ao SISREG
          </div>
          <h2 className="text-xl sm:text-2xl font-bold">
            Como funciona o envio para o hospital?
          </h2>
          <p className="text-sm text-blue-100/90 leading-relaxed">
            Ao confirmar este agendamento, nossa plataforma gera um <strong>prontuário pré-hospitalar digital</strong>. A equipe médica e a recepção da unidade receberão antecipadamente seus <strong>sintomas descritos</strong>, o <strong>diagnóstico preliminar da IA</strong> e a <strong>classificação de risco</strong> para agilizar sua entrada sem filas desnecessárias.
          </p>
        </div>
        <div className="absolute right-4 bottom-0 opacity-10 pointer-events-none hidden sm:block">
          <Building2 className="w-56 h-56 text-white" />
        </div>
      </div>

      {erroEnvio && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl flex items-center gap-3 text-sm font-semibold animate-shake">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <p>{erroEnvio}</p>
        </div>
      )}

      {/* Formulário Principal em Duas Colunas */}
      <form onSubmit={handleSubmitAgendamento} className="space-y-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* COLUNA ESQUERDA (7 colunas): Configuração do Agendamento */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 1. SELEÇÃO DA UNIDADE / HOSPITAL */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-500/20 text-[#2b85ff] dark:text-blue-400 font-bold text-xs flex items-center justify-center">1</span>
                  <h3 className="font-bold text-base text-[#091426] dark:text-white">Escolha o Hospital ou Unidade de Saúde</h3>
                </div>
                <span className="text-xs text-slate-400">Garanhuns e Região</span>
              </div>

              {/* Campo de Busca Rápida de Unidade */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={buscaUnidade}
                  onChange={(e) => setBuscaUnidade(e.target.value)}
                  placeholder="Buscar hospital, policlínica ou posto..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-[#091426] dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2b85ff]/30 focus:border-[#2b85ff]"
                />
              </div>

              {/* Lista Selecionável de Hospitais */}
              <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1 no-scrollbar">
                {unidadesFiltradas.slice(0, 8).map((u) => {
                  const isSelected = unidadeSelecionada?.id === u.id
                  return (
                    <div
                      key={u.id}
                      onClick={() => setUnidadeSelecionada(u)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#2b85ff] dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 ring-2 ring-[#2b85ff]/20 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-[#091426] dark:text-white">{u.nome}</h4>
                            {u.categoria === 'hospital' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/50 text-[#1a6edb] dark:text-blue-300">
                                Hospital
                              </span>
                            )}
                            {u.sus_gratuito && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                                100% SUS
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                            {u.endereco} • <span className="font-semibold text-slate-700 dark:text-slate-300">{u.bairro}</span>
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <span className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-[#2b85ff] border-[#2b85ff] text-white' : 'border-slate-300 dark:border-slate-600'
                          }`}>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {unidadeSelecionada && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-[#2b85ff]" />
                    {unidadeSelecionada.horario} • Tel: {unidadeSelecionada.telefone}
                  </span>
                  <a
                    href={unidadeSelecionada.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#2b85ff] dark:text-blue-400 font-semibold hover:underline flex items-center gap-0.5"
                  >
                    Ver Rota <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* 2. DATA, HORÁRIO E ESPECIALIDADE */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-500/20 text-[#2b85ff] dark:text-blue-400 font-bold text-xs flex items-center justify-center">2</span>
                <h3 className="font-bold text-base text-[#091426] dark:text-white">Data, Horário e Especialidade</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Data da Consulta / Atendimento: *
                  </label>
                  <input
                    type="date"
                    required
                    min={minDateStr}
                    value={dataAgendamento}
                    onChange={(e) => setDataAgendamento(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-[#091426] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2b85ff]/30 focus:border-[#2b85ff]"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Dias úteis e plantões disponíveis</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Especialidade Médica: *
                  </label>
                  <select
                    value={especialidade}
                    onChange={(e) => setEspecialidade(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-[#091426] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2b85ff]/30 focus:border-[#2b85ff]"
                  >
                    {unidadeSelecionada?.especialidades && unidadeSelecionada.especialidades.length > 0 ? (
                      unidadeSelecionada.especialidades.map((esp, i) => (
                        <option key={i} value={esp}>{esp}</option>
                      ))
                    ) : (
                      <>
                        <option value="Clínica Geral">Clínica Geral / Medicina da Família</option>
                        <option value="Urgência e Emergência">Urgência e Emergência</option>
                        <option value="Pediatria">Pediatria</option>
                        <option value="Cardiologia">Cardiologia</option>
                        <option value="Ortopedia">Ortopedia</option>
                        <option value="Dermatologia">Dermatologia</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Seleção de Horários */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Horário de Preferência:
                  </label>
                  {carregandoHorarios ? (
                    <span className="text-[11px] text-[#2b85ff] flex items-center gap-1 font-medium">
                      <Loader2 className="w-3 h-3 animate-spin" /> Atualizando horários da unidade...
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">
                      {horariosDisponiveis.length} horários disponíveis
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {horariosDisponiveis.map((h) => {
                    const isSelected = horario === h
                    return (
                      <button
                        type="button"
                        key={h}
                        onClick={() => {
                          setHorario(h)
                          const horaNum = parseInt(h.split(':')[0], 10)
                          if (h.toLowerCase().includes('plantão') || h.toLowerCase().includes('plantao')) {
                            setTurno('plantao_urgencia')
                          } else if (horaNum < 12) {
                            setTurno('manha')
                          } else {
                            setTurno('tarde')
                          }
                        }}
                        className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all text-center ${
                          isSelected
                            ? 'bg-[#2b85ff] border-[#2b85ff] text-white shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80'
                        }`}
                      >
                        {h}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Observações para a Recepção ou Equipe Médica (opcional):
                </label>
                <input
                  type="text"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Ex: Preciso de auxílio de locomoção, uso cadeira de rodas..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-[#091426] dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2b85ff]/30 focus:border-[#2b85ff]"
                />
              </div>
            </div>

            {/* 3. DADOS DO PACIENTE */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-500/20 text-[#2b85ff] dark:text-blue-400 font-bold text-xs flex items-center justify-center">3</span>
                <h3 className="font-bold text-base text-[#091426] dark:text-white">Identificação do Paciente</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nome Completo do Paciente: *
                  </label>
                  <input
                    type="text"
                    required
                    value={pacienteNome}
                    onChange={(e) => setPacienteNome(e.target.value)}
                    placeholder="Ex: Maria José de Oliveira"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-[#091426] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2b85ff]/30 focus:border-[#2b85ff]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    CPF ou Cartão Nacional de Saúde (CNS SUS):
                  </label>
                  <input
                    type="text"
                    value={pacienteCpf}
                    onChange={(e) => setPacienteCpf(e.target.value)}
                    placeholder="000.000.000-00 ou nº SUS"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-[#091426] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2b85ff]/30 focus:border-[#2b85ff]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Telefone de Contato / WhatsApp: *
                  </label>
                  <input
                    type="tel"
                    required
                    value={pacienteTelefone}
                    onChange={(e) => setPacienteTelefone(e.target.value)}
                    placeholder="(87) 90000-0000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-[#091426] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2b85ff]/30 focus:border-[#2b85ff]"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* COLUNA DIREITA (5 colunas): Ficha Clínica de IA Transmitida */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-900 rounded-2xl border border-blue-200/80 dark:border-slate-800 p-6 shadow-sm space-y-5 sticky top-24">
              
              <div className="flex items-center justify-between border-b border-blue-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#2b85ff] text-white flex items-center justify-center shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-[#091426] dark:text-white">
                      Ficha Clínica da IA
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Transmissão Direta ao Hospital</p>
                  </div>
                </div>

                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${urgenciaAtual.bg}`}>
                  <span className={`w-2 h-2 rounded-full ${urgenciaAtual.dot} animate-pulse`}></span>
                  {nivelUrgencia === 'vermelho' ? 'Emergência' : nivelUrgencia === 'amarelo' ? 'Urgente' : 'Normal'}
                </span>
              </div>

              {/* Bloco de Sintomas Citados */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-[#091426] dark:text-slate-200 uppercase tracking-wider flex items-center justify-between">
                  <span>📋 Sintomas Citados pelo Paciente:</span>
                  <span className="text-[10px] text-slate-400 font-normal">Será enviado ao médico</span>
                </label>
                <textarea
                  rows={3}
                  value={sintomasCitados}
                  onChange={(e) => setSintomasCitados(e.target.value)}
                  placeholder="Descreva aqui o que está sentindo (ex: febre alta persistente há 2 dias, náusea e dor atrás dos olhos)..."
                  className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-[#091426] dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2b85ff]/30 focus:border-[#2b85ff] bg-white dark:bg-slate-800 resize-none"
                  required
                />

                {/* Botão para Acionar a IA caso ainda não tenha diagnóstico */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleAnalisarComIA}
                    disabled={analisandoIa}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/30 text-[#2b85ff] dark:text-blue-300 text-xs font-bold rounded-xl border border-blue-200 dark:border-blue-500/30 transition"
                  >
                    {analisandoIa ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Avaliando com IA...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Atualizar Diagnóstico com IA</span>
                      </>
                    )}
                  </button>
                  <span className="text-[10px] text-slate-400">Google Gemini Flash</span>
                </div>

                {mensagemIa && (
                  <p className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 p-2 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {mensagemIa}
                  </p>
                )}
              </div>

              {/* Bloco de Diagnóstico e Hipótese Clínica de IA */}
              <div className="space-y-3 bg-white dark:bg-slate-800/90 p-4 rounded-2xl border border-blue-100 dark:border-slate-700 shadow-xs">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                    🧠 Hipótese Diagnóstica Gerada pela IA:
                  </span>
                  <input
                    type="text"
                    value={diagnosticoIa}
                    onChange={(e) => setDiagnosticoIa(e.target.value)}
                    placeholder="Ex: Suspeita de Arbovirose / Dengue Clássica"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-bold text-[#091426] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2b85ff]/30"
                    required
                  />
                </div>

                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                    🚦 Classificação de Risco (Manchester):
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['verde', 'amarelo', 'vermelho'] as NivelUrgencia[]).map((nv) => {
                      const isSel = nivelUrgencia === nv
                      return (
                        <button
                          type="button"
                          key={nv}
                          onClick={() => setNivelUrgencia(nv)}
                          className={`py-1.5 text-xs font-bold rounded-xl border transition-all capitalize ${
                            isSel
                              ? nv === 'vermelho'
                                ? 'bg-red-600 border-red-600 text-white'
                                : nv === 'amarelo'
                                ? 'bg-amber-500 border-amber-500 text-white'
                                : 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {nv}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {orientacaoIa && (
                  <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700 leading-relaxed">
                    <strong className="text-slate-800 dark:text-white block mb-0.5">💡 Conduta e Cuidados Imediatos:</strong>
                    {orientacaoIa}
                  </div>
                )}
              </div>

              {/* Resumo da Transmissão */}
              <div className="space-y-2 border-t border-blue-100 dark:border-slate-800 pt-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Destino Hospitalar:</span>
                  <strong className="text-[#091426] dark:text-white text-right line-clamp-1">
                    {unidadeSelecionada?.nome || 'Hospital a definir'}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Protocolo Prévio:</span>
                  <span className="font-mono text-[11px] font-bold text-[#2b85ff] dark:text-blue-400">
                    HOSP-GRH-2026-AUTOMÁTICO
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Canal de Transmissão:</span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Barramento SUS Cuidaê</span>
                </div>
              </div>

              {/* Botão de Envio e Transmissão ao Hospital */}
              <button
                type="submit"
                disabled={etapaTransmissao !== 'ocioso'}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-[#2b85ff] to-[#1a6edb] hover:from-blue-600 hover:to-blue-700 disabled:opacity-60 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 transform active:scale-95"
              >
                {etapaTransmissao === 'conectando' && (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Conectando ao Hospital...</span>
                  </>
                )}
                {etapaTransmissao === 'transmitindo' && (
                  <>
                    <HeartPulse className="w-5 h-5 animate-pulse" />
                    <span>Transmitindo Diagnóstico e Sintomas...</span>
                  </>
                )}
                {etapaTransmissao === 'concluido' && (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                    <span>Agendamento Confirmado!</span>
                  </>
                )}
                {etapaTransmissao === 'ocioso' && (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Confirmar e Enviar ao Hospital</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-center text-slate-400">
                🔒 Seus dados e laudo clínico são transmitidos em conformidade com a LGPD e o protocolo de regulação hospitalar.
              </p>

            </div>

          </div>

        </div>

      </form>

    </div>
  )
}

export default function AgendamentoPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto py-16 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#2b85ff] animate-spin mx-auto" />
          <p className="text-sm text-slate-500 font-medium">Carregando módulo de agendamento hospitalar...</p>
        </div>
      }
    >
      <AgendamentoContent />
    </Suspense>
  )
}
