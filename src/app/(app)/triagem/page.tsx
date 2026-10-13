'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { submitTriagem } from '@/lib/triagem/actions'
import { fetchBoasVindas, enviarSintomas, enviarImagem } from '@/services/api'
import { 
  Thermometer, 
  Pill, 
  Camera, 
  Upload, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  AlertCircle,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  MapPin,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  AlertTriangle,
  Stethoscope,
  CheckCircle2,
  FileText,
  Building2,
  Calendar
} from 'lucide-react'

import Image from 'next/image'

interface ChatMessage {
  id: number
  remetente: 'bot' | 'usuario'
  texto?: string
  imagem?: string
  triagem?: {
    id?: string
    recomendacao?: string
    especialidade?: string
    local?: string
    prioridade?: string
    orientacao?: string
    tipoUnidade?: string
    nivel_urgencia?: 'verde' | 'amarelo' | 'vermelho'
  } | null
  mapa?: {
    label: string
    url: string
    tipo?: string
  } | null
  fonteIA?: string
  timestamp?: string
}

let messageCounter = 1

const SUGESTOES_SINTOMAS = [
  '🤒 Febre alta e dores pelo corpo',
  '🤕 Dor de cabeça forte persistente',
  '🫀 Dor no peito ou falta de ar',
  '🔴 Manchas avermelhadas e coceira na pele',
  '🤢 Vômitos, enjoo e dor de estômago',
  '🤧 Tosse com secreção e dor de garganta',
]

