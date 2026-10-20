'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { submitTriagem } from '@/lib/triagem/actions'
import { fetchBoasVindas, enviarSintomas, enviarImagem, fetchHistoricoTriagens } from '@/services/api'
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
  Calendar,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Square,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Trash2,
  History,
  Clock
} from 'lucide-react'

import Image from 'next/image'
import { buildWhatsappUrl, formatarWhatsappTriagem } from '@/lib/whatsapp'
import { falarTexto } from '@/lib/utils/speech'

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
    hipotesesDiagnosticas?: Array<{ nome: string; probabilidade: number }>
    sintomasInfermedica?: string[]
  } | null
  mapa?: {
    label: string
    url: string
    tipo?: string
  } | null
  fonteIA?: string
  timestamp?: string
}

export interface ChatSession {
  id: string
  titulo: string
  timestamp: string
  mensagens: ChatMessage[]
  resultadoRecente?: ChatMessage['triagem'] | null
  recorteId?: string | null
  nivel_urgencia?: 'verde' | 'amarelo' | 'vermelho'
}

const STORAGE_KEY = 'cuidae_chat_sessions_v1'

function carregarSessoesIniciais(): ChatSession[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch (e) {
    console.error('Erro ao ler sessoes do localStorage:', e)
  }
  return []
}

function salvarSessoesNoStorage(sessoes: ChatSession[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessoes))
  } catch (e) {
    console.error('Erro ao salvar sessoes no localStorage:', e)
  }
}

function formatarDataSessao(isoString?: string): string {
  if (!isoString) return 'Hoje'
  try {
    const data = new Date(isoString)
    const agora = new Date()
    const diffMs = agora.getTime() - data.getTime()
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDias === 0) {
      return `Hoje às ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    }
    if (diffDias === 1) {
      return `Ontem às ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    }
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  } catch {
    return 'Recente'
  }
}

