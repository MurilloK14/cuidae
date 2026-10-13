'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  MapPin, Phone, Clock, Star, ArrowLeft, ExternalLink,
  Building2, ShieldCheck, Stethoscope, MessageSquare,
  Send, ThumbsUp, AlertCircle, Heart, Users, CheckCircle2,
  AlertTriangle, Sparkles, Navigation, Calendar
} from 'lucide-react'
import type { UnidadeSaudeCompleta, AvaliacaoUnidade } from '@/lib/types'

export default function UnidadeDetalhePage() {
  const params = useParams()
  const id = params?.id as string

  const [unidade, setUnidade] = useState<UnidadeSaudeCompleta | null>(null)
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoUnidade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'info' | 'avaliacoes'>('info')

  // Review form state
  const [nomeAutor, setNomeAutor] = useState('')
  const [nota, setNota] = useState<number>(5)
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [comentario, setComentario] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewSuccess, setReviewSuccess] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)

  // Fetch unit and reviews
  useEffect(() => {
    if (!id) return

    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const [resUnit, resReviews] = await Promise.all([
          fetch(`/api/unidades/${id}`),
          fetch(`/api/unidades/${id}/avaliacoes`),
        ])

        if (!resUnit.ok) throw new Error('Unidade de saúde não encontrada')

        const unitData = await resUnit.json()
        setUnidade(unitData.unidade)

        if (resReviews.ok) {
          const reviewsData = await resReviews.json()
          setAvaliacoes(reviewsData.avaliacoes || [])
        }
      } catch (err: any) {
        console.error(err)
        setError(err.message || 'Erro ao carregar informações da unidade')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  // Submit review handler
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return

    if (!comentario.trim()) {
      setReviewError('Por favor, escreva um comentário antes de enviar.')
      return
    }

    setSubmittingReview(true)
    setReviewError(null)

    try {
      const res = await fetch(`/api/unidades/${id}/avaliacoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nomeAutor.trim() || 'Usuário Cuidaê',
          nota,
          comentario: comentario.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao salvar avaliação')
      }

      // Prepend review immediately
      const nova: AvaliacaoUnidade = data.avaliacao || {
        id: String(Date.now()),
        unidade_id: id,
        user_id: 'anonimo',
        nome: nomeAutor.trim() || 'Usuário Cuidaê',
        nota,
        comentario: comentario.trim(),
        created_at: new Date().toISOString(),
      }

      setAvaliacoes((prev) => [nova, ...prev])
      setComentario('')
      setReviewSuccess(true)
      setTimeout(() => setReviewSuccess(false), 4000)
    } catch (err: any) {
      console.error(err)
      setReviewError(err.message || 'Erro ao enviar avaliação. Tente novamente.')
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse py-6">
        <div className="h-6 w-32 bg-slate-200 rounded-lg" />
        <div className="h-44 bg-slate-200 rounded-3xl" />
        <div className="h-12 bg-slate-200 rounded-2xl" />
        <div className="h-80 bg-slate-200 rounded-3xl" />
      </div>
    )
  }

  if (error || !unidade) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-[#091426]">Unidade não encontrada</h2>
        <p className="text-sm text-slate-500">{error || 'Não encontramos registros para este identificador.'}</p>
        <Link
          href="/unidades"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2b85ff] text-white font-medium rounded-xl hover:bg-blue-600 transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para lista de unidades
        </Link>
      </div>
    )
  }

  const statusColor =
    unidade.status_color === 'emerald'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : unidade.status_color === 'amber'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-slate-100 text-slate-700 border-slate-200'

  const mapsEmbedSrc = `https://maps.google.com/maps?q=${unidade.latitude},${unidade.longitude}&z=15&output=embed`

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in font-jakarta">
      {/* Back button */}
      <div>
        <Link
          href="/unidades"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#2b85ff] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Unidades de Saúde
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#2b85ff]/10 text-[#2b85ff]">
              {unidade.categoria}
            </span>

            {unidade.sus_gratuito && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                Atendimento 100% SUS Gratuito
              </span>
            )}

            {unidade.tem_urgencia && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                <AlertCircle className="w-3.5 h-3.5" />
                Urgência e Emergência
              </span>
            )}

            {unidade.badge && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                {unidade.badge}
              </span>
            )}
          </div>

          {unidade.status && (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusColor}`}>
              <span className="w-2 h-2 rounded-full bg-current mr-1.5" />
              {unidade.status}
            </span>
          )}
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#091426] leading-tight">
            {unidade.nome}
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1">
            {unidade.tipo_label} {unidade.bairro ? `• ${unidade.bairro}, ${unidade.cidade} - ${unidade.uf}` : ''}
          </p>
        </div>

        {/* Quick info row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-xs sm:text-sm text-slate-600">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-[#2b85ff] shrink-0" />
            <div>
              <p className="font-semibold text-slate-900">{unidade.horario}</p>
              {unidade.horario_detalhe && (
                <p className="text-[11px] text-slate-400">{unidade.horario_detalhe}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Phone className="w-4 h-4 text-[#2b85ff] shrink-0" />
            <div>
              <a
                href={`tel:${unidade.telefone.replace(/\D/g, '')}`}
                className="font-semibold text-slate-900 hover:text-[#2b85ff] transition"
              >
                {unidade.telefone}
              </a>
              <p className="text-[11px] text-slate-400">Linha Principal</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Star className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
            <div>
              <p className="font-semibold text-slate-900">
                {unidade.google_rating.toFixed(1)} no Google
              </p>
              <p className="text-[11px] text-slate-400">
                {unidade.google_total_avaliacoes} avaliações públicas
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            href={`/agendamento?unidadeId=${unidade.id}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2b85ff] hover:bg-blue-600 text-white font-bold rounded-xl text-sm shadow-sm transition"
          >
            <Calendar className="w-4 h-4" />
            Agendar Atendimento com IA
          </Link>

          <a
            href={unidade.google_maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-800 font-semibold rounded-xl text-sm transition"
          >
            <MapPin className="w-4 h-4 text-[#2b85ff]" />
            Abrir Rota no Maps
            <ExternalLink className="w-3.5 h-3.5 ml-1" />
          </a>

          <a
            href={`tel:${unidade.telefone.replace(/\D/g, '')}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200/80 text-[#091426] font-semibold rounded-xl text-sm transition"
          >
            <Phone className="w-4 h-4 text-slate-600" />
            Ligar para Unidade
          </a>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('info')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm border-b-2 transition-all -mb-px ${
            activeTab === 'info'
              ? 'border-[#2b85ff] text-[#2b85ff]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Informações
        </button>

        <button
          onClick={() => setActiveTab('avaliacoes')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm border-b-2 transition-all -mb-px ${
            activeTab === 'avaliacoes'
              ? 'border-[#2b85ff] text-[#2b85ff]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Avaliações
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
            {avaliacoes.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Informações */}
      {activeTab === 'info' && (
        <div className="space-y-6">
          {/* Unit Observations / Desc */}
          {unidade.observacoes && (
            <div className="bg-blue-50/70 border border-blue-100/90 rounded-2xl p-5 text-sm text-blue-950">
              <h3 className="font-bold text-blue-900 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#2b85ff]" />
                Observações e Diretrizes de Atendimento
              </h3>
              <p className="text-slate-700 leading-relaxed font-medium">
                {unidade.observacoes}
              </p>
            </div>
          )}

          {/* Specialties and Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Especialidades */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
              <h3 className="font-bold text-[#091426] text-base flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-[#2b85ff]" />
                Especialidades Atendidas
              </h3>

              {Array.isArray(unidade.especialidades) && unidade.especialidades.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {unidade.especialidades.map((esp, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-[#1a6edb] border border-blue-100"
                    >
                      {esp}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  Consulte a recepção da unidade para grade de especialidades do dia.
                </p>
              )}
            </div>

            {/* Serviços Oferecidos */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
              <h3 className="font-bold text-[#091426] text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Serviços Oferecidos
              </h3>

              {Array.isArray(unidade.servicos) && unidade.servicos.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {unidade.servicos.map((serv, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-xs sm:text-sm text-slate-700 font-medium"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{serv}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  Atendimento clínico geral, vacinação e triagem de enfermagem.
                </p>
              )}
            </div>
          </div>

          {/* Contato & Telefones adicionais */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-[#091426] text-base flex items-center gap-2">
              <Phone className="w-5 h-5 text-[#2b85ff]" />
              Canais de Contato e Telefones
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">Principal</span>
                <a
                  href={`tel:${unidade.telefone.replace(/\D/g, '')}`}
                  className="text-sm font-bold text-[#091426] hover:text-[#2b85ff] transition"
                >
                  {unidade.telefone}
                </a>
              </div>

              {Array.isArray(unidade.telefones_adicionais) &&
                unidade.telefones_adicionais.map((tel, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-400 block uppercase">Linha Direta {idx + 1}</span>
                    <a
                      href={`tel:${tel.replace(/\D/g, '')}`}
                      className="text-sm font-bold text-[#091426] hover:text-[#2b85ff] transition"
                    >
                      {tel}
                    </a>
                  </div>
                ))}
            </div>
          </div>

          {/* Localização no mapa */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-[#091426] text-base flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#2b85ff]" />
                  Localização Geográfica
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{unidade.endereco}</p>
              </div>

              <a
                href={unidade.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-[#2b85ff] hover:underline flex items-center gap-1"
              >
                Abrir no Google Maps <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="w-full h-72 rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative">
              <iframe
                title={`Mapa de ${unidade.nome}`}
                src={mapsEmbedSrc}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Avaliações */}
      {activeTab === 'avaliacoes' && (
        <div className="space-y-6">
          {/* Prominent Ratings Summary */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              {/* Google Rating */}
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="text-5xl font-extrabold text-[#091426] tracking-tight">
                  {unidade.google_rating.toFixed(1)}
                </div>
                <div>
                  <div className="flex items-center gap-1 text-amber-400 mb-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= Math.round(unidade.google_rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Google Maps • {unidade.google_total_avaliacoes} avaliações
                  </p>
                </div>
              </div>

              <div className="h-10 w-px bg-slate-200 hidden sm:block" />

              {/* Cuidaê Community Rating */}
              <div className="text-center sm:text-right">
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                  Comunidade Cuidaê
                </span>
                <p className="text-xl font-bold text-[#091426] mt-0.5">
                  {avaliacoes.length} {avaliacoes.length === 1 ? 'avaliação registrada' : 'avaliações registradas'}
                </p>
                <p className="text-xs text-slate-500">
                  Avaliações enviadas por pacientes e munícipes
                </p>
              </div>
            </div>
          </div>

          {/* Seção 1: Avaliações Reais do Google Maps */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center shadow-xs">
                  <span className="text-xs font-black text-[#4285F4]">G</span>
                </div>
                <h3 className="font-bold text-[#091426] text-base">
                  Avaliações Recentes no Google Maps
                </h3>
              </div>
              <a
                href={unidade.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-[#2b85ff] hover:underline flex items-center gap-1"
              >
                Ver todas ({unidade.google_total_avaliacoes}) <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {Array.isArray(unidade.google_reviews) && unidade.google_reviews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {unidade.google_reviews.map((rev, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-3 hover:border-slate-200 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {rev.autor.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#091426] leading-snug">{rev.autor}</p>
                            <span className="text-[10px] text-slate-400 block">{rev.data_relativa}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-0.5 text-amber-400 shrink-0">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${
                                s <= rev.nota
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic">
                        "{rev.texto}"
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="inline-flex items-center gap-1 text-slate-500 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        Avaliação verificada no Google
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 text-center text-xs text-slate-500">
                Esta unidade possui nota média de <strong className="text-slate-800">{unidade.google_rating} ★</strong> no Google Maps.
                <a
                  href={unidade.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#2b85ff] ml-1 underline font-semibold"
                >
                  Clique para conferir os comentários no Google.
                </a>
              </div>
            )}
          </div>

          {/* Form: Avaliar esta unidade pelo app Cuidaê */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-[#2b85ff]" />
              <h3 className="font-bold text-[#091426] text-base">
                Avaliar esta unidade no App Cuidaê
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Sua opinião ajuda outros moradores de Garanhuns a encontrarem o melhor atendimento.
            </p>

            {reviewSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-xs font-semibold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                Obrigado! Sua avaliação foi registrada com sucesso e já está visível abaixo.
              </div>
            )}

            {reviewError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-xs font-semibold text-red-800">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                {reviewError}
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nota do Atendimento:
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const currentRating = hoverRating !== null ? hoverRating : nota
                    const isFilled = star <= currentRating
                    return (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setNota(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="p-1 rounded-lg hover:scale-110 transition-transform focus:outline-none"
                      >
                        <Star
                          className={`w-7 h-7 transition-colors ${
                            isFilled
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    )
                  })}
                  <span className="ml-2 text-xs font-bold text-slate-700">
                    {nota} de 5 estrelas
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Seu Nome (opcional):
                  </label>
                  <input
                    type="text"
                    value={nomeAutor}
                    onChange={(e) => setNomeAutor(e.target.value)}
                    placeholder="Ex: Maria Clara"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-[#091426] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2b85ff]/30 focus:border-[#2b85ff] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Seu Comentário ou Relato:
                </label>
                <textarea
                  rows={3}
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Conte como foi sua experiência: tempo de espera, atendimento dos médicos, organização..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-[#091426] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2b85ff]/30 focus:border-[#2b85ff] transition resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#2b85ff] hover:bg-blue-600 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-sm transition"
              >
                <Send className="w-4 h-4" />
                {submittingReview ? 'Enviando...' : 'Publicar Avaliação'}
              </button>
            </form>
          </div>

          {/* Seção 2: Reviews enviadas pelo App */}
          <div className="space-y-4">
            <h3 className="font-bold text-[#091426] text-base flex items-center justify-between">
              <span>Depoimentos Enviados pelo Cuidaê</span>
              <span className="text-xs text-slate-400 font-normal">
                {avaliacoes.length} depoimento{avaliacoes.length !== 1 ? 's' : ''}
              </span>
            </h3>

            {avaliacoes.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-500 shadow-sm">
                <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">Ainda não há avaliações cadastradas</p>
                <p className="text-xs text-slate-400 mt-1">Seja o primeiro a avaliar esta unidade de saúde acima!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {avaliacoes.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-2 transition-all hover:border-slate-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#2b85ff]/10 text-[#2b85ff] flex items-center justify-center font-bold text-xs uppercase">
                          {item.nome.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#091426] leading-none">{item.nome}</p>
                          <span className="text-[11px] text-slate-400">
                            {new Date(item.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= item.nota
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-sm text-slate-700 leading-relaxed pt-1">
                      {item.comentario}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
