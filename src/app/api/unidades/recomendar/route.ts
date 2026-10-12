import { NextResponse } from 'next/server'
import unidadesData from '../../../../../data/unidades_saude.json'
import type { UnidadeSaudeCompleta } from '@/lib/types'

export const dynamic = 'force-dynamic'

function calcularDistanciaKm(lat1: number, lon1: number, lat2: number, lon2: number) {
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const diagnostico = searchParams.get('diagnostico') || ''
    const especialidade = searchParams.get('especialidade') || ''
    const tipoUnidade = searchParams.get('tipoUnidade') || ''
    const latParam = searchParams.get('lat')
    const lngParam = searchParams.get('lng')

    const userLat = latParam ? parseFloat(latParam) : null
    const userLng = lngParam ? parseFloat(lngParam) : null

    const termoDiag = diagnostico.toLowerCase().trim()
    const termoEsp = especialidade.toLowerCase().trim()
    const termoTipo = tipoUnidade.toLowerCase().trim()

    let candidatas = (unidadesData as unknown as UnidadeSaudeCompleta[]) || []

    if (termoTipo) {
      const unidadesDoTipo = candidatas.filter((u) => {
        const cat = (u.categoria || '').toLowerCase()
        const label = (u.tipo_label || '').toLowerCase()
        const nome = (u.nome || '').toLowerCase()
        return cat.includes(termoTipo) || label.includes(termoTipo) || nome.includes(termoTipo)
      })
      if (unidadesDoTipo.length > 0) {
        candidatas = unidadesDoTipo
      }
    }

    const recomendacoes = candidatas.map((unidade) => {
      let score = 0
      const motivos: string[] = []

      if (termoTipo) {
        const cat = (unidade.categoria || '').toLowerCase()
        const label = (unidade.tipo_label || '').toLowerCase()
        if (cat.includes(termoTipo) || label.includes(termoTipo)) {
          score += 40
          motivos.push(`Tipo de atendimento indicado (${unidade.tipo_label})`)
        }
      }

      const isUrgencia =
        termoDiag.includes('urg') ||
        termoDiag.includes('emerg') ||
        termoDiag.includes('grave') ||
        termoDiag.includes('dor forte') ||
        termoDiag.includes('upa') ||
        termoDiag.includes('pronto')

      if (isUrgencia && unidade.tem_urgencia) {
        score += 35
        motivos.push('Possui serviço de urgência e emergência 24h')
      }

      let matchedSpecialty: string | null = null
      if (Array.isArray(unidade.especialidades)) {
        for (const esp of unidade.especialidades) {
          const espLower = esp.toLowerCase()
          if (termoEsp && (espLower.includes(termoEsp) || termoEsp.includes(espLower))) {
            score += 30
            matchedSpecialty = esp
            break
          } else if (termoDiag && espLower.includes(termoDiag)) {
            score += 25
            matchedSpecialty = esp
            break
          }
        }
      }

      if (matchedSpecialty) {
        motivos.push(`Especialidade disponível: ${matchedSpecialty}`)
      }

      const rating = unidade.google_rating || 3.0
      score += rating * 4

      let distanciaKm: number | null = null
      if (userLat !== null && !isNaN(userLat) && userLng !== null && !isNaN(userLng)) {
        distanciaKm = calcularDistanciaKm(userLat, userLng, unidade.latitude, unidade.longitude)
        if (distanciaKm !== null) {
          const bonusProximidade = Math.max(0, 25 - distanciaKm * 3)
          score += bonusProximidade
          motivos.push(`Proximidade de você (~${distanciaKm} km)`)
        }
      }

      const motivoRecomendacao =
        motivos.length > 0
          ? motivos.join('. ') + '.'
          : `Unidade de referência com avaliação ${rating}/5 no Google.`

      return {
        ...unidade,
        score: Math.round(score * 10) / 10,
        distanciaKm: distanciaKm ?? undefined,
        motivoRecomendacao
      }
    })

    recomendacoes.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      if (a.distanciaKm !== undefined && b.distanciaKm !== undefined) {
        return a.distanciaKm - b.distanciaKm
      }
      return (b.google_rating || 0) - (a.google_rating || 0)
    })

    return NextResponse.json({
      success: true,
      total: recomendacoes.length,
      unidades: recomendacoes
    })
  } catch (error: any) {
    console.error('Erro ao calcular recomendações:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno ao processar recomendações' },
      { status: 500 }
    )
  }
}
