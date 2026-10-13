'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Building2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Key,
  Copy,
  ExternalLink,
  Send,
  X,
  Stethoscope,
  ArrowLeft
} from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

function HospitalLoginForm() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Modal de Credenciamento
  const [modalCredenciamentoAberto, setModalCredenciamentoAberto] = useState(false)
  const [emailCopiado, setEmailCopiado] = useState(false)

  // Formulário de Solicitação
  const [solicitacaoNome, setSolicitacaoNome] = useState('')
  const [solicitacaoCnpj, setSolicitacaoCnpj] = useState('')
  const [solicitacaoCidade, setSolicitacaoCidade] = useState('Garanhuns')
  const [solicitacaoUf, setSolicitacaoUf] = useState('PE')
  const [solicitacaoResp, setSolicitacaoResp] = useState('')
  const [solicitacaoCargo, setSolicitacaoCargo] = useState('Médico Chefe / Coordenação')
  const [solicitacaoTelefone, setSolicitacaoTelefone] = useState('')
  const [solicitacaoEmail, setSolicitacaoEmail] = useState('')
  const [enviandoSolicitacao, setEnviandoSolicitacao] = useState(false)
  const [solicitacaoSucesso, setSolicitacaoSucesso] = useState(false)

  const preencherHospitalTeste = () => {
    setEmail('hospital.dommoura@cuidae.med.br')
    setSenha('Hospital@2026')
    setError('')
  }

  const copiarEmailAdmin = () => {
    navigator.clipboard.writeText('murillokennedy12@gmail.com')
    setEmailCopiado(true)
    setTimeout(() => setEmailCopiado(false), 3000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccessMsg('')

    try {
      const res = await fetch('/api/hospital/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error || 'Credenciais hospitalares inválidas.')
        setIsLoading(false)
        return
      }

      setSuccessMsg(`Unidade autenticada: ${data.session?.hospital_nome}. Acessando painel...`)
      setTimeout(() => {
        router.push('/hospital/painel')
        router.refresh()
      }, 600)
    } catch (err: any) {
      setError(err.message || 'Erro de conexão com o portal hospitalar.')
      setIsLoading(false)
    }
  }

  const handleEnviarSolicitacao = async (e: React.FormEvent) => {
    e.preventDefault()
    setEnviandoSolicitacao(true)
    setError('')

    try {
      const res = await fetch('/api/hospital/auth/solicitar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospital_nome: solicitacaoNome,
          cnpj: solicitacaoCnpj,
          cidade: solicitacaoCidade,
          uf: solicitacaoUf,
          responsavel_nome: solicitacaoResp,
          cargo: solicitacaoCargo,
          telefone: solicitacaoTelefone,
          email: solicitacaoEmail,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error || 'Erro ao registrar solicitação.')
        setEnviandoSolicitacao(false)
        return
      }

      setSolicitacaoSucesso(true)
    } catch (err: any) {
      setError(err.message || 'Falha ao enviar solicitação.')
    } finally {
      setEnviandoSolicitacao(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-['Inter'] relative overflow-hidden">
      {/* Background Decorativo Médico */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900 to-slate-950 pointer-events-none" />

      {/* Top Bar com Botão Voltar e ThemeToggle */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between max-w-5xl mx-auto z-10">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white text-xs font-semibold backdrop-blur-md border border-slate-700/60 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao Login do Paciente</span>
        </Link>

        <ThemeToggle className="text-slate-300 hover:text-white bg-slate-800/60 border border-slate-700/60" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        {/* Logo e Identificação */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-3xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mb-3 shadow-lg shadow-blue-500/10">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight text-center">
            Portal Hospitalar & Clínico
          </h1>
          <p className="mt-1 text-xs text-slate-400 text-center">
            Acesso exclusivo para regulação, triagem de urgência e acolhimento
          </p>
        </div>

        {/* Card Principal de Login */}
        <div className="bg-slate-800/80 backdrop-blur-xl py-8 px-5 sm:px-8 rounded-3xl border border-slate-700/70 shadow-2xl space-y-5">
          {/* Alertas */}
          {error && (
            <div className="bg-red-950/60 border border-red-800 text-red-300 p-3.5 rounded-2xl text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-950/60 border border-emerald-800 text-emerald-300 p-3.5 rounded-2xl text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <div className="font-semibold">{successMsg}</div>
            </div>
          )}

          {/* Box de Perfil Homologado de Teste */}
          <div className="bg-blue-950/40 border border-blue-500/30 p-4 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500 text-white uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3" />
                Perfil Homologado para Teste
              </span>
              <span className="text-[11px] text-slate-400">Garanhuns - PE</span>
            </div>
            <div className="text-xs font-bold text-white">Hospital Regional Dom Moura (HRDM)</div>
            <div className="text-[11px] text-slate-300">
              E-mail: <code className="text-blue-300 font-mono">hospital.dommoura@cuidae.med.br</code>
            </div>

            <button
              type="button"
              onClick={preencherHospitalTeste}
              className="mt-2 w-full py-2 px-3 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400/30 text-blue-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Preencher Credenciais deste Hospital
            </button>
          </div>

          {/* Formulário de Login */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                E-mail Institucional do Hospital
              </label>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 rounded-xl border border-slate-700 bg-slate-900/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="hospital.dommoura@cuidae.med.br"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Senha de Acesso
              </label>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 rounded-xl border border-slate-700 bg-slate-900/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/30 disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Entrar no Painel Hospitalar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Solicitar Credenciamento */}
          <div className="pt-3 border-t border-slate-700/60 text-center">
            <div className="text-xs text-slate-400 mb-2">
              Deseja credenciar um novo hospital ou unidade de saúde?
            </div>
            <button
              type="button"
              onClick={() => setModalCredenciamentoAberto(true)}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-600/60 transition flex items-center justify-center gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Solicitar Credenciamento de Nova Unidade</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Credenciamento */}
      {modalCredenciamentoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-6 sm:p-7 shadow-2xl relative text-left">
            <button
              onClick={() => {
                setModalCredenciamentoAberto(false)
                setSolicitacaoSucesso(false)
              }}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Credenciamento Hospitalar</h3>
                <p className="text-xs text-slate-400">Homologação direta com o administrador</p>
              </div>
            </div>

            <div className="bg-amber-950/40 border border-amber-600/40 rounded-2xl p-4 mb-4 text-xs text-amber-200 space-y-3">
              <p className="leading-relaxed">
                Por sigilo médico e acesso aos prontuários gerados pela IA, a ativação de qualquer perfil hospitalar precisa ser autorizada diretamente pelo administrador através do e-mail oficial:
              </p>

              <div className="bg-slate-800/90 border border-amber-500/30 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono font-bold text-white">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-400" />
                  <span>murillokennedy12@gmail.com</span>
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={copiarEmailAdmin}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-sans font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 transition flex items-center gap-1 flex-1 sm:flex-none justify-center"
                  >
                    {emailCopiado ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{emailCopiado ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                  <a
                    href="mailto:murillokennedy12@gmail.com?subject=Credenciamento%20de%20Unidade%20Hospitalar%20-%20Cuida%C3%AA"
                    className="px-3 py-1.5 rounded-lg text-[11px] font-sans font-semibold bg-blue-600 hover:bg-blue-500 text-white transition flex items-center gap-1 flex-1 sm:flex-none justify-center"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir E-mail</span>
                  </a>
                </div>
              </div>
            </div>

            {solicitacaoSucesso ? (
              <div className="bg-emerald-950/50 border border-emerald-700/50 rounded-2xl p-5 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">Solicitação Pré-Cadastrada!</h4>
                <p className="text-xs text-slate-300">
                  Seus dados foram gravados com sucesso. Envie também uma mensagem para <strong>murillokennedy12@gmail.com</strong> para ativação imediata.
                </p>
                <button
                  type="button"
                  onClick={() => setModalCredenciamentoAberto(false)}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500"
                >
                  Entendi
                </button>
              </div>
            ) : (
              <form onSubmit={handleEnviarSolicitacao} className="space-y-3">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Pré-Cadastro da Unidade
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Nome do Hospital ou Pronto-Socorro *
                  </label>
                  <input
                    type="text"
                    required
                    value={solicitacaoNome}
                    onChange={(e) => setSolicitacaoNome(e.target.value)}
                    placeholder="Ex: Hospital Municipal Dr. José Silva"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">CNPJ *</label>
                    <input
                      type="text"
                      required
                      value={solicitacaoCnpj}
                      onChange={(e) => setSolicitacaoCnpj(e.target.value)}
                      placeholder="00.000.000/0001-00"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Município / UF *</label>
                    <input
                      type="text"
                      required
                      value={solicitacaoCidade}
                      onChange={(e) => setSolicitacaoCidade(e.target.value)}
                      placeholder="Garanhuns - PE"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Responsável Técnico *</label>
                    <input
                      type="text"
                      required
                      value={solicitacaoResp}
                      onChange={(e) => setSolicitacaoResp(e.target.value)}
                      placeholder="Nome completo (com CRM)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Telefone da Recepção *</label>
                    <input
                      type="text"
                      required
                      value={solicitacaoTelefone}
                      onChange={(e) => setSolicitacaoTelefone(e.target.value)}
                      placeholder="(87) 3700-0000"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">E-mail Institucional *</label>
                  <input
                    type="email"
                    required
                    value={solicitacaoEmail}
                    onChange={(e) => setSolicitacaoEmail(e.target.value)}
                    placeholder="recepcao@hospital.com.br"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalCredenciamentoAberto(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={enviandoSolicitacao}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-60"
                  >
                    {enviandoSolicitacao ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Enviar Solicitação de Homologação</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function HospitalLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
          <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <HospitalLoginForm />
    </Suspense>
  )
}
