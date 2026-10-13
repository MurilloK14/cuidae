'use client'

import React, { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  MapPin, Phone, Clock, Star, Search, Building2, Activity,
  Heart, ShieldCheck, Users, Ambulance, ExternalLink, Filter,
  ArrowUpDown, Navigation, ThumbsUp, ChevronRight, Sparkles,
  Info, CheckCircle2, AlertTriangle, RefreshCw, Calendar
} from 'lucide-react'
import type { UnidadeSaudeCompleta, CategoriaUnidade, OrdenacaoUnidades } from '@/lib/types'

function calcDist(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c * 10) / 10
}

const CATEGORIAS_CONFIG: Array<{ id: string; label: string; icon: any }> = [
  { id: 'todos', label: 'Todos', icon: Building2 },
  { id: 'hospital', label: 'Hospitais', icon: Building2 },
  { id: 'policlinica', label: 'Policlínicas', icon: Activity },
  { id: 'caps', label: 'CAPS', icon: Heart },
  { id: 'ubs', label: 'UBS', icon: ShieldCheck },
  { id: 'cras_creas', label: 'CRAS / CREAS', icon: Users },
  { id: 'samu', label: 'SAMU', icon: Ambulance },
]

function UnidadesContent() {
  const searchParams = useSearchParams()
  const diagnosticoParam = searchParams.get('diagnostico') || ''
  const especialidadeParam = searchParams.get('especialidade') || ''
  const tipoParam = searchParams.get('tipo') || ''

  const isFromTriage = Boolean(diagnosticoParam || especialidadeParam || tipoParam)

  const [unidades, setUnidades] = useState<UnidadeSaudeCompleta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // User location
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  // Filters & sorting
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('todos')
  const [busca, setBusca] = useState<string>('')
  const [ordenacao, setOrdenacao] = useState<OrdenacaoUnidades>(isFromTriage ? 'recomendacao' : 'avaliacao')

  // Request user geolocation on mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      setLocating(true)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          })
          setLocating(false)
        },
        (err) => {
          console.log('Geolocalização não autorizada ou indisponível:', err.message)
          setLocating(false)
        },
        { enableHighAccuracy: false, timeout: 8000 }
      )
    }
  }, [])

  // Fetch data
  const carregarUnidades = async () => {
    setLoading(true)
    setError(null)
    try {
      let url = '/api/unidades'
      if (isFromTriage) {
        const queryParams = new URLSearchParams()
        if (diagnosticoParam) queryParams.set('diagnostico', diagnosticoParam)
        if (especialidadeParam) queryParams.set('especialidade', especialidadeParam)
        if (tipoParam) queryParams.set('tipoUnidade', tipoParam)
        if (userLocation) {
          queryParams.set('lat', String(userLocation.lat))
          queryParams.set('lng', String(userLocation.lng))
        }
        url = `/api/unidades/recomendar?${queryParams.toString()}`
      }

      const res = await fetch(url)
      if (!res.ok) throw new Error('Não foi possível carregar as unidades de saúde')
      const data = await res.json()
      
      const lista: UnidadeSaudeCompleta[] = data.unidades || []
      setUnidades(lista)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Falha na conexão com o servidor')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarUnidades()
  }, [diagnosticoParam, especialidadeParam, tipoParam, userLocation])

  const handleSolicitarLocalizacao = () => {
    if (!('geolocation' in navigator)) {
      setLocationError('Navegador não suporta geolocalização.')
      return
    }
    setLocating(true)
    setLocationError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })
        setLocating(false)
      },
      (err) => {
        setLocationError('Permissão negada ou sinal de GPS indisponível.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // Filter and sort units
  const unidadesProcessadas = useMemo(() => {
    let result = unidades.map((u) => {
      // Calculate or retain distance
      let dist = u.distanciaKm
      if (userLocation && (dist === undefined || dist === null)) {
        dist = calcDist(userLocation.lat, userLocation.lng, u.latitude, u.longitude)
      }
      return { ...u, distanciaKm: dist }
    })

    // Filter by category
    if (categoriaAtiva !== 'todos') {
      if (categoriaAtiva === 'cras_creas') {
        result = result.filter(
          (u) => u.categoria === 'cras' || u.categoria === 'creas'
        )
      } else {
        result = result.filter((u) => u.categoria === categoriaAtiva)
      }
    }

    // Filter by text search
    if (busca.trim()) {
      const q = busca.toLowerCase().trim()
      result = result.filter((u) => {
        const nome = (u.nome || '').toLowerCase()
        const bairro = (u.bairro || '').toLowerCase()
        const endereco = (u.endereco || '').toLowerCase()
        const tipoLabel = (u.tipo_label || '').toLowerCase()
        const especialidades = (u.especialidades || []).join(' ').toLowerCase()
        const servicos = (u.servicos || []).join(' ').toLowerCase()
        return (
          nome.includes(q) ||
          bairro.includes(q) ||
          endereco.includes(q) ||
          tipoLabel.includes(q) ||
          especialidades.includes(q) ||
          servicos.includes(q)
        )
      })
    }

    // Sort
    result.sort((a, b) => {
      if (ordenacao === 'recomendacao') {
        const scoreA = a.score ?? 0
        const scoreB = b.score ?? 0
        if (scoreB !== scoreA) return scoreB - scoreA
        return (b.google_rating || 0) - (a.google_rating || 0)
      }
      if (ordenacao === 'distancia') {
        const distA = a.distanciaKm ?? 99999
        const distB = b.distanciaKm ?? 99999
        return distA - distB
      }
      if (ordenacao === 'avaliacao') {
        return (b.google_rating || 0) - (a.google_rating || 0)
      }
      if (ordenacao === 'nome') {
        return a.nome.localeCompare(b.nome, 'pt-BR')
      }
      return 0
    })

    return result
  }, [unidades, categoriaAtiva, busca, ordenacao, userLocation])

  return (
    <div className="space-y-8 animate-fade-in pb-12 font-jakarta">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#2b85ff] via-[#1a6edb] to-[#091426] rounded-2xl p-6 sm:p-10 text-white shadow-md border border-blue-600/30">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-white backdrop-blur-md mb-4 border border-white/20">
            <MapPin className="w-3.5 h-3.5 text-white" />
            Rede de Saúde Municipal e Regional
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3 text-white">
            Unidades de Saúde em Garanhuns
          </h1>
          <p className="text-blue-100 text-base sm:text-lg leading-relaxed mb-6 max-w-2xl">
            Encontre hospitais, policlínicas, postos de saúde (UBS) e serviços especializados perto de você com horários, especialidades e avaliação em tempo real.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleSolicitarLocalizacao}
              disabled={locating}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-[#091426] hover:bg-blue-50 text-sm font-semibold rounded-xl transition shadow-sm"
            >
              <Navigation className={`w-4 h-4 text-[#2b85ff] ${locating ? 'animate-spin' : ''}`} />
              {userLocation
                ? 'Localização Ativa'
                : locating
                ? 'Localizando...'
                : 'Usar Minha Localização'}
            </button>

            {userLocation && (
              <span className="inline-flex items-center gap-1.5 text-xs text-blue-100 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-xl border border-white/15">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                Distâncias calculadas para sua posição
              </span>
            )}
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-10 bottom-6 opacity-10 hidden lg:block pointer-events-none">
          <Building2 className="w-64 h-64 text-white" />
        </div>
      </div>

      {/* Triage Context Banner (if arrived from triage) */}
      {isFromTriage && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-slate-900 border border-blue-200/80 dark:border-blue-900/60 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2b85ff] text-white flex items-center justify-center shrink-0 shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#2b85ff] dark:text-blue-400">
                    Recomendação Personalizada
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-950/80 text-[#1a6edb] dark:text-blue-300">
                    Baseado na sua triagem
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#091426] dark:text-white mt-0.5">
                  {diagnosticoParam ? `Sintoma: "${diagnosticoParam}"` : 'Orientação Médica Cuidaê'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                  {especialidadeParam && (
                    <span className="font-semibold text-slate-800 dark:text-slate-200 mr-2">
                      Especialidade indicada: {especialidadeParam}
                    </span>
                  )}
                  As unidades abaixo foram ordenadas pelo algoritmo de compatibilidade clínica e urgência.
                </p>
              </div>
            </div>

            <Link
              href="/unidades"
              className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition whitespace-nowrap"
            >
              Ver todas sem filtro de triagem
            </Link>
          </div>
        </div>
      )}

      {/* Search & Sort Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por unidade, especialidade, bairro ou serviço..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-[#091426] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2b85ff]/30 focus:border-[#2b85ff] transition"
            />
            {busca && (
              <button
                onClick={() => setBusca('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 bg-slate-100 dark:bg-slate-700 rounded-md px-1.5 py-0.5"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Sort Toggles */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 shrink-0">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" />
              Ordenar:
            </span>
            {isFromTriage && (
              <button
                onClick={() => setOrdenacao('recomendacao')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
                  ordenacao === 'recomendacao'
                    ? 'bg-[#2b85ff] text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Mais Recomendado
              </button>
            )}
            <button
              onClick={() => setOrdenacao('distancia')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
                ordenacao === 'distancia'
                  ? 'bg-[#2b85ff] text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              Mais Próximo
            </button>
            <button
              onClick={() => setOrdenacao('avaliacao')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
                ordenacao === 'avaliacao'
                  ? 'bg-[#2b85ff] text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              Melhor Avaliado
            </button>
            <button
              onClick={() => setOrdenacao('nome')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                ordenacao === 'nome'
                  ? 'bg-[#2b85ff] text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
              }`}
            >
              Nome (A-Z)
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 no-scrollbar">
          {CATEGORIAS_CONFIG.map((cat) => {
            const Icon = cat.icon
            const isActive = categoriaAtiva === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setCategoriaAtiva(cat.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#091426] dark:bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#2b85ff] dark:text-white' : 'text-slate-400'}`} />
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 px-1">
        <span>
          Mostrando <strong className="text-[#091426] dark:text-white">{unidadesProcessadas.length}</strong> unidade{unidadesProcessadas.length !== 1 ? 's' : ''} de saúde
        </span>
        {busca && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Filtrado por: &quot;{busca}&quot;
          </span>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm animate-pulse space-y-4">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
              <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
              <div className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
              <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded-xl w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <h3 className="text-base font-bold text-red-900 dark:text-red-200 mb-1">Erro ao carregar unidades</h3>
          <p className="text-sm text-red-700 dark:text-red-300 mb-4">{error}</p>
          <button
            onClick={carregarUnidades}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar Novamente
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && unidadesProcessadas.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-12 text-center shadow-sm">
          <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#091426] dark:text-white mb-1">Nenhuma unidade encontrada</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
            Não encontramos resultados para os filtros selecionados. Tente buscar por outros termos ou remover os filtros de categoria.
          </p>
          <button
            onClick={() => {
              setBusca('')
              setCategoriaAtiva('todos')
            }}
            className="px-5 py-2.5 bg-[#2b85ff] text-white text-sm font-semibold rounded-xl hover:bg-blue-600 transition shadow-sm"
          >
            Limpar todos os filtros
          </button>
        </div>
      )}

      {/* Unit Cards Grid */}
      {!loading && !error && unidadesProcessadas.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {unidadesProcessadas.map((unidade) => {
            const statusColor =
              unidade.status_color === 'emerald'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                : unidade.status_color === 'amber'
                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'

            const isRecommended = Boolean(unidade.motivoRecomendacao && isFromTriage)

            return (
              <div
                key={unidade.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 hover:shadow-md flex flex-col justify-between overflow-hidden ${
                  isRecommended
                    ? 'border-blue-300 dark:border-blue-700 ring-2 ring-[#2b85ff]/15 shadow-sm'
                    : 'border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm'
                }`}
              >
                <div className="p-5 sm:p-6 space-y-4 flex-1">
                  {/* Card Header: Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#2b85ff]/10 dark:bg-blue-500/20 text-[#2b85ff] dark:text-blue-400 capitalize">
                      {unidade.categoria}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {unidade.sus_gratuito && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                          <ShieldCheck className="w-3 h-3" />
                          100% SUS
                        </span>
                      )}

                      {unidade.status && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${statusColor}`}>
                          {unidade.status}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Type */}
                  <div>
                    <h3 className="text-lg font-bold text-[#091426] dark:text-white leading-snug hover:text-[#2b85ff] dark:hover:text-blue-400 transition-colors">
                      <Link href={`/unidades/${unidade.id}`}>
                        {unidade.nome}
                      </Link>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                      {unidade.tipo_label}
                    </p>
                  </div>

                  {/* Highlighted Recommendation Reason Box (if triage) */}
                  {unidade.motivoRecomendacao && isFromTriage && (
                    <div className="bg-gradient-to-r from-blue-50/90 to-indigo-50/70 dark:from-blue-950/50 dark:to-slate-900 border border-blue-200/90 dark:border-blue-800/60 rounded-xl p-3 text-xs text-blue-950 dark:text-blue-200 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-[#2b85ff] dark:text-blue-400">
                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                        <span>Por que é recomendada:</span>
                        {unidade.score !== undefined && (
                          <span className="ml-auto text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-[#2b85ff] text-white">
                            Score {unidade.score}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        {unidade.motivoRecomendacao}
                      </p>
                    </div>
                  )}

                  {/* Key Info: Address, Phone, Hours, Rating, Distance */}
                  <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-50 dark:border-slate-800">
                    {/* Address & Bairro */}
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">
                        {unidade.endereco} • <strong className="text-slate-700 dark:text-slate-200 font-semibold">{unidade.bairro}</strong>
                      </span>
                    </div>

                    {/* Phone */}
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                      <a
                        href={`tel:${unidade.telefone.replace(/\D/g, '')}`}
                        className="hover:text-[#2b85ff] dark:hover:text-blue-400 font-medium transition"
                      >
                        {unidade.telefone}
                      </a>
                    </div>

                    {/* Operating Hours */}
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                      <span className="line-clamp-1">{unidade.horario}</span>
                    </div>

                    {/* Ratings & Distance Row */}
                    <div className="flex items-center justify-between pt-1 text-slate-700 dark:text-slate-200 font-medium">
                      {/* Rating do Google */}
                      <div className="flex items-center gap-1.5 bg-amber-50/80 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800/60 px-2 py-1 rounded-lg">
                        <div className="flex items-center text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        </div>
                        <span className="font-extrabold text-[#091426] dark:text-amber-200 text-xs">{unidade.google_rating.toFixed(1)}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          no Google ({unidade.google_total_avaliacoes})
                        </span>
                      </div>

                      {/* Distance */}
                      {unidade.distanciaKm !== undefined && unidade.distanciaKm !== null && (
                        <div className="flex items-center gap-1 text-[#2b85ff] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border dark:border-blue-800/40 px-2 py-0.5 rounded-md text-[11px] font-semibold">
                          <Navigation className="w-3 h-3" />
                          <span>~{unidade.distanciaKm} km</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Top 3 Specialties as Tags */}
                  {Array.isArray(unidade.especialidades) && unidade.especialidades.length > 0 && (
                    <div className="pt-2">
                      <div className="flex flex-wrap gap-1">
                        {unidade.especialidades.slice(0, 3).map((esp, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition"
                          >
                            {esp}
                          </span>
                        ))}
                        {unidade.especialidades.length > 3 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium text-slate-400 dark:text-slate-500">
                            +{unidade.especialidades.length - 3} mais
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="p-4 bg-slate-50/80 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                  <Link
                    href={`/agendamento?unidadeId=${unidade.id}&especialidade=${encodeURIComponent(especialidadeParam || '')}&diagnostico=${encodeURIComponent(diagnosticoParam || '')}&sintomas=${encodeURIComponent(diagnosticoParam || '')}`}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#2b85ff] hover:bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs transition"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Agendar Atendimento</span>
                  </Link>

                  <div className="flex items-center gap-2">
                    <a
                      href={unidade.google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition"
                    >
                      <span>Maps</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>

                    <Link
                      href={`/unidades/${unidade.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition"
                    >
                      <span>Detalhes</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function UnidadesPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-slate-500 animate-pulse">
          Carregando unidades de saúde...
        </div>
      }
    >
      <UnidadesContent />
    </Suspense>
  )
}
