import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import crypto from 'crypto'
import { saveTriagemToStore } from '@/lib/db/triageStore'

export const dynamic = 'force-dynamic'

const CANDIDATE_MODELS = ['gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest']

const PROMPT_DIAGNOSTICO = `Você é o assistente de triagem "Cuidaê / SaúdePraTodos" do sistema de saúde brasileiro (SUS).

Você deve analisar os sintomas do paciente (descritos em texto ou inferidos de uma imagem) e gerar uma avaliação de triagem completa e humanizada.

REGRAS:
1. NUNCA faça diagnóstico definitivo. Diga "há uma possibilidade de" ou "os sintomas sugerem que pode ser".
2. Sempre recomende buscar atendimento médico presencial se houver piora.
3. Se detectar possível emergência (dor no peito, dor irradiada para o braço, falta de ar grave, AVC, hemorragia intensa, parada respiratória, fratura exposta), marque prioridade como "Urgente" e tipoUnidade como "SAMU" ou "UPA".
4. Seja empático, mas direto e acolhedor (3 a 4 frases no máximo para a mensagem principal).
5. Mencione o nome da condição provável em linguagem simples.
6. Inclua uma orientação prática e clara de cuidado imediato.

Retorne APENAS um JSON válido com esta estrutura exata:
{
  "mensagem": "Sua fala humanizada e acolhedora para o paciente",
  "recomendacao": "Possível condição clínica (ex: Avaliação para Arbovirose / Dengue)",
  "especialidade": "Especialidade médica indicada (ex: Clínico Geral / Infectologia)",
  "prioridade": "Normal | Média | Alta | Urgente",
  "orientacao": "Cuidados imediatos e orientação preventiva que o paciente deve tomar",
  "tipoUnidade": "UBS | UPA | CAPS | SAMU"
}`

function mapearUrgencia(prioridade: string) {
  switch (prioridade) {
    case 'Urgente':
      return { nivel_urgencia: 'vermelho' as const, recomendacao: 'upa' as const }
    case 'Alta':
    case 'Média':
      return { nivel_urgencia: 'amarelo' as const, recomendacao: 'ubs' as const }
    case 'Normal':
    default:
      return { nivel_urgencia: 'verde' as const, recomendacao: 'teleconsulta' as const }
  }
}