export default function TriagemPage() {
  const router = useRouter()

  // Modo: 'chat' (Assistente de IA) ou 'formulario' (Passo a Passo)
  const [mode, setMode] = useState<'chat' | 'formulario'>('chat')

  // Estado do Chat de IA
  const [mensagens, setMensagens] = useState<ChatMessage[]>([])
  const [inputTexto, setInputTexto] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [localizacao, setLocalizacao] = useState<{ lat: number; lng: number } | null>(null)
  const [locStatus, setLocStatus] = useState<'solicitando' | 'ativa' | 'negada'>('solicitando')
  const [resultadoRecente, setResultadoRecente] = useState<ChatMessage['triagem'] | null>(null)
  const [recorteId, setRecorteId] = useState<string | null>(null)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const chatFileInputRef = useRef<HTMLInputElement>(null)

  // Estado do Formulário Estruturado
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const [sintomaPrincipal, setSintomaPrincipal] = useState('')
  const [duracao, setDuracao] = useState('')
  const [intensidade, setIntensidade] = useState(5)
  const [temFebre, setTemFebre] = useState('')
  const [temDor, setTemDor] = useState('')
  const [localDor, setLocalDor] = useState('')
  const [tomaMedicamento, setTomaMedicamento] = useState('')
  const [qualMedicamento, setQualMedicamento] = useState('')
  const [condicoesCronicas, setCondicoesCronicas] = useState<string[]>([])
  const [estaGravida, setEstaGravida] = useState('')

  const [foto, setFoto] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [descricaoFoto, setDescricaoFoto] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Solicitar localização ao carregar
  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocalizacao({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          setLocStatus('ativa')
        },
        () => {
          setLocStatus('negada')
        },
        { timeout: 8000 }
      )
    } else {
      setLocStatus('negada')
    }
  }, [])

  // Inicializar Chat
  const iniciarChat = async () => {
    setIsTyping(true)
    setResultadoRecente(null)
    setRecorteId(null)
    try {
      const data = await fetchBoasVindas()
      setMensagens([
        {
          id: messageCounter++,
          remetente: 'bot',
          texto: data?.texto || 'Olá! Sou a Assistente Virtual de Triagem Cuidaê. Me conte detalhadamente o que você está sentindo hoje ou envie uma foto de alguma alteração física (pele, lesão, machucado) para receber orientação clínica imediata.',
          timestamp: new Date().toISOString()
        }
      ])
    } catch {
      setMensagens([
        {
          id: messageCounter++,
          remetente: 'bot',
          texto: 'Olá! Sou a Assistente Virtual de Triagem Cuidaê. Me conte detalhadamente o que você está sentindo hoje ou envie uma foto de alguma alteração física para receber orientação clínica imediata.',
          timestamp: new Date().toISOString()
        }
      ])
    } finally {
      setIsTyping(false)
    }
  }

  useEffect(() => {
    if (mensagens.length === 0) {
      iniciarChat()
    }
  }, [])

  // Rolar para a última mensagem
  useEffect(() => {
    if (mode === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [mensagens, isTyping, mode])

  // Enviar Mensagem para a IA
  const handleEnviarMensagem = async (textoPersonalizado?: string) => {
    const textoParaEnviar = (textoPersonalizado || inputTexto).trim()
    if (!textoParaEnviar || isTyping) return

    const userMsgId = messageCounter++
    const novaMensagemUsuario: ChatMessage = {
      id: userMsgId,
      remetente: 'usuario',
      texto: textoParaEnviar,
      timestamp: new Date().toISOString()
    }

    setMensagens((prev) => [...prev, novaMensagemUsuario])
    setInputTexto('')
    setIsTyping(true)

    try {
      // Histórico anterior para dar contexto à IA
      const historicoRecente = mensagens.slice(-6).map(m => ({
        remetente: m.remetente,
        texto: m.texto || ''
      }))

      const data = await enviarSintomas(textoParaEnviar, 'Gratuito', localizacao, historicoRecente)

      const botMsgId = messageCounter++
      const novaMensagemBot: ChatMessage = {
        id: botMsgId,
        remetente: 'bot',
        texto: data.texto,
        triagem: data.triagem || null,
        mapa: data.mapa || null,
        fonteIA: data.fonteIA || 'Google Gemini Flash',
        timestamp: data.timestamp || new Date().toISOString()
      }

      setMensagens((prev) => [...prev, novaMensagemBot])

      if (data.triagem) {
        setResultadoRecente(data.triagem)
        if (data.id) setRecorteId(data.id)
      }
    } catch (err: any) {
      setMensagens((prev) => [
        ...prev,
        {
          id: messageCounter++,
          remetente: 'bot',
          texto: `⚠️ Tive uma breve instabilidade ao processar: ${err.message || 'Tente novamente em instantes'}. Você também pode usar a aba de Formulário Estruturado acima.`,
          timestamp: new Date().toISOString()
        }
      ])
    } finally {
      setIsTyping(false)
    }
  }

  // Enviar Foto para Análise Dermatológica / Lesão
  const handleEnviarFotoChat = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert('A foto deve ter no máximo 5MB')
      return
    }

    const previewUrl = URL.createObjectURL(file)

    setMensagens((prev) => [
      ...prev,
      {
        id: messageCounter++,
        remetente: 'usuario',
        imagem: previewUrl,
        texto: 'Enviou uma imagem para avaliação visual.',
        timestamp: new Date().toISOString()
      }
    ])

    setIsTyping(true)

    try {
      const data = await enviarImagem(file, 'Gratuito', localizacao)

      setMensagens((prev) => [
        ...prev,
        {
          id: messageCounter++,
          remetente: 'bot',
          texto: data.texto,
          triagem: data.triagem || null,
          mapa: data.mapa || null,
          fonteIA: data.fonteIA || 'Google Gemini Vision',
          timestamp: data.timestamp || new Date().toISOString()
        }
      ])

      if (data.triagem) {
        setResultadoRecente(data.triagem)
        if (data.id) setRecorteId(data.id)
      }
    } catch (err: any) {
      setMensagens((prev) => [
        ...prev,
        {
          id: messageCounter++,
          remetente: 'bot',
          texto: `⚠️ Não foi possível analisar a imagem: ${err.message}. Tente outra foto mais nítida ou relate os sintomas em texto.`,
          timestamp: new Date().toISOString()
        }
      ])
    } finally {
      setIsTyping(false)
      URL.revokeObjectURL(previewUrl)
      if (chatFileInputRef.current) chatFileInputRef.current.value = ''
    }
  }

  // Funções do Formulário Estruturado
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('A foto deve ter no máximo 5MB')
        return
      }
      setFoto(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setFotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeFoto = () => {
    setFoto(null)
    setFotoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const toggleCondicao = (condicao: string) => {
    if (condicao === 'Nenhuma') {
      setCondicoesCronicas(['Nenhuma'])
      return
    }
    
    setCondicoesCronicas(prev => {
      const semNenhuma = prev.filter(c => c !== 'Nenhuma')
      if (semNenhuma.includes(condicao)) {
        return semNenhuma.filter(c => c !== condicao)
      }
      return [...semNenhuma, condicao]
    })
  }

  const nextStep = () => {
    if (step === 1 && (sintomaPrincipal.length < 10 || !duracao)) {
      alert('Por favor, preencha o sintoma (mín. 10 caracteres) e a duração.')
      return
    }
    if (step === 2 && (!temFebre || !temDor || !tomaMedicamento || condicoesCronicas.length === 0 || !estaGravida)) {
      alert('Por favor, responda todas as perguntas.')
      return
    }
    setStep(prev => Math.min(prev + 1, 4))
    window.scrollTo(0, 0)
  }

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1))
    window.scrollTo(0, 0)
  }

  const handleSubmitFormulario = async () => {
    setIsSubmitting(true)
    setErrorMsg('')
    
    try {
      const formData = new FormData()
      formData.append('sintoma_principal', sintomaPrincipal)
      formData.append('duracao', duracao)
      formData.append('intensidade', intensidade.toString())
      formData.append('tem_febre', temFebre)
      formData.append('tem_dor', temDor)
      formData.append('local_dor', localDor)
      formData.append('toma_medicamento', tomaMedicamento)
      formData.append('qual_medicamento', qualMedicamento)
      formData.append('tem_condicao_cronica', JSON.stringify(condicoesCronicas))
      formData.append('esta_gravida', estaGravida)
      
      if (foto) {
        formData.append('foto', foto)
        formData.append('descricao_foto', descricaoFoto)
      }

      const triagemId = await submitTriagem(formData)
      router.push(`/triagem/resultado/${triagemId}`)
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao enviar triagem. Tente novamente.')
      setIsSubmitting(false)
    }
  }

  const inputClass = "w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2b85ff] focus:border-[#2b85ff] bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
  const radioLabelClass = "flex items-center gap-2 cursor-pointer p-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200 transition-colors"

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-transparent py-6 sm:py-10 px-4 sm:px-6 lg:px-8 font-jakarta">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Top Header & Mode Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-blue-50 dark:bg-blue-950/60 text-[#2b85ff] dark:text-blue-400 rounded-xl border dark:border-blue-800/40">
                <Stethoscope className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-[#091426] dark:text-white">Triagem Médica Cuidaê</h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Avaliação de sintomas com inteligência clínica e direcionamento para a rede de saúde.
            </p>
          </div>

          {/* Segmented Control */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto border border-slate-200/60 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setMode('chat')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                mode === 'chat'
                  ? 'bg-white dark:bg-slate-700 text-[#2b85ff] dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#2b85ff] dark:text-blue-400" />
              Conversar com IA
              <span className="text-[10px] bg-blue-100 dark:bg-blue-950/80 text-[#2b85ff] dark:text-blue-300 px-1.5 py-0.5 rounded-full font-bold">
                Novo
              </span>
            </button>
            <button
              type="button"
              onClick={() => setMode('formulario')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                mode === 'formulario'
                  ? 'bg-white dark:bg-slate-700 text-[#091426] dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              Formulário Guiado
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODO 1: CHAT CONVERSACIONAL COM AGENTE DE IA (PADRÃO)                     */}
        {/* ========================================================================= */}
        {mode === 'chat' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col h-[750px] max-h-[85vh] animate-fade-in-up">
            
            {/* Chat Bar Header */}
            <div className="bg-gradient-to-r from-[#091426] to-[#122748] px-5 py-4 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-[#2b85ff] flex items-center justify-center font-bold text-white shadow-md">
                    <Bot className="w-6 h-6" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#091426] rounded-full animate-pulse"></span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-base sm:text-lg">Assistente Cuidaê AI</h2>
                    <span className="bg-emerald-500/20 text-emerald-300 text-[11px] font-medium px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Gemini Flash Ativo
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Triagem clínica em tempo real
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.geolocation) {
                      setLocStatus('solicitando')
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          setLocalizacao({ lat: pos.coords.latitude, lng: pos.coords.longitude })
                          setLocStatus('ativa')
                        },
                        () => setLocStatus('negada')
                      )
                    }
                  }}
                  title={locStatus === 'ativa' ? 'Localização ativa para rotas de UBS/UPA' : 'Clique para ativar localização'}
                  className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors"
                >
                  <MapPin className={`w-3.5 h-3.5 ${locStatus === 'ativa' ? 'text-emerald-400' : 'text-amber-400'}`} />
                  <span className="hidden sm:inline">
                    {locStatus === 'ativa' ? 'Localização Ativa' : 'Ativar GPS'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={iniciarChat}
                  title="Reiniciar conversa e iniciar nova consulta"
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Body - Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-[#f8fafc]/60 dark:bg-slate-950/70">
              
              {/* Mensagens do Diálogo */}
              {mensagens.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.remetente === 'usuario' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.remetente === 'bot' && (
                    <div className="w-8 h-8 rounded-full bg-[#2b85ff] text-white flex items-center justify-center shrink-0 mt-1 shadow-sm">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`max-w-[85%] sm:max-w-[75%] space-y-3`}>
                    
                    {/* Imagem enviada */}
                    {msg.imagem && (
                      <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm max-w-xs">
                        <img src={msg.imagem} alt="Foto de sintoma" className="w-full h-auto object-cover max-h-56" />
                      </div>
                    )}

                    {/* Balão de Texto Principal */}
                    {msg.texto && (
                      <div
                        className={`p-4 rounded-2xl text-sm sm:text-base leading-relaxed shadow-sm ${
                          msg.remetente === 'usuario'
                            ? 'bg-[#2b85ff] text-white rounded-br-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700 rounded-bl-xs'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.texto}</p>
                        
                        {msg.timestamp && (
                          <span
                            className={`block text-[10px] mt-1.5 ${
                              msg.remetente === 'usuario' ? 'text-blue-100 text-right' : 'text-slate-400 dark:text-slate-400'
                            }`}
                          >
                            {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    )}

                    {/* CARD CLÍNICO DE TRIAGEM EM TEMPO REAL */}
                    {msg.triagem && (
                      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md p-4 sm:p-5 space-y-4 animate-fade-in-up">
                        
                        {/* Header do Card com Badge Manchester */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                            Avaliação Clínica de Triagem
                          </span>

                          {msg.triagem.nivel_urgencia === 'vermelho' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/60">
                              <ShieldAlert className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                              Prioridade Vermelha (Emergência)
                            </span>
                          )}

                          {msg.triagem.nivel_urgencia === 'amarelo' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                              Prioridade Amarela (Urgente)
                            </span>
                          )}

                          {msg.triagem.nivel_urgencia === 'verde' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              Prioridade Verde (Pouco Urgente)
                            </span>
                          )}
                        </div>

                        {/* Conteúdo Clínico */}
                        <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                          {msg.triagem.recomendacao && (
                            <div>
                              <span className="text-xs text-slate-400 dark:text-slate-400 block">Hipótese Clínica Sugerida</span>
                              <p className="font-semibold text-slate-900 dark:text-white text-base">{msg.triagem.recomendacao}</p>
                            </div>
                          )}

                          {msg.triagem.especialidade && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400 dark:text-slate-400">Especialidade:</span>
                              <span className="font-medium text-[#2b85ff] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md text-xs border dark:border-blue-800/40">
                                {msg.triagem.especialidade}
                              </span>
                            </div>
                          )}

                          {msg.triagem.orientacao && (
                            <div className="bg-blue-50/70 dark:bg-blue-950/60 p-3 rounded-xl border border-blue-100 dark:border-blue-900/60 text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                              <strong className="text-blue-900 dark:text-blue-300 block mb-1">💡 Cuidados Imediatos:</strong>
                              {msg.triagem.orientacao}
                            </div>
                          )}
                        </div>

                        {/* Ações: Agendar no Hospital, Rota no Mapa, Unidades Recomendadas e Acessar Prontuário */}
                        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          {/* Botão de Agendamento em Destaque */}
                          <button
                            type="button"
                            onClick={() => {
                              const params = new URLSearchParams()
                              if (msg.triagem?.id) params.set('triagemId', msg.triagem.id)
                              if (msg.triagem?.recomendacao) params.set('diagnostico', msg.triagem.recomendacao)
                              if (msg.triagem?.especialidade) params.set('especialidade', msg.triagem.especialidade)
                              const ultimaMensagemUsuario = [...mensagens].reverse().find(m => m.remetente === 'usuario')?.texto
                              if (ultimaMensagemUsuario) params.set('sintomas', ultimaMensagemUsuario)
                              router.push(`/agendamento?${params.toString()}`)
                            }}
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#2b85ff] to-[#1a6edb] hover:from-blue-600 hover:to-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                          >
                            <Calendar className="w-4 h-4" />
                            <span>Agendar no Hospital com este Diagnóstico</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>

                          <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const params = new URLSearchParams()
                                if (msg.triagem?.recomendacao) params.set('diagnostico', msg.triagem.recomendacao)
                                if (msg.triagem?.especialidade) params.set('especialidade', msg.triagem.especialidade)
                                if (msg.triagem?.tipoUnidade) params.set('tipo', msg.triagem.tipoUnidade)
                                router.push(`/unidades?${params.toString()}`)
                              }}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-[#2b85ff] dark:text-blue-400 text-xs font-semibold rounded-xl transition-colors border border-blue-200 dark:border-blue-800/60"
                            >
                              <Building2 className="w-3.5 h-3.5 text-[#2b85ff] dark:text-blue-400" />
                              <span>Hospitais da Rede</span>
                            </button>

                            {msg.mapa && (
                              <a
                                href={msg.mapa.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors"
                              >
                                <MapPin className="w-3.5 h-3.5 text-[#2b85ff] dark:text-blue-400" />
                                <span>Ver no Maps</span>
                                <ExternalLink className="w-3 h-3 text-slate-400" />
                              </a>
                            )}

                            {msg.triagem.id && (
                              <button
                                type="button"
                                onClick={() => router.push(`/triagem/resultado/${msg.triagem?.id}`)}
                                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-all"
                              >
                                <span>Prontuário</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {msg.remetente === 'usuario' && (
                    <div className="w-8 h-8 rounded-full bg-[#091426] dark:bg-slate-800 text-white flex items-center justify-center shrink-0 mt-1 shadow-sm border dark:border-slate-700">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {/* Indicador de Digitação / Análise da IA */}
              {isTyping && (
                <div className="flex gap-3 justify-start items-center animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-[#2b85ff] text-white flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                    <Loader2 className="w-4 h-4 text-[#2b85ff] animate-spin" />
                    Assistente Cuidaê está analisando com Inteligência Clínica...
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Chips de Sugestão de Sintomas (se houver poucas mensagens) */}
            {mensagens.length <= 2 && (
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 overflow-x-auto flex gap-2 no-scrollbar">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 self-center shrink-0">Sugestões:</span>
                {SUGESTOES_SINTOMAS.map((chip, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleEnviarMensagem(chip)}
                    disabled={isTyping}
                    className="text-xs bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-[#2b85ff] dark:hover:text-blue-400 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-xs whitespace-nowrap transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {/* Chat Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleEnviarMensagem()
              }}
              className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-2"
            >
              <input
                type="file"
                ref={chatFileInputRef}
                accept="image/*"
                onChange={handleEnviarFotoChat}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => chatFileInputRef.current?.click()}
                disabled={isTyping}
                title="Enviar foto para análise dermatológica ou lesão"
                className="p-3 text-slate-500 dark:text-slate-400 hover:text-[#2b85ff] dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 transition-colors shrink-0"
              >
                <Camera className="w-5 h-5" />
              </button>

              <input
                type="text"
                value={inputTexto}
                onChange={(e) => setInputTexto(e.target.value)}
                placeholder="Descreva o que está sentindo (ex: febre alta há 2 dias, dor no peito...)"
                disabled={isTyping}
                className="flex-1 bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2b85ff] focus:border-[#2b85ff] text-sm transition-all"
              />

              <button
                type="submit"
                disabled={!inputTexto.trim() || isTyping}
                className="p-3 bg-[#2b85ff] hover:bg-blue-600 disabled:opacity-40 text-white rounded-2xl transition-all shadow-sm shrink-0 flex items-center justify-center"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>

            {/* Rodapé Informativo */}
            <div className="bg-slate-50 dark:bg-slate-950 px-4 py-2 text-center text-[11px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800">
              ⚠️ A triagem por IA é um auxílio informativo e não substitui consulta médica presencial. Em caso de dor no peito intensa, falta de ar severa ou desmaio, ligue <strong>192 (SAMU)</strong>.
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* MODO 2: FORMULÁRIO ESTRUTURADO PASSO A PASSO (WIZARD TRADICIONAL)         */}
        {/* ========================================================================= */}
        {mode === 'formulario' && (
          <div className="animate-fade-in-up">
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm font-medium text-slate-500 mb-2">
                <span>Passo {step} de 4</span>
                <span>
                  {step === 1 && 'Sintoma Principal'}
                  {step === 2 && 'Perguntas de Acompanhamento'}
                  {step === 3 && 'Foto (Opcional)'}
                  {step === 4 && 'Confirmação'}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-[#2b85ff] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(step / 4) * 100}%` }}
                ></div>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{errorMsg}</p>
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 sm:p-8">
              
              {/* Step 1 */}
              {step === 1 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-[#091426] dark:text-white mb-6 flex items-center gap-3">
                    <Thermometer className="w-6 h-6 text-[#2b85ff]" />
                    Sintoma Principal
                  </h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      O que você está sentindo? (Min 10 caracteres)
                    </label>
                    <textarea 
                      value={sintomaPrincipal}
                      onChange={e => setSintomaPrincipal(e.target.value)}
                      placeholder="Descreva o que está sentindo..."
                      className={`${inputClass} min-h-[120px] resize-y`}
                      maxLength={500}
                    />
                    <div className="text-right text-xs text-slate-500 dark:text-slate-400 mt-1">{sintomaPrincipal.length}/500</div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Há quanto tempo começaram os sintomas?
                    </label>
                    <select 
                      value={duracao}
                      onChange={e => setDuracao(e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Selecione...</option>
                      <option value="Hoje">Hoje</option>
                      <option value="1-3 dias">1-3 dias</option>
                      <option value="4-7 dias">4-7 dias</option>
                      <option value="Mais de 1 semana">Mais de 1 semana</option>
                      <option value="Mais de 1 mês">Mais de 1 mês</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex justify-between">
                      <span>Intensidade do desconforto</span>
                      <span className="font-bold text-[#2b85ff]">{intensidade}/10</span>
                    </label>
                    <input 
                      type="range" 
                      min="1" 
                      max="10" 
                      value={intensidade}
                      onChange={e => setIntensidade(parseInt(e.target.value))}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #22c55e, #eab308, #ef4444)`
                      }}
                    />
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
                      <span>Leve (1)</span>
                      <span>Moderada (5)</span>
                      <span>Muito Forte (10)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold text-[#091426] dark:text-white mb-6 flex items-center gap-3">
                    <Pill className="w-6 h-6 text-[#2b85ff]" />
                    Perguntas de Acompanhamento
                  </h2>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Teve febre?</label>
                    <div className="flex gap-4">
                      {['Sim', 'Não', 'Não sei'].map(opt => (
                        <label key={opt} className={radioLabelClass}>
                          <input type="radio" name="febre" value={opt} checked={temFebre === opt} onChange={e => setTemFebre(e.target.value)} className="w-4 h-4 text-[#2b85ff]" />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Está sentindo dor?</label>
                    <div className="flex gap-4">
                      {['Sim', 'Não'].map(opt => (
                        <label key={opt} className={radioLabelClass}>
                          <input type="radio" name="dor" value={opt} checked={temDor === opt} onChange={e => setTemDor(e.target.value)} className="w-4 h-4 text-[#2b85ff]" />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                    {temDor === 'Sim' && (
                      <div className="mt-3">
                        <input 
                          type="text" 
                          placeholder="Onde é a dor? (Ex: Cabeça, peito, abdômen)" 
                          value={localDor} 
                          onChange={e => setLocalDor(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Toma algum medicamento de uso contínuo?</label>
                    <div className="flex gap-4">
                      {['Sim', 'Não'].map(opt => (
                        <label key={opt} className={radioLabelClass}>
                          <input type="radio" name="medicamento" value={opt} checked={tomaMedicamento === opt} onChange={e => setTomaMedicamento(e.target.value)} className="w-4 h-4 text-[#2b85ff]" />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                    {tomaMedicamento === 'Sim' && (
                      <div className="mt-3">
                        <input 
                          type="text" 
                          placeholder="Quais medicamentos? (Ex: Losartana, Insulina)" 
                          value={qualMedicamento} 
                          onChange={e => setQualMedicamento(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Possui alguma condição crônica?</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {['Diabetes', 'Hipertensão', 'Asma', 'Cardiopatia', 'Nenhuma'].map(cond => (
                        <label key={cond} className={radioLabelClass}>
                          <input 
                            type="checkbox" 
                            checked={condicoesCronicas.includes(cond)}
                            onChange={() => toggleCondicao(cond)}
                            className="w-4 h-4 text-[#2b85ff] rounded"
                          />
                          <span>{cond}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Está grávida?</label>
                    <div className="flex gap-4">
                      {['Sim', 'Não', 'Não se aplica'].map(opt => (
                        <label key={opt} className={radioLabelClass}>
                          <input type="radio" name="gravida" value={opt} checked={estaGravida === opt} onChange={e => setEstaGravida(e.target.value)} className="w-4 h-4 text-[#2b85ff]" />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3 */}
              {step === 3 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-[#091426] dark:text-white mb-6 flex items-center gap-3">
                    <Camera className="w-6 h-6 text-[#2b85ff]" />
                    Foto da Região Afetada (Opcional)
                  </h2>

                  <p className="text-slate-600 dark:text-slate-300 text-sm">
                    Se você tem alguma alteração visível (mancha na pele, corte, inchaço), adicione uma foto para ajudar na avaliação.
                  </p>

                  <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-[#2b85ff] transition-colors">
                    {fotoPreview ? (
                      <div className="relative inline-block">
                        <Image src={fotoPreview} alt="Preview" width={200} height={200} className="rounded-xl object-cover" />
                        <button 
                          onClick={removeFoto}
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 shadow-md"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/60 text-[#2b85ff] dark:text-blue-400 rounded-full flex items-center justify-center mx-auto border dark:border-blue-800/40">
                          <Upload className="w-8 h-8" />
                        </div>
                        <div>
                          <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="font-medium text-[#2b85ff] dark:text-blue-400 hover:underline"
                          >
                            Clique para enviar
                          </button>
                          <span className="text-slate-500 dark:text-slate-400"> ou arraste a imagem aqui</span>
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500">PNG, JPG até 5MB</p>
                      </div>
                    )}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      accept="image/*" 
                      className="hidden" 
                    />
                  </div>

                  {foto && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Descrição da foto (opcional)
                      </label>
                      <input 
                        type="text" 
                        value={descricaoFoto} 
                        onChange={e => setDescricaoFoto(e.target.value)}
                        placeholder="Ex: Mancha vermelha que apareceu ontem no braço"
                        className={inputClass}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Step 4 */}
              {step === 4 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-[#091426] dark:text-white mb-6">
                    Revisão dos Dados
                  </h2>

                  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-5 space-y-4 border border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">Sintoma Principal</span>
                      <p className="text-slate-900 dark:text-white font-medium mt-1">{sintomaPrincipal}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">Duração</span>
                        <p className="text-slate-900 dark:text-white mt-1">{duracao}</p>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">Intensidade</span>
                        <p className="text-slate-900 dark:text-white mt-1">{intensidade}/10</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">Febre</span>
                        <p className="text-slate-900 dark:text-white mt-1">{temFebre}</p>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">Dor</span>
                        <p className="text-slate-900 dark:text-white mt-1">{temDor} {localDor && `(${localDor})`}</p>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">Condições Crônicas</span>
                      <p className="text-slate-900 dark:text-white mt-1">{condicoesCronicas.join(', ')}</p>
                    </div>

                    {fotoPreview && (
                      <div>
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider block mb-2">Foto Anexada</span>
                        <Image src={fotoPreview} alt="Foto" width={80} height={80} className="rounded-lg object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Navigation Buttons do Formulário */}
              <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                {step > 1 ? (
                  <button 
                    type="button" 
                    onClick={prevStep}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Voltar
                  </button>
                ) : <div></div>}

                {step < 4 ? (
                  <button 
                    type="button" 
                    onClick={nextStep}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#2b85ff] text-white font-medium hover:bg-blue-600 transition-colors shadow-sm"
                  >
                    Próximo
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button 
                    type="button" 
                    onClick={handleSubmitFormulario}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-[#2b85ff] text-white font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Classificando com IA...
                      </>
                    ) : (
                      'Finalizar Triagem'
                    )}
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  )
}
