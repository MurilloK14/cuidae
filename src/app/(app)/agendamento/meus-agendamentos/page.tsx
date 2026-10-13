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
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-16 font-['Inter']">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#2b85ff] transition mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </Link>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-blue-50 text-[#2b85ff] rounded-2xl shadow-xs">
              <Calendar className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#091426] tracking-tight">
                Meus Agendamentos Hospitalares
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
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
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por protocolo, hospital, especialidade ou diagnóstico..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm text-[#091426] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2b85ff]/30 focus:border-[#2b85ff]"
          />
        </div>

        <button
          onClick={carregarAgendamentos}
          className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
          title="Atualizar lista"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 animate-pulse space-y-3">
              <div className="h-5 bg-slate-200 rounded w-1/4" />
              <div className="h-4 bg-slate-200 rounded w-1/2" />
              <div className="h-4 bg-slate-100 rounded w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Erro */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
          <p className="text-sm font-bold text-red-900">{error}</p>
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
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#2b85ff] flex items-center justify-center mx-auto">
            <Calendar className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#091426]">Nenhum agendamento encontrado</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
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
                className="bg-white rounded-3xl border border-slate-200/90 hover:border-blue-300 p-6 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                {/* Lado Esquerdo: Detalhes do Agendamento */}
                <div className="space-y-3 flex-1">
                  
                  {/* Badges de Protocolo e Status */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-extrabold text-[#2b85ff] bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-100">
                      Prot: {item.protocolo}
                    </span>

                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Transmitido ao Hospital
                    </span>

                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold capitalize border ${
                      isVerde ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                      isAmarelo ? 'bg-amber-50 text-amber-800 border-amber-200' :
                      'bg-red-50 text-red-800 border-red-200'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        isVerde ? 'bg-emerald-500' : isAmarelo ? 'bg-amber-500' : 'bg-red-500'
                      }`}></span>
                      Manchester: {item.nivel_urgencia}
                    </span>
                  </div>

                  {/* Nome do Hospital e Especialidade */}
                  <div>
                    <h3 className="text-lg font-extrabold text-[#091426] leading-snug">
                      {item.unidade_nome}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                      <span className="font-bold text-slate-800">{item.especialidade}</span>
                      <span>•</span>
                      <span>{item.unidade_endereco}</span>
                    </p>
                  </div>

                  {/* Ficha Clínica Sintetizada (Diagnóstico da IA e Sintomas) */}
                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex items-start gap-1.5">
                      <strong className="text-slate-700 shrink-0">Sintomas:</strong>
                      <span className="text-slate-600 line-clamp-1 italic">
                        "{item.sintomas_citados}"
                      </span>
                    </div>

                    <div className="flex items-start gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#2b85ff] shrink-0 mt-0.5" />
                      <strong className="text-[#2b85ff] shrink-0">Diagnóstico IA:</strong>
                      <span className="font-semibold text-slate-900 line-clamp-1">
                        {item.diagnostico_ia}
                      </span>
                    </div>
                  </div>

                  {/* Data e Hora */}
                  <div className="flex items-center gap-4 text-xs text-slate-600 pt-1 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#2b85ff]" />
                      <span>{new Date(item.data_agendamento + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#2b85ff]" />
                      <span>{item.horario} ({item.turno === 'manha' ? 'Manhã' : 'Tarde'})</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Paciente:</span>
                      <strong className="text-slate-700">{item.paciente_nome}</strong>
                    </div>
                  </div>

                </div>

                {/* Lado Direito: Ação para Ver Protocolo */}
                <div className="shrink-0 w-full md:w-auto">
                  <Link
                    href={`/agendamento/confirmacao/${item.id}`}
                    className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-50 hover:bg-[#2b85ff] hover:text-white text-[#2b85ff] font-bold text-xs sm:text-sm rounded-2xl border border-blue-200 transition-all shadow-xs"
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