function sanitizarTextoBot(texto?: string): string {
  if (!texto) return '';
  const limpo = texto
    .replace(/^(olá|ola|oi|bom dia|boa tarde|boa noite|saudações)[!,\.\s\-]+/i, '')
    .replace(/^(olá|ola|oi),?\s*(tudo bem|como vai|como você está|sou a cuidaê|sou o cuidaê)[!,\.\s\-?]+/i, '')
    .trim();
  return limpo ? limpo.charAt(0).toUpperCase() + limpo.slice(1) : texto;
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

const RESPOSTAS_RAPIDAS_ANAMNESE = [
  { label: '⏱️ Começou hoje', valor: 'Começou hoje há poucas horas' },
  { label: '⏱️ Há 2 a 3 dias', valor: 'Começou há cerca de 2 a 3 dias' },
  { label: '⏱️ Há mais de 1 semana', valor: 'Já sinto há mais de uma semana' },
  { label: '⚡ Dor leve (1 a 4)', valor: 'A intensidade é leve a moderada, nota entre 1 e 4' },
  { label: '💥 Dor forte (7 a 10)', valor: 'A dor é muito forte e intensa, nota entre 7 e 10' },
  { label: '🫀 Aperto no peito', valor: 'Sinto uma sensação de aperto e peso no peito' },
  { label: '💪 Piora ao mexer/apertar', valor: 'A dor piora quando aperto o músculo ou me movimento' },
  { label: '🌡️ Tenho febre', valor: 'Estou com febre' },
  { label: '❄️ Sem febre', valor: 'Não apresentei febre' },
  { label: '😣 Dor no corpo', valor: 'Também sinto dor no corpo e desânimo' },
  { label: '✅ É apenas isso', valor: 'É apenas esse sintoma mesmo, sem outras queixas' },
]

export default function TriagemPage() {
  const router = useRouter()

  // Modo: 'chat' (Assistente de IA) ou 'formulario' (Passo a Passo)
  const [mode, setMode] = useState<'chat' | 'formulario'>('chat')

  // Estado do Chat de IA e Sessões / Aba Lateral
  const [sessoes, setSessoes] = useState<ChatSession[]>([])
  const [sessaoAtivaId, setSessaoAtivaId] = useState<string>('')
  const [sidebarAberta, setSidebarAberta] = useState<boolean>(true)

  const [mensagens, setMensagens] = useState<ChatMessage[]>([])
  const [inputTexto, setInputTexto] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [localizacao, setLocalizacao] = useState<{ lat: number; lng: number } | null>(null)
  const [locStatus, setLocStatus] = useState<'solicitando' | 'ativa' | 'negada'>('solicitando')
  const [resultadoRecente, setResultadoRecente] = useState<ChatMessage['triagem'] | null>(null)
  const [recorteId, setRecorteId] = useState<string | null>(null)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const chatFileInputRef = useRef<HTMLInputElement>(null)

  // Estados de Voz / Áudio da IA e Ditado
  const [vozAtiva, setVozAtiva] = useState<boolean>(true)
  const [mensagemFalandoId, setMensagemFalandoId] = useState<number | null>(null)
  const [gravandoVoz, setGravandoVoz] = useState<boolean>(false)
  const speechRecognitionRef = useRef<any>(null)

  const pararVoz = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setMensagemFalandoId(null)
  }

  const falarMensagemIA = (texto: string, msgId?: number) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

    if (mensagemFalandoId === msgId) {
      pararVoz()
      return
    }

    pararVoz()

    if (msgId) setMensagemFalandoId(msgId)

    falarTexto(texto, {
      onEnd: () => setMensagemFalandoId(null),
      onError: () => setMensagemFalandoId(null)
    })
  }

  const alternarGravacaoVoz = () => {
    if (typeof window === 'undefined') return

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRec) {
      alert('Seu navegador não possui suporte ao reconhecimento de voz. Por favor, digite seus sintomas.')
      return
    }

    if (gravandoVoz) {
      speechRecognitionRef.current?.stop()
      setGravandoVoz(false)
      return
    }

    try {
      pararVoz()
      const recognition = new SpeechRec()
      recognition.lang = 'pt-BR'
      recognition.continuous = false
      recognition.interimResults = true

      recognition.onstart = () => {
        setGravandoVoz(true)
      }

      recognition.onresult = (event: any) => {
        let transcricao = ''
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcricao += event.results[i][0].transcript
        }
        if (transcricao) {
          setInputTexto((prev) => (prev ? `${prev} ${transcricao}`.trim() : transcricao))
        }
      }

      recognition.onerror = () => {
        setGravandoVoz(false)
      }

      recognition.onend = () => {
        setGravandoVoz(false)
      }

      speechRecognitionRef.current = recognition
      recognition.start()
    } catch {
      setGravandoVoz(false)
    }
  }

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

  // Cria uma nova sessão inicial com mensagem acolhedora
  const criarSessaoInicial = () => {
    const novoId = crypto.randomUUID()
    const sessao: ChatSession = {
      id: novoId,
      titulo: 'Novo Atendimento',
      timestamp: new Date().toISOString(),
      resultadoRecente: null,
      recorteId: null,
      mensagens: [
        {
          id: messageCounter++,
          remetente: 'bot',
          texto: 'Olá! Sou a Cuidaê, sua assistente virtual de triagem médica do SUS. 😊\n\nMe conte com suas palavras o que você está sentindo — quanto mais detalhes, melhor consigo te orientar. Você também pode enviar uma foto de qualquer alteração física (pele, lesão, machucado).\n\nComo posso te ajudar hoje?',
          timestamp: new Date().toISOString()
        }
      ]
    }
    setSessoes([sessao])
    salvarSessoesNoStorage([sessao])
    setSessaoAtivaId(novoId)
    setMensagens(sessao.mensagens)
    setResultadoRecente(null)
    setRecorteId(null)
  }

  // Iniciar nova consulta / atendimento
  const iniciarNovaSessao = () => {
    pararVoz()
    const novoId = crypto.randomUUID()
    const sessao: ChatSession = {
      id: novoId,
      titulo: 'Novo Atendimento',
      timestamp: new Date().toISOString(),
      resultadoRecente: null,
      recorteId: null,
      mensagens: [
        {
          id: messageCounter++,
          remetente: 'bot',
          texto: 'Olá! Sou a Cuidaê, sua assistente virtual de triagem médica do SUS. 😊\n\nMe conte com suas palavras o que você está sentindo — quanto mais detalhes, melhor consigo te orientar. Você também pode enviar uma foto de qualquer alteração física (pele, lesão, machucado).\n\nComo posso te ajudar hoje?',
          timestamp: new Date().toISOString()
        }
      ]
    }
    setSessoes((prev) => {
      const atualizadas = [sessao, ...prev]
      salvarSessoesNoStorage(atualizadas)
      return atualizadas
    })
    setSessaoAtivaId(novoId)
    setMensagens(sessao.mensagens)
    setResultadoRecente(null)
    setRecorteId(null)
    setInputTexto('')

    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarAberta(false)
    }
  }

  // Selecionar uma sessão existente do histórico
  const selecionarSessao = (id: string) => {
    pararVoz()
    const match = sessoes.find((s) => s.id === id)
    if (!match) return

    setSessaoAtivaId(match.id)
    setMensagens(match.mensagens || [])
    setResultadoRecente(match.resultadoRecente || null)
    setRecorteId(match.recorteId || null)
    setInputTexto('')

    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarAberta(false)
    }
  }

  // Excluir uma sessão do histórico
  const excluirSessao = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const confirmou = window.confirm('Deseja excluir esta conversa do seu histórico?')
    if (!confirmou) return

    pararVoz()
    const restantes = sessoes.filter((s) => s.id !== id)
    setSessoes(restantes)
    salvarSessoesNoStorage(restantes)

    if (sessaoAtivaId === id) {
      if (restantes.length > 0) {
        selecionarSessao(restantes[0].id)
      } else {
        criarSessaoInicial()
      }
    }
  }

  // Limpar todo histórico salvo
  const limparTodasSessoes = () => {
    const confirmou = window.confirm('Tem certeza que deseja apagar todo o histórico de consultas deste dispositivo?')
    if (!confirmou) return

    pararVoz()
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
    criarSessaoInicial()
  }

  // Inicializa sessões do localStorage e sincroniza com o banco de triagens
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarAberta(false)
    }

    const sessoesLocais = carregarSessoesIniciais()

    fetchHistoricoTriagens()
      .then((data) => {
        const triagensDb = data?.triagens || []
        const sessoesConvertidas: ChatSession[] = triagensDb.map((t: any) => ({
          id: t.id,
          titulo: t.sintoma_principal
            ? (t.sintoma_principal.length > 36 ? t.sintoma_principal.slice(0, 36) + '...' : t.sintoma_principal)
            : 'Atendimento de Triagem',
          timestamp: t.created_at || new Date().toISOString(),
          nivel_urgencia: t.nivel_urgencia,
          recorteId: t.id,
          resultadoRecente: {
            id: t.id,
            recomendacao: t.explicacao,
            especialidade: t.especialidade,
            prioridade: t.nivel_urgencia === 'vermelho' ? 'Urgente' : t.nivel_urgencia === 'amarelo' ? 'Média' : 'Normal',
            orientacao: t.orientacao,
            tipoUnidade: t.tipoUnidade,
            nivel_urgencia: t.nivel_urgencia,
            hipotesesDiagnosticas: t.hipotesesDiagnosticas,
            sintomasInfermedica: t.sintomasInfermedica
          },
          mensagens: [
            {
              id: 1,
              remetente: 'usuario',
              texto: t.sintoma_principal,
              timestamp: t.created_at
            },
            {
              id: 2,
              remetente: 'bot',
              texto: t.explicacao || 'Triagem clínica concluída com sucesso.',
              triagem: {
                id: t.id,
                recomendacao: t.explicacao,
                especialidade: t.especialidade,
                prioridade: t.nivel_urgencia === 'vermelho' ? 'Urgente' : t.nivel_urgencia === 'amarelo' ? 'Média' : 'Normal',
                orientacao: t.orientacao,
                tipoUnidade: t.tipoUnidade,
                nivel_urgencia: t.nivel_urgencia,
                hipotesesDiagnosticas: t.hipotesesDiagnosticas,
                sintomasInfermedica: t.sintomasInfermedica
              },
              timestamp: t.created_at
            }
          ]
        }))

        const idsExistentes = new Set(sessoesLocais.map((s) => s.id))
        const novasDoDb = sessoesConvertidas.filter((s) => !idsExistentes.has(s.id))
        const unificadas = [...sessoesLocais, ...novasDoDb]

        if (unificadas.length > 0) {
          setSessoes(unificadas)
          salvarSessoesNoStorage(unificadas)
          setSessaoAtivaId(unificadas[0].id)
          setMensagens(unificadas[0].mensagens || [])
          setResultadoRecente(unificadas[0].resultadoRecente || null)
          setRecorteId(unificadas[0].recorteId || null)
        } else {
          criarSessaoInicial()
        }
      })
      .catch(() => {
        if (sessoesLocais.length > 0) {
          setSessoes(sessoesLocais)
          setSessaoAtivaId(sessoesLocais[0].id)
          setMensagens(sessoesLocais[0].mensagens || [])
          setResultadoRecente(sessoesLocais[0].resultadoRecente || null)
          setRecorteId(sessoesLocais[0].recorteId || null)
        } else {
          criarSessaoInicial()
        }
      })
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

    const novasMsgsUsuario = [...mensagens, novaMensagemUsuario]
    setMensagens(novasMsgsUsuario)
    setInputTexto('')
    setIsTyping(true)

    try {
      // Histórico anterior para dar contexto à IA
      const historicoRecente = mensagens.slice(-6).map((m) => ({
        remetente: m.remetente,
        texto: m.texto || ''
      }))

      const data = await enviarSintomas(textoParaEnviar, 'Gratuito', localizacao, historicoRecente)

      const botTextoSanitizado = sanitizarTextoBot(data.texto)
      const botMsgId = messageCounter++
      const novaMensagemBot: ChatMessage = {
        id: botMsgId,
        remetente: 'bot',
        texto: botTextoSanitizado,
        triagem: data.triagem || null,
        mapa: data.mapa || null,
        fonteIA: data.fonteIA || 'Google Gemini Flash',
        timestamp: data.timestamp || new Date().toISOString()
      }

      const msgsFinais = [...novasMsgsUsuario, novaMensagemBot]
      setMensagens(msgsFinais)

      if (vozAtiva && botTextoSanitizado) {
        falarMensagemIA(botTextoSanitizado, botMsgId)
      }

      if (data.triagem) {
        setResultadoRecente(data.triagem)
        if (data.id) setRecorteId(data.id)
      }

      // Sincroniza a sessão ativa e persiste
      setSessoes((prevSessoes) => {
        const indice = prevSessoes.findIndex((s) => s.id === sessaoAtivaId)
        const sessaoAtual = prevSessoes[indice]
        const tituloAtual = sessaoAtual?.titulo
        const novoTitulo =
          !tituloAtual || tituloAtual === 'Novo Atendimento' || tituloAtual === 'Nova Consulta'
            ? textoParaEnviar.length > 36
              ? textoParaEnviar.slice(0, 36) + '...'
              : textoParaEnviar
            : tituloAtual

        const sessaoAtualizada: ChatSession = {
          ...(sessaoAtual || {
            id: sessaoAtivaId || crypto.randomUUID(),
            timestamp: new Date().toISOString()
          }),
          titulo: novoTitulo,
          timestamp: new Date().toISOString(),
          mensagens: msgsFinais,
          resultadoRecente: data.triagem || sessaoAtual?.resultadoRecente || null,
          recorteId: data.id || sessaoAtual?.recorteId || null,
          nivel_urgencia: data.triagem?.nivel_urgencia || sessaoAtual?.nivel_urgencia
        }

        let listaNova: ChatSession[]
        if (indice >= 0) {
          listaNova = [sessaoAtualizada, ...prevSessoes.filter((_, i) => i !== indice)]
        } else {
          listaNova = [sessaoAtualizada, ...prevSessoes]
        }
        salvarSessoesNoStorage(listaNova)
        return listaNova
      })
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

    const novaMsgUsuario: ChatMessage = {
      id: messageCounter++,
      remetente: 'usuario',
      imagem: previewUrl,
      texto: 'Enviou uma imagem para avaliação visual.',
      timestamp: new Date().toISOString()
    }

    const msgsComFoto = [...mensagens, novaMsgUsuario]
    setMensagens(msgsComFoto)
    setIsTyping(true)

    try {
      const data = await enviarImagem(file, 'Gratuito', localizacao)

      const botMsg: ChatMessage = {
        id: messageCounter++,
        remetente: 'bot',
        texto: data.texto,
        triagem: data.triagem || null,
        mapa: data.mapa || null,
        fonteIA: data.fonteIA || 'Google Gemini Vision',
        timestamp: data.timestamp || new Date().toISOString()
      }

      const msgsFinais = [...msgsComFoto, botMsg]
      setMensagens(msgsFinais)

      if (data.triagem) {
        setResultadoRecente(data.triagem)
        if (data.id) setRecorteId(data.id)
      }

      // Sincroniza a sessão ativa
      setSessoes((prevSessoes) => {
        const indice = prevSessoes.findIndex((s) => s.id === sessaoAtivaId)
        const sessaoAtual = prevSessoes[indice]
        const sessaoAtualizada: ChatSession = {
          ...(sessaoAtual || {
            id: sessaoAtivaId || crypto.randomUUID(),
            timestamp: new Date().toISOString()
          }),
          titulo: sessaoAtual?.titulo === 'Novo Atendimento' ? 'Análise de Imagem / Lesão' : (sessaoAtual?.titulo || 'Análise de Imagem'),
          timestamp: new Date().toISOString(),
          mensagens: msgsFinais,
          resultadoRecente: data.triagem || sessaoAtual?.resultadoRecente || null,
          recorteId: data.id || sessaoAtual?.recorteId || null,
          nivel_urgencia: data.triagem?.nivel_urgencia || sessaoAtual?.nivel_urgencia
        }

        let listaNova: ChatSession[]
        if (indice >= 0) {
          listaNova = [sessaoAtualizada, ...prevSessoes.filter((_, i) => i !== indice)]
        } else {
          listaNova = [sessaoAtualizada, ...prevSessoes]
        }
        salvarSessoesNoStorage(listaNova)
        return listaNova
      })
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

  // =========================================================================
  // MODO 1: CHAT CONVERSACIONAL COM AGENTE DE IA (TELA CHEIA COM ABA LATERAL)
  // =========================================================================
  if (mode === 'chat') {
    return (
      <div className="h-[calc(100vh-4rem)] w-full flex overflow-hidden bg-slate-50 dark:bg-[#070b12] font-jakarta">
        {/* Backdrop para telas mobile */}
        {sidebarAberta && (
          <div
            className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden transition-opacity"
            onClick={() => setSidebarAberta(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar Lateral de Histórico de Consultas (Estilo Chatbot de IA Nativo) */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-50 lg:z-10
            ${sidebarAberta ? 'w-80 translate-x-0' : '-translate-x-full lg:w-0 lg:overflow-hidden lg:opacity-0'}
            transition-all duration-300 ease-in-out shrink-0
            bg-[#080e1b] border-r border-slate-800/80 text-slate-200
            flex flex-col h-full shadow-2xl lg:shadow-none
          `}
        >
          {/* Header da Sidebar */}
          <div className="p-3.5 border-b border-slate-800/80 bg-[#060a14]/70 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2b85ff] to-blue-700 text-white flex items-center justify-center font-bold shadow-sm shadow-blue-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5 tracking-tight">
                  Consultas IA
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-blue-500/20 text-blue-300 border border-blue-400/30 font-medium">Histórico</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  {sessoes.length} {sessoes.length === 1 ? 'conversa gravada' : 'conversas gravadas'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSidebarAberta(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
              title="Fechar barra lateral"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          {/* Botão + Nova Consulta */}
          <div className="p-3">
            <button
              type="button"
              onClick={iniciarNovaSessao}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#2b85ff] to-[#1c6fd8] hover:from-blue-600 hover:to-blue-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-500/20 border border-blue-400/30 transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              Nova Consulta com IA
            </button>
          </div>

          {/* Lista de Sessões Anteriores */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 no-scrollbar">
            {sessoes.length === 0 ? (
              <div className="text-center py-12 px-4 text-slate-400">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40 text-blue-400" />
                <p className="text-xs font-medium text-slate-300">Nenhuma consulta anterior.</p>
                <p className="text-[11px] mt-1 text-slate-400">Inicie uma conversa para guardar seu histórico clínico de triagem.</p>
              </div>
            ) : (
              sessoes.map((sessao) => {
                const isAtiva = sessao.id === sessaoAtivaId
                const dataFormatada = formatarDataSessao(sessao.timestamp)
                return (
                  <div
                    key={sessao.id}
                    onClick={() => selecionarSessao(sessao.id)}
                    className={`group relative flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border text-left ${
                      isAtiva
                        ? 'bg-gradient-to-r from-blue-950/70 to-[#0e213d] border-blue-500/50 shadow-sm ring-1 ring-blue-500/30 text-white'
                        : 'hover:bg-white/5 border-transparent text-slate-300 hover:text-white hover:border-slate-800/60'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className="mt-1 shrink-0">
                        {sessao.nivel_urgencia === 'vermelho' ? (
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block shadow-[0_0_8px_rgba(239,68,68,0.7)]" title="Prioridade Vermelha (Emergência)" />
                        ) : sessao.nivel_urgencia === 'amarelo' ? (
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shadow-[0_0_8px_rgba(245,158,11,0.7)]" title="Prioridade Amarela (Urgente)" />
                        ) : sessao.nivel_urgencia === 'verde' ? (
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-[0_0_8px_rgba(16,185,129,0.7)]" title="Prioridade Verde (Pouco Urgente)" />
                        ) : (
                          <span className="w-2.5 h-2.5 rounded-full bg-[#2b85ff] inline-block opacity-70" title="Em atendimento" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className={`text-xs truncate ${isAtiva ? 'font-semibold text-white' : 'font-medium text-slate-200'}`}>
                          {sessao.titulo || 'Consulta de Triagem'}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400">
                          <Clock className="w-3 h-3" />
                          <span>{dataFormatada}</span>
                          {sessao.mensagens?.length > 1 && (
                            <>
                              <span>•</span>
                              <span>{sessao.mensagens.length} msgs</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => excluirSessao(sessao.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/60 transition-opacity ml-1 shrink-0"
                      title="Excluir esta conversa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })
            )}
          </div>

          {/* Rodapé da Sidebar */}
          <div className="p-3 border-t border-slate-800/80 bg-[#060a14]/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              SUS • Triagem Segura
            </span>
            {sessoes.length > 0 && (
              <button
                type="button"
                onClick={limparTodasSessoes}
                className="text-xs text-slate-400 hover:text-red-400 transition-colors"
                title="Apagar todo histórico clínico do dispositivo"
              >
                Limpar tudo
              </button>
            )}
          </div>
        </aside>

        {/* Área Principal de Chat Fullscreen */}
        <div className="flex-1 flex flex-col h-full min-w-0 bg-[#f8fafc]/50 dark:bg-slate-950/80 overflow-hidden relative">
          
          {/* Header Superior do Chat Fullscreen */}
          <div className="bg-gradient-to-r from-[#091426] via-[#0d1d36] to-[#122748] px-4 sm:px-6 py-3 text-white flex items-center justify-between border-b border-slate-800 shrink-0 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setSidebarAberta(!sidebarAberta)}
                title={sidebarAberta ? 'Ocultar barra lateral de conversas' : 'Ver conversas passadas'}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors shrink-0 flex items-center gap-1.5"
              >
                {sidebarAberta ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
                <span className="hidden sm:inline text-xs font-semibold">
                  {sidebarAberta ? 'Ocultar' : 'Histórico'}
                </span>
                {sessoes.length > 0 && !sidebarAberta && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#2b85ff] text-[10px] font-bold">
                    {sessoes.length}
                  </span>
                )}
              </button>

              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full bg-[#2b85ff] flex items-center justify-center font-bold text-white shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#091426] rounded-full animate-pulse" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-sm sm:text-base truncate">Assistente Cuidaê AI</h2>
                  <span className="hidden md:inline-flex bg-blue-500/20 text-blue-300 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-blue-500/40 items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Infermedica v3 + Gemini
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 truncate">
                  Triagem clínica com IA • SUS 100% Gratuito
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Botão para alternar para formulário guiado */}
              <button
                type="button"
                onClick={() => setMode('formulario')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-slate-200 hover:text-white transition-colors"
                title="Alternar para o Formulário Passo a Passo"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Formulário Guiado</span>
              </button>

              {/* Botão de Som / Voz da IA */}
              <button
                type="button"
                onClick={() => {
                  const novoStatus = !vozAtiva
                  setVozAtiva(novoStatus)
                  if (!novoStatus) pararVoz()
                }}
                title={vozAtiva ? 'Voz da IA ativada (clique para silenciar)' : 'Voz da IA desativada (clique para ativar som)'}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                  vozAtiva
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                    : 'bg-white/10 text-slate-400 border-white/10 hover:text-white'
                }`}
              >
                {vozAtiva ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                <span className="hidden md:inline">{vozAtiva ? 'Voz Ligada' : 'Voz Mudo'}</span>
              </button>

              {/* GPS Localização */}
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
                <span className="hidden md:inline">
                  {locStatus === 'ativa' ? 'GPS Ativo' : 'Ativar GPS'}
                </span>
              </button>

              {/* + Nova Consulta Rápida */}
              <button
                type="button"
                onClick={iniciarNovaSessao}
                title="Iniciar nova consulta"
                className="p-2 rounded-xl bg-blue-500/30 hover:bg-blue-500/50 text-blue-200 hover:text-white border border-blue-400/30 transition-colors flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden lg:inline text-xs font-semibold">Novo</span>
              </button>
            </div>
          </div>

          {/* Área de Mensagens com Rolagem Fluida (Tela Cheia Expandida) */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-12 py-5 bg-[#f8fafc]/60 dark:bg-[#070b12] scroll-smooth">
            <div className="w-full space-y-5">
              
              {/* Mensagens do Diálogo */}
              {mensagens.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3.5 ${msg.remetente === 'usuario' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.remetente === 'bot' && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2b85ff] to-blue-700 text-white flex items-center justify-center shrink-0 mt-1 shadow-sm shadow-blue-500/20">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`space-y-3 ${msg.remetente === 'usuario' ? 'max-w-[85%] sm:max-w-[70%]' : 'max-w-full sm:max-w-[96%] flex-1'}`}>
                    
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
                        
                        {/* Controles de Áudio da Resposta da IA */}
                        {msg.remetente === 'bot' ? (
                          <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-700/60 mt-2.5">
                            <button
                              type="button"
                              onClick={() => falarMensagemIA(msg.texto || '', msg.id)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                                mensagemFalandoId === msg.id
                                  ? 'bg-red-50 dark:bg-red-950/70 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800/60'
                                  : 'text-[#2b85ff] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40'
                              }`}
                              title={mensagemFalandoId === msg.id ? 'Parar leitura de voz' : 'Ouvir resposta em voz alta'}
                            >
                              {mensagemFalandoId === msg.id ? (
                                <>
                                  <Square className="w-3 h-3 fill-current text-red-500" />
                                  <span>Parar Áudio</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-3.5 h-3.5" />
                                  <span>Ouvir</span>
                                </>
                              )}
                            </button>

                            {msg.timestamp && (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        ) : (
                          msg.timestamp && (
                            <span className="block text-[10px] mt-1.5 text-blue-100 text-right">
                              {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )
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
                        <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                          {/* Selo do Motor Clínico Utilizado */}
                          <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 bg-blue-50/60 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-blue-100 dark:border-slate-700">
                            <span className="flex items-center gap-1.5 font-semibold text-[#2b85ff] dark:text-blue-400">
                              <Sparkles className="w-3.5 h-3.5" />
                              {msg.fonteIA || 'Infermedica v3 + Google Gemini'}
                            </span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                              <CheckCircle2 className="w-3 h-3" />
                              Validação Clínica
                            </span>
                          </div>

                          {msg.triagem.recomendacao && (
                            <div>
                              <span className="text-xs text-slate-400 dark:text-slate-400 block font-medium">Hipótese Clínica Principal</span>
                              <p className="font-bold text-slate-900 dark:text-white text-base mt-0.5">{msg.triagem.recomendacao}</p>
                            </div>
                          )}

                          {/* Hipóteses Diagnósticas Calculadas pela Infermedica */}
                          {msg.triagem.hipotesesDiagnosticas && msg.triagem.hipotesesDiagnosticas.length > 0 && (
                            <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700 space-y-2">
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                📊 Diagnóstico Diferencial & Possíveis Causas:
                              </span>
                              <div className="space-y-1.5">
                                {msg.triagem.hipotesesDiagnosticas.map((hip, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-xs">
                                    <span className="text-slate-800 dark:text-slate-200 font-medium">
                                      • {hip.nome}
                                    </span>
                                    {hip.probabilidade ? (
                                      <span
                                        className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 dark:bg-blue-950 text-[#2b85ff] dark:text-blue-300"
                                        title="Probabilidade estimada pelo motor clínico"
                                      >
                                        {hip.probabilidade}%
                                      </span>
                                    ) : (
                                      <span
                                        className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40"
                                        title="Possível causa identificada pela avaliação clínica"
                                      >
                                        Possível causa
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
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

                            {msg.triagem && (
                              <a
                                href={buildWhatsappUrl(
                                  formatarWhatsappTriagem({
                                    id: msg.triagem.id,
                                    sintoma_principal: msg.triagem.recomendacao || 'Sintomas relatados na triagem',
                                    nivel_urgencia: msg.triagem.nivel_urgencia,
                                    recomendacao: msg.triagem.recomendacao,
                                    especialidade: msg.triagem.especialidade,
                                    orientacao: msg.triagem.orientacao,
                                    hipotesesDiagnosticas: msg.triagem.hipotesesDiagnosticas,
                                    created_at: msg.timestamp,
                                  })
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-xl transition-colors border border-emerald-200 dark:border-emerald-800/60"
                                title="Enviar laudo estruturado pelo WhatsApp gratuitamente"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>WhatsApp</span>
                              </a>
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
          </div>

          {/* Barra Inferior Fixa de Input (Tela Cheia Expandida) */}
          <div className="bg-white/95 dark:bg-[#080e1b]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 shrink-0">
            <div className="w-full px-4 sm:px-8 lg:px-12">

              {/* Chips de Sugestão de Sintomas ou Respostas Rápidas */}
              {mensagens.length <= 1 ? (
                <div className="px-4 py-2.5 bg-slate-50/70 dark:bg-slate-900/70 border-b border-slate-200/80 dark:border-slate-800 overflow-x-auto flex gap-2 no-scrollbar">
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
              ) : (
                mensagens[mensagens.length - 1]?.remetente === 'bot' &&
                !mensagens[mensagens.length - 1]?.triagem && (
                  <div className="px-4 py-2 bg-blue-50/60 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 overflow-x-auto flex gap-2 no-scrollbar items-center">
                    <span className="text-[11px] font-bold text-[#2b85ff] dark:text-blue-400 self-center shrink-0 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      Respostas rápidas:
                    </span>
                    {RESPOSTAS_RAPIDAS_ANAMNESE.map((item, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleEnviarMensagem(item.valor)}
                        disabled={isTyping}
                        className="text-xs bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-[#2b85ff] dark:hover:text-blue-400 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-full border border-blue-200/80 dark:border-slate-700 shadow-xs whitespace-nowrap transition-colors font-medium"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )
              )}

              {/* Banner de Gravação de Voz Ativa */}
              {gravandoVoz && (
                <div className="bg-red-50 dark:bg-red-950/70 border-b border-red-200 dark:border-red-900/60 px-4 py-2.5 text-xs font-semibold text-red-700 dark:text-red-300 flex items-center justify-between animate-pulse">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                    🎙️ Ouvindo... Pode falar seus sintomas que a IA está transcrevendo
                  </span>
                  <button
                    type="button"
                    onClick={alternarGravacaoVoz}
                    className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-[11px] font-bold hover:bg-red-700 transition"
                  >
                    Concluir Fala
                  </button>
                </div>
              )}

              {/* Chat Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleEnviarMensagem()
                }}
                className="p-3 sm:p-4 flex items-center gap-2"
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

                {/* Botão de Microfone / Mensagem por Voz */}
                <button
                  type="button"
                  onClick={alternarGravacaoVoz}
                  disabled={isTyping}
                  title={gravandoVoz ? 'Clique para parar gravação de voz' : 'Falar sintomas por voz (Ditado por microfone)'}
                  className={`p-3 rounded-2xl border transition-all shrink-0 flex items-center justify-center ${
                    gravandoVoz
                      ? 'bg-red-600 text-white border-red-700 animate-pulse shadow-md ring-2 ring-red-400'
                      : 'text-slate-500 dark:text-slate-400 hover:text-[#2b85ff] dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {gravandoVoz ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5" />}
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
              <div className="bg-slate-50/70 dark:bg-slate-950/70 px-4 py-2 text-center text-[11px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800">
                ⚠️ A triagem por IA é um auxílio informativo e não substitui consulta médica presencial. Em caso de dor no peito intensa, falta de ar severa ou desmaio, ligue <strong>192 (SAMU)</strong>.
              </div>

            </div>
          </div>

        </div>
      </div>
    )
  }

  // =========================================================================
  // MODO 2: FORMULÁRIO ESTRUTURADO PASSO A PASSO (WIZARD TRADICIONAL)
  // =========================================================================
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50/60 dark:bg-transparent py-6 sm:py-10 px-4 sm:px-6 lg:px-8 font-jakarta">
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
              Formulário guiado passo a passo para avaliação clínica na rede de saúde SUS.
            </p>
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto border border-slate-200/60 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setMode('chat')}
              className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all"
            >
              <Sparkles className="w-4 h-4 text-[#2b85ff] dark:text-blue-400" />
              Conversar com IA
            </button>
            <button
              type="button"
              onClick={() => setMode('formulario')}
              className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-white dark:bg-slate-700 text-[#091426] dark:text-white shadow-xs transition-all"
            >
              <FileText className="w-4 h-4" />
              Formulário Guiado
            </button>
          </div>
        </div>

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

        </div>
      </div>
  )
}
