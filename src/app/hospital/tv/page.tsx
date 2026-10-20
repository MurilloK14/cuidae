'use client'
import { falarTexto } from '@/lib/utils/speech'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Building2,
  Clock,
  Calendar,
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Bell,
  RefreshCw
} from 'lucide-react'
import type { AgendamentoHospitalar } from '@/lib/types'

export default function HospitalTVPage() {
  const [agendamentos, setAgendamentos] = useState<AgendamentoHospitalar[]>([])
  const [hospitais, setHospitais] = useState<any[]>([])
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<string>('todas')
  const [loading, setLoading] = useState(true)
  const [audioAtivo, setAudioAtivo] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [dataHoraAtual, setDataHoraAtual] = useState(new Date())

  // Paciente em destaque na chamada principal
  const [pacienteEmDestaque, setPacienteEmDestaque] = useState<AgendamentoHospitalar | null>(null)
  const [ultimasChamadas, setUltimasChamadas] = useState<AgendamentoHospitalar[]>([])

  // Ref para controlar chamadas já anunciadas
  const ultimoChamadoIdRef = useRef<string | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)

  // Atualização do relógio digital a cada 1 segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setDataHoraAtual(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Inicialização do Web Audio API para tocar o Chime de hospital
  const tocarChimeHospital = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return

      if (!audioCtxRef.current || audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current = new AudioCtx()
      }
      const ctx = audioCtxRef.current
      if (ctx.state === 'suspended') {
        ctx.resume()
      }

      const now = ctx.currentTime
      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const osc3 = ctx.createOscillator()
      const gain = ctx.createGain()

      // Tons harmônicos agradáveis de chamada hospitalar (Dó5 - Mi5 - Sol5)
      osc1.frequency.setValueAtTime(523.25, now) // C5
      osc1.frequency.setValueAtTime(659.25, now + 0.18) // E5
      osc1.frequency.setValueAtTime(783.99, now + 0.36) // G5

      osc2.frequency.setValueAtTime(1046.5, now) // C6
      osc2.frequency.setValueAtTime(1318.5, now + 0.18) // E6
      osc2.frequency.setValueAtTime(1567.98, now + 0.36) // G6

      gain.gain.setValueAtTime(0.18, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2)

      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(ctx.destination)

      osc1.start(now)
      osc2.start(now)
      osc1.stop(now + 1.2)
      osc2.stop(now + 1.2)
    } catch (e) {
      console.warn('Erro ao reproduzir chime sintetizado:', e)
    }
  }

  // Sintetizador de voz em Português
  const anunciarChamadaVoz = (ag: AgendamentoHospitalar) => {
    if (!audioAtivo || typeof window === 'undefined') return

    tocarChimeHospital()

    // Aguarda o chime soar antes de falar
    setTimeout(() => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
        const sala = ag.sala_atendimento || 'Recepção e Triagem'
        const texto = `Atenção. Paciente ${ag.paciente_nome}, comparecer ao ${sala}.`
        falarTexto(texto, { rate: 0.96, pitch: 1.02 })
      }
    }, 700)
  }

  // Consulta à fila hospitalar
  const consultarFila = async (isManual = false) => {
    try {
      const params = new URLSearchParams()
      if (unidadeSelecionada !== 'todas') {
        params.set('unidadeId', unidadeSelecionada)
      }

      const res = await fetch(`/api/hospital/painel?${params.toString()}`)
      if (!res.ok) return
      const data = await res.json()

      const lista: AgendamentoHospitalar[] = data.agendamentos || []
      setAgendamentos(lista)
      if (data.hospitais) setHospitais(data.hospitais)

      // Identifica pacientes em atendimento ou chamados
      const emAtendimento = lista.filter((a) => a.status === 'em_atendimento')

      // Ordena pelo chamado mais recente
      emAtendimento.sort((a, b) => {
        const timeA = new Date(a.chamado_em || a.updated_at || a.created_at).getTime()
        const timeB = new Date(b.chamado_em || b.updated_at || b.created_at).getTime()
        return timeB - timeA
      })

      const pacienteAtual = emAtendimento[0] || null

      if (pacienteAtual) {
        setPacienteEmDestaque(pacienteAtual)
        setUltimasChamadas(emAtendimento.slice(1, 6))

        // Se o paciente chamado for novo e não for a primeira carga passiva
        if (
          pacienteAtual.id !== ultimoChamadoIdRef.current &&
          ultimoChamadoIdRef.current !== null
        ) {
          anunciarChamadaVoz(pacienteAtual)
        }
        ultimoChamadoIdRef.current = pacienteAtual.id
      } else if (lista.length > 0 && !pacienteEmDestaque) {
        // Fallback: exibe o primeiro da fila caso ninguém tenha sido chamado ainda
        setPacienteEmDestaque(lista[0])
        setUltimasChamadas(lista.slice(1, 6))
        ultimoChamadoIdRef.current = lista[0].id
      }
    } catch (err) {
      console.error('Erro ao atualizar tela de TV:', err)
    } finally {
      setLoading(false)
    }
  }

  // Polling automático a cada 4 segundos
  useEffect(() => {
    consultarFila()
    const interval = setInterval(() => {
      consultarFila()
    }, 4000)
    return () => clearInterval(interval)
  }, [unidadeSelecionada])

  // Alternar tela cheia
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  // Testar chamada manualmente
  const testarChamada = () => {
    if (pacienteEmDestaque) {
      anunciarChamadaVoz(pacienteEmDestaque)
    } else if (agendamentos[0]) {
      anunciarChamadaVoz(agendamentos[0])
    }
  }

  const isVerde = pacienteEmDestaque?.nivel_urgencia === 'verde'
  const isAmarelo = pacienteEmDestaque?.nivel_urgencia === 'amarelo'
  const isVermelho = pacienteEmDestaque?.nivel_urgencia === 'vermelho'

  const nomeUnidadeExibicao =
    unidadeSelecionada === 'todas'
      ? 'Rede Hospitalar e Atenção Básica Integrada SUS'
      : hospitais.find((h) => h.id === unidadeSelecionada)?.nome || 'Unidade de Acolhimento'

  return (
    <div className="min-h-screen bg-[#070b14] text-white font-jakarta flex flex-col justify-between overflow-hidden select-none">
      {/* Barra de Topo da TV: Logotipo, Horário ao vivo e Controles */}
      <header className="bg-slate-900/90 border-b border-slate-800 px-6 sm:px-10 py-4 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link
            href="/hospital/painel"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
            title="Voltar ao Painel da Enfermagem"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#2b85ff] flex items-center justify-center font-black text-xl tracking-tight shadow-md">
              SUS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] uppercase tracking-wider font-extrabold text-emerald-400">
                  Painel de Chamada em Tempo Real
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight">
                {nomeUnidadeExibicao}
              </h1>
            </div>
          </div>
        </div>

        {/* Relógio Digital e Controles de Áudio / Tela */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Seletor de Hospital */}
          {hospitais.length > 0 && (
            <select
              value={unidadeSelecionada}
              onChange={(e) => setUnidadeSelecionada(e.target.value)}
              className="hidden lg:block bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 px-3 py-2 rounded-xl focus:outline-none"
            >
              <option value="todas">Todas as Unidades</option>
              {hospitais.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.nome}
                </option>
              ))}
            </select>
          )}

          {/* Relógio Live */}
          <div className="text-right">
            <span className="font-mono text-2xl sm:text-3xl font-black text-white tracking-wider block">
              {dataHoraAtual.toLocaleTimeString('pt-BR')}
            </span>
            <span className="text-[11px] font-semibold text-slate-400 capitalize block">
              {dataHoraAtual.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })}
            </span>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-2 pl-4 border-l border-slate-800">
            {/* Teste Sonoro */}
            <button
              onClick={testarChamada}
              className="px-3 py-2 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-blue-300 text-xs font-bold transition flex items-center gap-1.5"
              title="Testar Chamador de Voz e Chime"
            >
              <Bell className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline">Chamar</span>
            </button>

            {/* Mudo / Som */}
            <button
              onClick={() => setAudioAtivo(!audioAtivo)}
              className={`p-2.5 rounded-xl border transition ${
                audioAtivo
                  ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-red-600/20 border-red-500/40 text-red-300'
              }`}
              title={audioAtivo ? 'Voz ativada' : 'Voz desativada (mudo)'}
            >
              {audioAtivo ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700"
              title="Tela cheia"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* ÁREA CENTRAL: CHAMADA PRINCIPAL EM GRANDE DESTAQUE */}
      <main className="flex-1 p-6 sm:p-10 flex flex-col justify-center max-w-7xl mx-auto w-full">
        {loading ? (
          <div className="text-center py-20 space-y-4">
            <RefreshCw className="w-12 h-12 text-[#2b85ff] animate-spin mx-auto" />
            <p className="text-lg text-slate-400 font-semibold">Sincronizando com a recepção hospitalar...</p>
          </div>
        ) : pacienteEmDestaque ? (
          <div className="space-y-6 sm:space-y-8 animate-fade-in">
            {/* Card Hero do Paciente Chamado */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 rounded-3xl border-2 border-blue-500/50 shadow-[0_0_60px_rgba(43,133,255,0.15)] p-8 sm:p-14 relative overflow-hidden text-center">
              {/* Brilho de fundo */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-blue-500/10 blur-3xl pointer-events-none" />

              {/* Tag de Chamada Atual */}
              <div className="inline-flex items-center gap-2.5 px-6 py-2 rounded-full bg-[#2b85ff]/20 text-[#2b85ff] border border-[#2b85ff]/40 text-sm sm:text-base font-extrabold uppercase tracking-widest mb-6 animate-pulse">
                <span className="w-3 h-3 rounded-full bg-[#2b85ff]" />
                Paciente em Atendimento
              </div>

              {/* Nome do Paciente em Escala Gigante */}
              <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight uppercase leading-tight mb-6">
                {pacienteEmDestaque.paciente_nome}
              </h2>

              {/* Protocolo / Senha */}
              <div className="inline-block bg-slate-800/90 border border-slate-700 px-6 py-2.5 rounded-2xl mb-8">
                <span className="text-xs uppercase font-extrabold text-slate-400 block tracking-wider">
                  Senha / Protocolo Eletrônico
                </span>
                <span className="font-mono text-xl sm:text-2xl font-black text-blue-300 tracking-wider">
                  {pacienteEmDestaque.protocolo}
                </span>
              </div>

              {/* Sala de Destino / Consultório */}
              <div className="bg-gradient-to-r from-blue-600 via-[#2b85ff] to-cyan-500 p-1 rounded-3xl shadow-xl max-w-3xl mx-auto">
                <div className="bg-slate-950 rounded-[22px] px-8 py-6 text-center">
                  <span className="text-xs sm:text-sm uppercase font-extrabold text-cyan-300 tracking-widest block mb-1">
                    Favor Comparecer a:
                  </span>
                  <p className="text-2xl sm:text-4xl lg:text-5xl font-black text-white uppercase tracking-tight">
                    {pacienteEmDestaque.sala_atendimento || 'Consultório 1 - Acolhimento e Triagem'}
                  </p>
                </div>
              </div>

              {/* Manchester Urgency Badge */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <div
                  className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold uppercase tracking-wider flex items-center gap-2 shadow-sm ${
                    isVermelho
                      ? 'bg-red-600 text-white'
                      : isAmarelo
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {isVermelho && <AlertOctagon className="w-5 h-5 text-white" />}
                  {isAmarelo && <AlertTriangle className="w-5 h-5 text-slate-950" />}
                  {isVerde && <ShieldCheck className="w-5 h-5 text-white" />}
                  <span>Classificação Manchester: {pacienteEmDestaque.nivel_urgencia}</span>
                </div>

                <div className="px-5 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs sm:text-sm font-semibold text-slate-300">
                  Especialidade: <strong>{pacienteEmDestaque.especialidade}</strong>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-900/60 rounded-3xl border border-slate-800 p-12">
            <Clock className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h2 className="text-3xl font-black text-white mb-2">Sala de Espera — Aguardando Chamadas</h2>
            <p className="text-slate-400 text-base max-w-lg mx-auto">
              Os pacientes chamados pela equipe médica e enfermagem aparecerão automaticamente nesta tela com anúncio sonoro.
            </p>
          </div>
        )}
      </main>

      {/* RODAPÉ DA TV: ÚLTIMAS CHAMADAS REALIZADAS */}
      <footer className="bg-slate-900/95 border-t border-slate-800 px-6 sm:px-10 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider shrink-0">
              Últimas Chamadas:
            </span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {ultimasChamadas.length > 0 ? (
              ultimasChamadas.map((ag) => (
                <div
                  key={ag.id}
                  className="bg-slate-800/80 border border-slate-700/80 px-4 py-2 rounded-xl flex items-center gap-3 shrink-0"
                >
                  <span className="font-mono text-xs font-bold text-blue-300">{ag.protocolo.slice(-5)}</span>
                  <span className="text-xs font-bold text-white uppercase truncate max-w-[140px]">
                    {ag.paciente_nome}
                  </span>
                  <span className="text-[11px] font-semibold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-800/50">
                    {ag.sala_atendimento ? ag.sala_atendimento.split(' - ')[0] : 'Cons. 1'}
                  </span>
                </div>
              ))
            ) : (
              <span className="text-xs text-slate-500 italic">Nenhuma chamada anterior no momento</span>
            )}
          </div>

          <div className="text-[11px] text-slate-500 font-semibold text-center md:text-right shrink-0">
            Cuidaê • Sistema Único de Saúde (SUS) 100% Gratuito
          </div>
        </div>
      </footer>
    </div>
  )
}