function gerarLinkMaps(lat: number | null, lng: number | null, tipoUnidade: string) {
  const TERMOS_BUSCA: Record<string, string | null> = {
    UBS: 'UBS Unidade Básica de Saúde',
    UPA: 'UPA Unidade de Pronto Atendimento',
    Hospital: 'Hospital pronto socorro',
    CAPS: 'CAPS Centro de Atenção Psicossocial',
    SAMU: null
  }

  const termo = TERMOS_BUSCA[tipoUnidade] || TERMOS_BUSCA['UBS']
  if (!termo) {
    return {
      label: '🚑 Ligue SAMU: 192',
      url: 'tel:192',
      tipo: 'telefone'
    }
  }

  const termoEncoded = encodeURIComponent(termo)
  const url = lat && lng
    ? `https://www.google.com/maps/search/${termoEncoded}/@${lat},${lng},14z`
    : `https://www.google.com/maps/search/${termoEncoded}`

  return {
    label: `📍 Ver ${tipoUnidade} mais próxima no Google Maps`,
    url,
    tipo: 'mapa'
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sintoma, lat, lng, historico } = body

    if (!sintoma || !sintoma.trim()) {
      return NextResponse.json(
        { error: 'O campo "sintoma" é obrigatório.' },
        { status: 400 }
      )
    }

    const apiKey = process.env.GEMINI_API_KEY
    let respostaIA: any = null

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey)
        let contextoPaciente = `Relato do paciente: "${sintoma}"`

        if (Array.isArray(historico) && historico.length > 0) {
          const historicoTexto = historico
            .filter((m: any) => m.texto)
            .slice(-6)
            .map((m: any) => `${m.remetente === 'usuario' ? 'Paciente' : 'Assistente Cuidaê'}: ${m.texto}`)
            .join('\n')
          contextoPaciente = `Histórico prévio da conversa:\n${historicoTexto}\n\nNova mensagem do paciente: "${sintoma}"\n\nResponda de forma humanizada e atualize a triagem médica considerando o contexto acumulado.`
        }

        for (const modelName of CANDIDATE_MODELS) {
          try {
            const model = genAI.getGenerativeModel({
              model: modelName,
              generationConfig: { responseMimeType: 'application/json' }
            })

            const result = await model.generateContent([
              { text: PROMPT_DIAGNOSTICO },
              { text: contextoPaciente }
            ])

            const raw = result.response.text()
            const jsonLimpo = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
            respostaIA = JSON.parse(jsonLimpo)
            respostaIA.fonteIA = `Google Gemini (${modelName})`
            break
          } catch (modelErr: any) {
            console.warn(`[Gemini Next.js API] Modelo ${modelName} falhou:`, modelErr.message)
          }
        }
      } catch (err: any) {
        console.warn('[Gemini Next.js API] Falha na chamada da IA:', err.message)
      }
    }

    // Fallback clínico inteligente caso Gemini offline ou sem chave
    if (!respostaIA) {
      const s = sintoma.toLowerCase()
      const isUrgente = s.includes('peito') || s.includes('falta de ar') || s.includes('desmaio') || s.includes('sangue')
      respostaIA = {
        mensagem: isUrgente
          ? 'Identifiquei sintomas que demandam atenção imediata. Recomendamos procurar uma unidade de emergência sem demora.'
          : 'Com base nos sintomas informados, é recomendada uma avaliação na rede de Atenção Básica ou agendamento de teleconsulta.',
        recomendacao: isUrgente ? 'Avaliação Cardiorrespiratória de Emergência' : 'Avaliação Clínica Geral',
        especialidade: isUrgente ? 'Cardiologia / Urgência' : 'Clínico Geral',
        prioridade: isUrgente ? 'Urgente' : 'Alta',
        orientacao: 'Evite automedicação. Em caso de piora ou sintomas como tontura ou dor intensa, procure atendimento médico presencial.',
        tipoUnidade: isUrgente ? 'UPA' : 'UBS',
        fonteIA: 'Protocolo Clínico Cuidaê (Sistema Seguro)'
      }
    }

    const tipoUnidade = respostaIA.tipoUnidade || 'UBS'
    const linkMaps = gerarLinkMaps(lat || null, lng || null, tipoUnidade)
    const mapeamento = mapearUrgencia(respostaIA.prioridade || 'Alta')
    const id = crypto.randomUUID()

    // Persiste no banco unificado para recuperação em prontuário e agendamento
    const triagemSalva = await saveTriagemToStore({
      id,
      user_id: 'anonimo',
      sintoma_principal: sintoma,
      duracao: 'Recente',
      intensidade: respostaIA.prioridade === 'Urgente' ? 9 : respostaIA.prioridade === 'Alta' ? 7 : 4,
      nivel_urgencia: mapeamento.nivel_urgencia,
      recomendacao: mapeamento.recomendacao,
      especialidade: respostaIA.especialidade,
      explicacao: respostaIA.mensagem,
      orientacao: respostaIA.orientacao,
      tipoUnidade,
      mapa: linkMaps,
      fonteIA: respostaIA.fonteIA,
      created_at: new Date().toISOString()
    })

    return NextResponse.json({
      id: triagemSalva.id,
      remetente: 'bot',
      texto: respostaIA.mensagem,
      triagem: {
        id: triagemSalva.id,
        recomendacao: respostaIA.recomendacao,
        especialidade: respostaIA.especialidade,
        local: tipoUnidade === 'UPA' ? 'UPA / Pronto-Socorro 24h' : 'UBS Mais Próxima',
        prioridade: respostaIA.prioridade,
        orientacao: respostaIA.orientacao,
        tipoUnidade,
        nivel_urgencia: mapeamento.nivel_urgencia
      },
      mapa: linkMaps,
      fonteIA: respostaIA.fonteIA,
      timestamp: triagemSalva.created_at
    })

  } catch (err: any) {
    console.error('Erro ao processar sintomas na API:', err)
    return NextResponse.json(
      { error: err.message || 'Erro interno ao processar triagem' },
      { status: 500 }
    )
  }
}
