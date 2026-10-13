'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  Building2,
  MapPin,
  Sparkles,
  ArrowRight,
  Plus,
  ArrowLeft,
  FileText,
  Search,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Loader2
} from 'lucide-react'
import type { AgendamentoHospitalar } from '@/lib/types'

export default function MeusAgendamentosPage() {
  const [agendamentos, setAgendamentos] = useState<AgendamentoHospitalar[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busca, setBusca] = useState('')

  const carregarAgendamentos = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/agendamentos')
      if (!res.ok) throw new Error('Não foi possível carregar os agendamentos')
      const data = await res.json()
      setAgendamentos(data.agendamentos || [])
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Erro ao consultar agendamentos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarAgendamentos()
  }, [])

  const filtrados = agendamentos.filter((ag) => {
    if (!busca.trim()) return true
    const q = busca.toLowerCase()
    return (
      ag.protocolo.toLowerCase().includes(q) ||
      ag.unidade_nome.toLowerCase().includes(q) ||
      ag.especialidade.toLowerCase().includes(q) ||
      ag.diagnostico_ia.toLowerCase().includes(q) ||
      ag.sintomas_citados.toLowerCase().includes(q)
    )
  })

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-16 font-jakarta">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-[#2b85ff] dark:hover:text-blue-400 transition mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </Link>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-blue-50 dark:bg-blue-950/60 text-[#2b85ff] dark:text-blue-400 rounded-xl shadow-xs border dark:border-blue-800/40">
              <Calendar className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#091426] dark:text-white tracking-tight">
                Meus Agendamentos Hospitalares
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Consultas e atendimentos transmitidos com prontuário de inteligência artificial.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/agendamento"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2b85ff] hover:bg-blue-600 text-white font-bold text-sm rounded-xl shadow-xs transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Novo Agendamento
        </Link>
      </div>

      {/* Barra de Busca e Filtro */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por protocolo, hospital, especialidade ou diagnóstico..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-[#091426] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2b85ff]/30 focus:border-[#2b85ff]"
          />
        </div>

        <button
          onClick={carregarAgendamentos}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          title="Atualizar lista"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 animate-pulse space-y-3">
              <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
              <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Erro */}
      {error && !loading && (
        <div className="bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
          <p className="text-sm font-bold text-red-900 dark:text-red-200">{error}</p>
          <button
            onClick={carregarAgendamentos}
            className="px-4 py-2 bg-red-600 text-white font-semibold text-xs rounded-xl hover:bg-red-700 transition"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Lista Vazia */}
      {!loading && !error && filtrados.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#2b85ff] dark:text-blue-400 flex items-center justify-center mx-auto border dark:border-blue-800/40">
            <Calendar className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#091426] dark:text-white">Nenhum agendamento encontrado</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
              Você ainda não possui agendamentos hospitalares ativos ou o filtro de busca não retornou resultados.
            </p>
          </div>
          <Link
            href="/agendamento"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#2b85ff] hover:bg-blue-600 text-white font-bold text-sm rounded-xl transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Agendar Atendimento no Hospital
          </Link>
        </div>
      )}

      {/* Grid de Cards de Agendamentos */}
      {!loading && !error && filtrados.length > 0 && (
        <div className="space-y-4">
          {filtrados.map((item) => {
            const isVerde = item.nivel_urgencia === 'verde'
            const isAmarelo = item.nivel_urgencia === 'amarelo'
            const isVermelho = item.nivel_urgencia === 'vermelho'

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700/80 p-6 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                {/* Lado Esquerdo: Detalhes do Agendamento */}
                <div className="space-y-3 flex-1">
                  
                  {/* Badges de Protocolo e Status */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-extrabold text-[#2b85ff] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-2.5 py-1 rounded-xl border border-blue-100 dark:border-blue-800/60">
                      Prot: {item.protocolo}
                    </span>

                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Transmitido ao Hospital
                    </span>

                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold capitalize border ${
                      isVerde ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60' :
                      isAmarelo ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60' :
                      'bg-red-50 dark:bg-red-950/70 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800/60'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        isVerde ? 'bg-emerald-500' : isAmarelo ? 'bg-amber-500' : 'bg-red-500'
                      }`}></span>
                      Manchester: {item.nivel_urgencia}
                    </span>
                  </div>

                  {/* Nome do Hospital e Especialidade */}
                  <div>
                    <h3 className="text-lg font-extrabold text-[#091426] dark:text-white leading-snug">
                      {item.unidade_nome}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{item.especialidade}</span>
                      <span>•</span>
                      <span>{item.unidade_endereco}</span>
                    </p>
                  </div>

                  {/* Ficha Clínica Sintetizada (Diagnóstico da IA e Sintomas) */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3 border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-start gap-1.5">
                      <strong className="text-slate-700 dark:text-slate-300 shrink-0">Sintomas:</strong>
                      <span className="text-slate-600 dark:text-slate-400 line-clamp-1 italic">
                        "{item.sintomas_citados}"
                      </span>
                    </div>

                    <div className="flex items-start gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#2b85ff] dark:text-blue-400 shrink-0 mt-0.5" />
                      <strong className="text-[#2b85ff] dark:text-blue-400 shrink-0">Diagnóstico IA:</strong>
                      <span className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                        {item.diagnostico_ia}
                      </span>
                    </div>
                  </div>

                  {/* Data e Hora */}
                  <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400 pt-1 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#2b85ff] dark:text-blue-400" />
                      <span>{new Date(item.data_agendamento + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#2b85ff] dark:text-blue-400" />
                      <span>{item.horario} ({item.turno === 'manha' ? 'Manhã' : 'Tarde'})</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 dark:text-slate-500">Paciente:</span>
                      <strong className="text-slate-700 dark:text-slate-200">{item.paciente_nome}</strong>
                    </div>
                  </div>

                </div>

                {/* Lado Direito: Ação para Ver Protocolo */}
                <div className="shrink-0 w-full md:w-auto">
                  <Link
                    href={`/agendamento/confirmacao/${item.id}`}
                    className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-50 dark:bg-blue-950/60 hover:bg-[#2b85ff] hover:text-white dark:hover:bg-blue-600 dark:hover:text-white text-[#2b85ff] dark:text-blue-400 font-bold text-xs sm:text-sm rounded-2xl border border-blue-200 dark:border-blue-800/60 transition-all shadow-xs"
                  >
                    <span>Ver Comprovante e Protocolo</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
