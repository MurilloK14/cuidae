import { getTriagemResultado } from '@/lib/triagem/actions'
import { ShieldCheck, AlertTriangle, AlertOctagon, MapPin, Phone, ExternalLink, Download, ArrowRight, ArrowLeft, Calendar, Sparkles } from 'lucide-react'
import Link from 'next/link'

import { notFound } from 'next/navigation'

export default async function TriagemResultadoPage({ params }: { params: { id: string } }) {
  const triagem = await getTriagemResultado(params.id)

  if (!triagem) {
    notFound()
  }

  const urgencia = triagem.nivel_urgencia || 'verde'
  const recomendacao = triagem.recomendacao || 'esperar'
  const explicacao = triagem.explicacao || 'Consulte um profissional de saúde para mais orientações.'

  const isVerde = urgencia === 'verde'
  const isAmarelo = urgencia === 'amarelo'
  const isVermelho = urgencia === 'vermelho'

  const bgColor = isVerde ? 'bg-emerald-50/80' : isAmarelo ? 'bg-amber-50/80' : 'bg-red-50/80'
  const borderColor = isVerde ? 'border-emerald-200' : isAmarelo ? 'border-amber-200' : 'border-red-200'
  const textColor = isVerde ? 'text-emerald-900' : isAmarelo ? 'text-amber-900' : 'text-red-900'
  const iconColor = isVerde ? 'text-emerald-600' : isAmarelo ? 'text-amber-600' : 'text-red-600'

  const showUnidades = recomendacao === 'ubs' || recomendacao === 'upa'
  const showTeleconsulta = recomendacao === 'teleconsulta'

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up font-jakarta pb-12">
      <div className="mb-6">
        <Link href="/dashboard" className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-2 w-fit transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Dashboard
        </Link>
      </div>

      {/* Urgency Banner */}
      <div className={`rounded-2xl border ${borderColor} ${bgColor} p-6 sm:p-7 mb-8 shadow-xs`}>
        <div className="flex items-start gap-4">
          <div className="mt-1 shrink-0">
            {isVerde && <ShieldCheck className={`w-8 h-8 ${iconColor}`} />}
            {isAmarelo && <AlertTriangle className={`w-8 h-8 ${iconColor}`} />}
            {isVermelho && <AlertOctagon className={`w-8 h-8 ${iconColor}`} />}
          </div>
          <div>
            <h1 className={`text-xl sm:text-2xl font-bold mb-2 tracking-tight ${textColor}`}>
              {isVerde && 'Urgência Baixa — Atendimento Eletivo'}
              {isAmarelo && 'Urgência Moderada — Avaliação Recomendada'}
              {isVermelho && 'Urgência Alta — Procure Atendimento Imediato'}
            </h1>
            <p className="text-slate-700 text-base sm:text-lg leading-relaxed">
              {explicacao}
            </p>
          </div>
        </div>
      </div>

      {/* Symptom Context & AI Insights */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Sintoma Relatado</p>
            <p className="text-slate-900 font-semibold text-lg">{triagem.sintoma_principal}</p>
          </div>
          {triagem.fonteIA && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#2b85ff] border border-blue-100">
              <span className="w-2 h-2 rounded-full bg-[#2b85ff] animate-pulse"></span>
              {triagem.fonteIA}
            </span>
          )}
        </div>

        {triagem.especialidade && (
          <div className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="font-semibold text-slate-900">Especialidade recomendada:</span>
            <span className="text-[#2b85ff] font-medium">{triagem.especialidade}</span>
          </div>
        )}

        {triagem.orientacao && (
          <div className="bg-blue-50/60 rounded-xl p-4 border border-blue-100/80">
            <h3 className="text-sm font-semibold text-blue-900 mb-1 flex items-center gap-1.5">
              💡 Recomendações e Cuidados Imediatos
            </h3>
            <p className="text-sm text-blue-950 leading-relaxed">
              {triagem.orientacao}
            </p>
          </div>
        )}

        {triagem.mapa ? (
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <a
              href={triagem.mapa.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2b85ff] hover:bg-blue-600 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
            >
              <MapPin className="w-4 h-4" />
              {triagem.mapa.label || 'Ver Unidade Mais Próxima no Google Maps'}
              <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </a>
            <Link
              href={`/unidades?diagnostico=${encodeURIComponent(triagem.sintoma_principal || '')}&especialidade=${encodeURIComponent(triagem.especialidade || '')}&tipo=${encodeURIComponent(recomendacao || '')}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-[#2b85ff] text-sm font-semibold rounded-xl border border-blue-200 transition-all"
            >
              <span>🏥</span>
              Ver todas as unidades recomendadas
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="pt-2">
            <Link
              href={`/unidades?diagnostico=${encodeURIComponent(triagem.sintoma_principal || '')}&especialidade=${encodeURIComponent(triagem.especialidade || '')}&tipo=${encodeURIComponent(recomendacao || '')}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2b85ff] hover:bg-blue-600 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
            >
              <MapPin className="w-4 h-4" />
              Ver todas as unidades recomendadas
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        )}

        <p className="text-xs text-slate-400 pt-1">
          Triagem registrada em: {new Date(triagem.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {/* Direct Hospital Scheduling CTA with AI Diagnosis */}
      <div className="mb-8 bg-gradient-to-br from-[#091426] via-[#122748] to-[#1a386b] rounded-2xl p-6 sm:p-7 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#2b85ff]/30 text-blue-200 border border-blue-400/30">
              <Sparkles className="w-3.5 h-3.5 text-[#2b85ff]" />
              Encaminhamento Hospitalar Direto
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Agendar Atendimento no Hospital
            </h2>
            <p className="text-sm text-blue-100/90 leading-relaxed">
              Transmita este agendamento junto com os <strong>sintomas citados</strong> e o <strong>diagnóstico preliminar da IA</strong> diretamente para o hospital de sua escolha em Garanhuns.
            </p>
          </div>
          <Link
            href={`/agendamento?triagemId=${params.id}&sintomas=${encodeURIComponent(triagem.sintoma_principal || '')}&diagnostico=${encodeURIComponent(triagem.recomendacao || triagem.explicacao || '')}&especialidade=${encodeURIComponent(triagem.especialidade || '')}`}
            className="px-6 py-3.5 bg-[#2b85ff] hover:bg-blue-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 shrink-0 text-sm sm:text-base whitespace-nowrap"
          >
            <Calendar className="w-4 h-4" />
            Agendar com este Diagnóstico
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Recommended Health Units CTA */}
      {showUnidades && (

        <div className="mb-8 bg-gradient-to-br from-blue-50/80 via-white to-blue-50/40 rounded-2xl p-6 border border-blue-100 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#2b85ff]/10 text-[#2b85ff] mb-2">
                <span>📍</span> Recomendações personalizadas
              </div>
              <h2 className="text-xl font-bold text-[#091426] mb-1">Unidades de Saúde Recomendadas</h2>
              <p className="text-sm text-slate-600">
                Encontre hospitais, postos de saúde e unidades especializadas mais indicados para o seu caso em Garanhuns.
              </p>
            </div>
            <Link
              href={`/unidades?diagnostico=${encodeURIComponent(triagem.sintoma_principal || '')}&especialidade=${encodeURIComponent(triagem.especialidade || '')}&tipo=${encodeURIComponent(recomendacao || '')}`}
              className="px-6 py-3 bg-[#2b85ff] hover:bg-blue-600 text-white font-semibold rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2 shrink-0"
            >
              Ver Unidades Recomendadas
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Teleconsulta CTA */}
      {showTeleconsulta && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm mb-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold text-[#091426] mb-1">🩻 Agendar Teleconsulta</h2>
            <p className="text-slate-600">Fale com um médico sem sair de casa.</p>
          </div>
          <div className="flex flex-col items-center sm:items-end gap-2 shrink-0">
            <span className="text-2xl font-bold text-[#091426]">R$ 39,90</span>
            <Link
              href="/planos/checkout?plano=intermediaria&tipo=avulsa"
              className="px-6 py-3 bg-[#091426] hover:bg-[#1a2c4e] text-white font-medium rounded-full text-center transition-colors flex items-center gap-2"
            >
              Agendar agora <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-8">
        <button
          disabled
          className="group relative px-6 py-3 border border-slate-200 text-slate-400 font-medium rounded-full flex items-center gap-2 cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          Salvar PDF
          <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Em breve
          </span>
        </button>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="px-6 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium rounded-full transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/triagem"
            className="px-6 py-3 bg-[#eef5ff] hover:bg-blue-100 text-[#2b85ff] font-medium rounded-full flex items-center gap-2 transition-colors"
          >
            Nova Triagem <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
