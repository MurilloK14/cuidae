'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircle2,
  Calendar,
  Clock,
  Building2,
  MapPin,
  Phone,
  Printer,
  Share2,
  ArrowLeft,
  Copy,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  AlertOctagon,
  FileText,
  User,
  HeartPulse,
  Download,
  Info
} from 'lucide-react'
import type { AgendamentoHospitalar } from '@/lib/types'

export default function ConfirmacaoAgendamentoPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [agendamento, setAgendamento] = useState<AgendamentoHospitalar | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    if (!id) return

    async function buscarAgendamento() {
      setLoading(true)
      try {
        const res = await fetch(`/api/agendamentos/${id}`)
        if (!res.ok) throw new Error('Agendamento não encontrado')
        const data = await res.json()
        setAgendamento(data.agendamento)
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar detalhes do agendamento')
      } finally {
        setLoading(false)
      }
    }

    buscarAgendamento()
  }, [id])

  const copiarProtocolo = () => {
    if (agendamento?.protocolo) {
      navigator.clipboard.writeText(agendamento.protocolo)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 3000)
    }
  }

  const handleImprimir = () => {
    window.print()
  }

  const handleDownloadICS = () => {
    if (!agendamento) return

    const [ano, mes, dia] = agendamento.data_agendamento.split('-')
    const [hora, min] = (agendamento.horario || '08:00').split(':')
    const dataInicio = `${ano}${mes}${dia}T${hora}${min}00`
    const horaFim = (parseInt(hora, 10) + 1).toString().padStart(2, '0')
    const dataFim = `${ano}${mes}${dia}T${horaFim}${min}00`

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Cuidae Saude//Agendamento Hospitalar//PT',
      'BEGIN:VEVENT',
      `SUMMARY:Consulta ${agendamento.especialidade} - ${agendamento.unidade_nome}`,
      `DESCRIPTION:Protocolo: ${agendamento.protocolo}\\nSintomas: ${agendamento.sintomas_citados}\\nDiagnóstico IA: ${agendamento.diagnostico_ia}`,
      `LOCATION:${agendamento.unidade_endereco}`,
      `DTSTART:${dataInicio}`,
      `DTEND:${dataFim}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n')

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.setAttribute('download', `agendamento-${agendamento.protocolo}.ics`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center space-y-4 animate-pulse">
        <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto" />
        <div className="h-6 w-48 bg-slate-200 rounded-lg mx-auto" />
        <div className="h-4 w-72 bg-slate-200 rounded-lg mx-auto" />
      </div>
    )
  }

  if (error || !agendamento) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-[#091426]">Agendamento não encontrado</h2>
        <p className="text-sm text-slate-500">{error || 'Não foi possível carregar o protocolo informado.'}</p>
        <Link
          href="/agendamento"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2b85ff] text-white font-semibold rounded-xl text-sm hover:bg-blue-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Fazer Novo Agendamento
        </Link>
      </div>
    )
  }

  const isVerde = agendamento.nivel_urgencia === 'verde'
  const isAmarelo = agendamento.nivel_urgencia === 'amarelo'
  const isVermelho = agendamento.nivel_urgencia === 'vermelho'

  const dataFormatada = new Date(agendamento.data_agendamento + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-16 font-jakarta">
      
      {/* Botões Superiores de Navegação */}
      <div className="flex items-center justify-between no-print">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#2b85ff] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Dashboard
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadICS}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-xs transition"
          >
            <Calendar className="w-3.5 h-3.5 text-[#2b85ff]" />
            Salvar no Calendário (.ics)
          </button>

          <button
            onClick={handleImprimir}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2b85ff] hover:bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir Comprovante
          </button>
        </div>
      </div>

      {/* COMPROVANTE OFICIAL DE ENCAMINHAMENTO HOSPITALAR */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden printable-area">
        
        {/* Faixa de Cabeçalho / Sucesso */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-[#122748] p-6 sm:p-8 text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30">
                <CheckCircle2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                  Agendamento Transmitido com Sucesso
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Protocolo Hospitalar Confirmado
                </h1>
              </div>
            </div>

            {/* Número do Protocolo em Destaque */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-3 rounded-2xl self-stretch sm:self-auto text-left sm:text-right">
              <span className="text-[10px] uppercase font-bold text-emerald-200 block">Número do Protocolo</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base sm:text-lg font-extrabold text-white tracking-wider">
                  {agendamento.protocolo}
                </span>
                <button
                  type="button"
                  onClick={copiarProtocolo}
                  title="Copiar Protocolo"
                  className="p-1 rounded-lg hover:bg-white/20 text-white transition no-print"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              {copiado && <span className="text-[10px] text-emerald-200 block">Copiado!</span>}
            </div>
          </div>
        </div>

        {/* Corpo do Comprovante */}
        <div className="p-6 sm:p-8 space-y-8">
          
          {/* Card de Status da Transmissão para o Hospital */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <h3 className="text-sm font-bold text-emerald-950">
                  Recepcionado no Barramento Hospitalar de Saúde
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Status: Transmitido
              </span>
            </div>

            <p className="text-xs text-emerald-900 leading-relaxed font-medium">
              O agendamento e o prontuário preliminar de triagem foram registrados para a unidade <strong>{agendamento.unidade_nome}</strong>. O paciente possui prioridade na triagem de entrada devido ao pré-atendimento clínico pela inteligência artificial.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-emerald-200/60 text-[11px] text-emerald-800">
              <div>
                <span className="text-emerald-600 block">Destino:</span>
                <strong>{agendamento.transmissao_hospital.sistema_destino}</strong>
              </div>
              <div>
                <span className="text-emerald-600 block">Data de Transmissão:</span>
                <strong>{new Date(agendamento.transmissao_hospital.data_envio).toLocaleString('pt-BR')}</strong>
              </div>
              <div>
                <span className="text-emerald-600 block">Código Hash de Autenticidade:</span>
                <span className="font-mono text-[10px]">{agendamento.transmissao_hospital.hash_seguranca}</span>
              </div>
            </div>
          </div>

          {/* Grid de Informações: Unidade + Data/Hora */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Bloco Hospital */}
            <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-5 space-y-3">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <Building2 className="w-4 h-4 text-[#2b85ff]" />
                Unidade de Atendimento
              </div>

              <div>
                <h4 className="text-lg font-extrabold text-[#091426] leading-snug">
                  {agendamento.unidade_nome}
                </h4>
                <p className="text-xs text-slate-500 mt-1 flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  {agendamento.unidade_endereco}
                </p>
                <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  Telefone: <strong>{agendamento.unidade_telefone}</strong>
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/60">
                <a
                  href={`https://www.google.com/maps/search/${encodeURIComponent(agendamento.unidade_nome + ' ' + agendamento.unidade_endereco)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#2b85ff] hover:underline"
                >
                  Abrir Rota no Google Maps <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Bloco Data, Horário e Especialidade */}
            <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-5 space-y-3">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <Calendar className="w-4 h-4 text-[#2b85ff]" />
                Horário e Especialidade
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Data Marcada:</span>
                  <span className="text-sm font-bold text-[#091426] capitalize">
                    {dataFormatada}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Horário Preferencial:</span>
                  <span className="text-sm font-extrabold text-[#2b85ff] bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-100">
                    {agendamento.horario} ({agendamento.turno === 'manha' ? 'Manhã' : 'Tarde'})
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Especialidade:</span>
                  <span className="text-sm font-bold text-[#091426]">
                    {agendamento.especialidade}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Paciente:</span>
                  <span className="text-xs font-bold text-slate-800">
                    {agendamento.paciente_nome}
                  </span>
                </div>

                {agendamento.paciente_cpf && agendamento.paciente_cpf !== 'Não informado' && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Documento / SUS:</span>
                    <span className="text-xs font-mono text-slate-700">
                      {agendamento.paciente_cpf}
                    </span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* SEÇÃO PRINCIPAL: FICHA CLÍNICA DE IA TRANSMITIDA AO HOSPITAL */}
          <div className="border border-blue-200 rounded-2xl bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/30 p-6 sm:p-7 space-y-5">
            
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#2b85ff] text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#091426]">
                    Prontuário de Triagem da IA Transmitido ao Hospital
                  </h3>
                  <p className="text-xs text-slate-500">
                    Este relatório já consta nos registros do hospital de destino
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-[#1a6edb] border border-blue-200">
                {agendamento.fonte_ia}
              </span>
            </div>

            {/* Sintomas Citados */}
            <div className="space-y-1.5 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <span className="text-xs font-extrabold text-[#091426] uppercase tracking-wider block">
                📋 Sintomas Relatados e Citados:
              </span>
              <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                "{agendamento.sintomas_citados}"
              </p>
            </div>

            {/* Diagnóstico da IA e Gravidade */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <div className="sm:col-span-2 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
                <span className="text-xs font-extrabold text-[#091426] uppercase tracking-wider block">
                  🧠 Diagnóstico / Hipótese da IA:
                </span>
                <p className="text-base font-bold text-[#2b85ff] leading-snug">
                  {agendamento.diagnostico_ia}
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
                <span className="text-xs font-extrabold text-[#091426] uppercase tracking-wider block">
                  🚦 Urgência (Manchester):
                </span>
                <div className="flex items-center gap-2 pt-1">
                  <span className={`w-3.5 h-3.5 rounded-full ${
                    isVerde ? 'bg-emerald-500' : isAmarelo ? 'bg-amber-500' : 'bg-red-500'
                  }`}></span>
                  <span className={`text-sm font-extrabold capitalize ${
                    isVerde ? 'text-emerald-700' : isAmarelo ? 'text-amber-700' : 'text-red-700'
                  }`}>
                    {agendamento.nivel_urgencia}
                  </span>
                </div>
              </div>

            </div>

            {/* Orientações e Cuidados Imediatos */}
            {agendamento.orientacao_ia && (
              <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-2xs space-y-1">
                <span className="text-xs font-extrabold text-[#091426] uppercase tracking-wider block">
                  💡 Orientações e Condutas Preliminares:
                </span>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  {agendamento.orientacao_ia}
                </p>
              </div>
            )}

            {/* Resumo Clínico Transmitido */}
            <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
              <strong className="text-slate-700 block mb-0.5">Texto transmitido à enfermagem e recepção médica:</strong>
              {agendamento.resumo_clinico_hospital}
            </div>

          </div>

          {/* Orientações para o Dia do Atendimento */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-3">
            <h4 className="font-bold text-sm text-[#091426] flex items-center gap-1.5">
              <Info className="w-4 h-4 text-[#2b85ff]" />
              Instruções Importantes para o Dia da Consulta:
            </h4>
            <ul className="text-xs sm:text-sm text-slate-600 space-y-2 list-disc list-inside">
              <li>Chegue com <strong>15 a 20 minutos de antecedência</strong> do horário agendado.</li>
              <li>Apresente na recepção um <strong>documento oficial com foto</strong> (RG ou CNH), o <strong>Cartão SUS</strong> e o número de protocolo deste comprovante (<strong>{agendamento.protocolo}</strong>).</li>
              <li>Avise ao recepcionista ou enfermeiro de triagem que você realizou o agendamento prévio com <strong>laudo do Cuidaê</strong> para busca rápida no prontuário.</li>
              <li>Em caso de piora súbita dos sintomas antes da data agendada, dirija-se imediatamente à emergência do hospital ou acione o SAMU 192.</li>
            </ul>
          </div>

        </div>

        {/* Rodapé do Comprovante */}
        <div className="bg-slate-100/80 border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>Sistema Cuidaê • Rede Integrada de Saúde de Garanhuns</span>
          <span>Autenticação Digital: {agendamento.transmissao_hospital.hash_seguranca}</span>
        </div>

      </div>

      {/* Ações Inferiores */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 no-print">
        <Link
          href="/agendamento/meus-agendamentos"
          className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition"
        >
          Ver Todos os Meus Agendamentos
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="px-5 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl transition"
          >
            Dashboard
          </Link>
          <Link
            href="/triagem"
            className="px-5 py-2.5 bg-[#2b85ff] hover:bg-blue-600 text-white font-semibold text-sm rounded-xl transition shadow-xs"
          >
            Nova Triagem
          </Link>
        </div>
      </div>

    </div>
  )
}
