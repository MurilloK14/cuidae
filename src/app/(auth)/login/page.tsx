'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Building2,
  User,
  ShieldCheck,
  CheckCircle2,
  Copy,
  ExternalLink,
  AlertCircle,
  HelpCircle,
  Stethoscope,
  Sparkles,
  ArrowRight,
  Send,
  X
} from 'lucide-react';
import { signIn } from '@/lib/auth/actions';
import { GoogleButton } from '@/components/GoogleButton';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Abas: 'paciente' ou 'hospital'
  const [abaAtiva, setAbaAtiva] = useState<'paciente' | 'hospital'>('paciente');

  // Estados Formulário Geral
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Estados Modal de Credenciamento Hospitalar
  const [modalCredenciamentoAberto, setModalCredenciamentoAberto] = useState(false);
  const [emailCopiado, setEmailCopiado] = useState(false);

  // Estados Formulário de Solicitação Hospitalar
  const [solicitacaoNome, setSolicitacaoNome] = useState('');
  const [solicitacaoCnpj, setSolicitacaoCnpj] = useState('');
  const [solicitacaoCidade, setSolicitacaoCidade] = useState('');
  const [solicitacaoUf, setSolicitacaoUf] = useState('PE');
  const [solicitacaoResp, setSolicitacaoResp] = useState('');
  const [solicitacaoCargo, setSolicitacaoCargo] = useState('Médico Chefe / Coordenação');
  const [solicitacaoTelefone, setSolicitacaoTelefone] = useState('');
  const [solicitacaoEmail, setSolicitacaoEmail] = useState('');
  const [enviandoSolicitacao, setEnviandoSolicitacao] = useState(false);
  const [solicitacaoSucesso, setSolicitacaoSucesso] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get('tab') || searchParams.get('perfil');
    if (tabParam === 'hospital') {
      setAbaAtiva('hospital');
    }
    const urlError = searchParams.get('error');
    if (urlError) setError(urlError);
  }, [searchParams]);

  const copiarEmailAdmin = () => {
    navigator.clipboard.writeText('murillokennedy12@gmail.com');
    setEmailCopiado(true);
    setTimeout(() => setEmailCopiado(false), 3000);
  };

  const preencherHospitalTeste = () => {
    setEmail('hospital.dommoura@cuidae.med.br');
    setSenha('Hospital@2026');
    setError('');
  };

  // Submit Login Paciente
  const handlePacienteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Se o usuário digitou o email de teste do hospital na aba de paciente, redireciona suavemente
    if (email.toLowerCase().includes('hospital.') || email.toLowerCase().includes('@cuidae.med.br')) {
      handleHospitalSubmit(e);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', senha);
      const result = await signIn(formData);
      if (result?.error) {
        setError(result.error);
      }
    } catch (err: any) {
      if (err?.digest?.startsWith('NEXT_REDIRECT')) return;
      setError(err.message || 'Ocorreu um erro ao fazer login.');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Login Hospital
  const handleHospitalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/hospital/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Credenciais hospitalares inválidas.');
        setIsLoading(false);
        return;
      }

      setSuccessMsg(`Unidade autenticada: ${data.session?.hospital_nome}. Redirecionando para a fila...`);
      setTimeout(() => {
        router.push('/hospital/painel');
        router.refresh();
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Erro de conexão com o portal hospitalar.');
      setIsLoading(false);
    }
  };

  // Submit Solicitação de Credenciamento
  const handleEnviarSolicitacao = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviandoSolicitacao(true);
    setError('');

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
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Erro ao registrar solicitação.');
        setEnviandoSolicitacao(false);
        return;
      }

      setSolicitacaoSucesso(true);
    } catch (err: any) {
      setError(err.message || 'Falha ao enviar solicitação.');
    } finally {
      setEnviandoSolicitacao(false);
    }
  };

  return (
    <div className="sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-up">
      {/* Logo */}
      <div className="flex justify-center mb-6">
        <Link href="/" className="transition hover:opacity-90">
          <Image
            src="/images/cuidae-logo-trimmed.png"
            alt="Cuidaê Logo"
            width={144}
            height={40}
            className="h-10 w-36 object-contain"
            priority
          />
        </Link>
      </div>

      {/* Caixa Principal */}
      <div className="bg-white py-8 px-4 shadow-xl sm:rounded-3xl border border-slate-100 sm:px-10">
        {/* Seletor de Perfil (Abas) */}
        <div className="grid grid-cols-2 p-1 mb-6 bg-slate-100 rounded-2xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => {
              setAbaAtiva('paciente');
              setError('');
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              abaAtiva === 'paciente'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4 text-[#2b85ff]" />
            <span>Sou Paciente</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAbaAtiva('hospital');
              setError('');
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              abaAtiva === 'hospital'
                ? 'bg-[#091426] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className={`w-4 h-4 ${abaAtiva === 'hospital' ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span>Área Hospitalar</span>
          </button>
        </div>

        {/* Título dinâmico */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {abaAtiva === 'paciente' ? 'Acesse sua conta' : 'Acesso Hospitalar & Recepção'}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {abaAtiva === 'paciente'
              ? 'Consulte suas triagens, históricos e agendamentos'
              : 'Painel exclusivo para regulação, acolhimento e corpo clínico'}
          </p>
        </div>

        {/* Mensagens de Erro / Sucesso */}
        {error && (
          <div className="mb-4 bg-red-50 p-3.5 rounded-xl text-red-600 text-xs sm:text-sm border border-red-100 flex items-start gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 bg-emerald-50 p-3.5 rounded-xl text-emerald-700 text-xs sm:text-sm border border-emerald-200 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <div className="font-medium">{successMsg}</div>
          </div>
        )}

        {/* ---------------- ABA 1: PACIENTE ---------------- */}
        {abaAtiva === 'paciente' && (
          <>
            {/* Google Login */}
            <div className="mb-6">
              <GoogleButton label="Entrar com o Google" />
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-slate-400 font-medium tracking-wider">
                  ou continue com email
                </span>
              </div>
            </div>

            <form className="space-y-5" onSubmit={handlePacienteSubmit}>
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  E-mail
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2b85ff] focus:border-[#2b85ff] text-sm text-slate-900 placeholder:text-slate-400"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="senha" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Senha
                  </label>
                  <Link href="/recuperar-senha" className="text-xs font-medium text-[#2b85ff] hover:underline">
                    Esqueceu?
                  </Link>
                </div>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    id="senha"
                    name="senha"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2b85ff] focus:border-[#2b85ff] text-sm text-slate-900 placeholder:text-slate-400"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3.5 px-6 border border-transparent rounded-full shadow-md text-sm font-semibold text-white bg-[#091426] hover:bg-[#1a2c4e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2b85ff] transition disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Entrar como Paciente</span>
                    <LogIn className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center pt-4 border-t border-slate-100">
              <p className="text-xs sm:text-sm text-slate-600">
                Ainda não tem conta de paciente?{' '}
                <Link href="/cadastro" className="font-semibold text-[#2b85ff] hover:underline">
                  Cadastrar grátis
                </Link>
              </p>
            </div>
          </>
        )}

        {/* ---------------- ABA 2: HOSPITAL ---------------- */}
        {abaAtiva === 'hospital' && (
          <div className="space-y-5">
            {/* Box de Demonstração / Perfil Homologado */}
            <div className="bg-gradient-to-br from-blue-50/90 to-emerald-50/80 p-4 rounded-2xl border border-blue-100/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-600 text-white uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Perfil Homologado para Teste
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Garanhuns - PE</span>
              </div>
              <div className="text-xs font-bold text-slate-800">Hospital Regional Dom Moura (HRDM)</div>
              <div className="text-[11px] text-slate-600 mt-0.5">
                E-mail: <code className="bg-white/80 px-1 py-0.5 rounded font-mono text-blue-700">hospital.dommoura@cuidae.med.br</code>
              </div>

              <button
                type="button"
                onClick={preencherHospitalTeste}
                className="mt-3 w-full py-2 px-3 rounded-xl bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Preencher Credenciais deste Hospital
              </button>
            </div>

            {/* Formulário Hospitalar */}
            <form className="space-y-4" onSubmit={handleHospitalSubmit}>
              <div>
                <label htmlFor="hosp-email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  E-mail Institucional do Hospital
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Building2 className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    id="hosp-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm text-slate-900 placeholder:text-slate-400"
                    placeholder="hospital.dommoura@cuidae.med.br"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="hosp-senha" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Senha de Acesso
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    id="hosp-senha"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm text-slate-900 placeholder:text-slate-400"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3.5 px-6 border border-transparent rounded-full shadow-md text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Entrar no Painel Hospitalar</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Seção Criar Novo Perfil para Hospital */}
            <div className="pt-4 border-t border-slate-100 text-center">
              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 text-left">
                <div className="flex items-start gap-2.5">
                  <Stethoscope className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Deseja cadastrar uma nova unidade de saúde?
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      Para segurança dos pacientes e conformidade médica, a criação de perfis hospitalares exige homologação e liberação pelo administrador.
                    </p>
                  </div>
                </div>

                <div className="mt-3.5 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => setModalCredenciamentoAberto(true)}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#091426] hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
                  >
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                    Criar Perfil / Solicitar Credenciamento
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL DE CREDENCIAMENTO HOSPITALAR & LIBERAÇÃO POR EMAIL */}
      {/* ======================================================== */}
      {modalCredenciamentoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 p-6 sm:p-7 relative">
            {/* Fechar */}
            <button
              onClick={() => {
                setModalCredenciamentoAberto(false);
                setSolicitacaoSucesso(false);
              }}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Cabeçalho */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Credenciamento de Unidade Hospitalar</h3>
                <p className="text-xs text-slate-500">Conexão oficial ao sistema de triagem com IA Cuidaê</p>
              </div>
            </div>

            {/* Caixa de Regra Obrigatória: Email do Administrador */}
            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 mb-5">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-xs text-amber-900 leading-relaxed">
                  <span className="font-bold">Liberação Manual Obrigatória:</span> Por motivos de segurança, sigilo médico e acesso aos prontuários de urgência, a ativação de qualquer perfil hospitalar precisa ser autorizada diretamente pelo administrador da plataforma através do e-mail oficial:
                </div>
              </div>

              <div className="mt-3 bg-white border border-amber-200/90 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-800">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span>murillokennedy12@gmail.com</span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={copiarEmailAdmin}
                    className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center justify-center gap-1"
                  >
                    {emailCopiado ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>

                  <a
                    href="mailto:murillokennedy12@gmail.com?subject=Solicita%C3%A7%C3%A3o%20de%20Credenciamento%20Hospitalar%20-%20Cuida%C3%AA&body=Ol%C3%A1%20Murillo,%0D%0A%0D%0ASolicitamos%20a%20cria%C3%A7%C3%A3o%20e%20homologa%C3%A7%C3%A3o%20de%20um%20perfil%20hospitalar%20para%20o%20Cuida%C3%AA:%0D%0A%0D%0A-%20Nome%20da%20Unidade:%20%0D%0A-%20CNPJ:%20%0D%0A-%20Munic%C3%ADpio/UF:%20%0D%0A-%20Respons%C3%A1vel%20T%C3%A9cnico:%20%0D%0A-%20CRM%20ou%20COREN:%20%0D%0A-%20Telefone:%20%0D%0A-%20E-mail%20institucional:%20%0D%0A%0D%0AAguardo%20a%20libera%C3%A7%C3%A3o%20do%20perfil."
                    className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition flex items-center justify-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir E-mail</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Conteúdo: Formulário de Solicitação ou Feedback de Sucesso */}
            {solicitacaoSucesso ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-emerald-900">
                  Solicitação Registrada com Sucesso!
                </h4>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Os dados do hospital foram salvos e aguardam liberação pelo administrador.
                  Envie também uma mensagem para <strong>murillokennedy12@gmail.com</strong> para homologação imediata da sua instituição.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setModalCredenciamentoAberto(false);
                    setSolicitacaoSucesso(false);
                  }}
                  className="px-5 py-2 rounded-full bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition"
                >
                  Entendi e vou aguardar
                </button>
              </div>
            ) : (
              <form onSubmit={handleEnviarSolicitacao} className="space-y-3.5">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Pré-Cadastro da Unidade
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Nome Oficial do Hospital ou Pronto-Socorro *
                  </label>
                  <input
                    type="text"
                    required
                    value={solicitacaoNome}
                    onChange={(e) => setSolicitacaoNome(e.target.value)}
                    placeholder="Ex: Hospital Municipal Dr. José Silva"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      CNPJ da Instituição *
                    </label>
                    <input
                      type="text"
                      required
                      value={solicitacaoCnpj}
                      onChange={(e) => setSolicitacaoCnpj(e.target.value)}
                      placeholder="00.000.000/0001-00"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Município / UF *
                    </label>
                    <input
                      type="text"
                      required
                      value={solicitacaoCidade}
                      onChange={(e) => setSolicitacaoCidade(e.target.value)}
                      placeholder="Ex: Garanhuns - PE"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Responsável Técnico / Médico *
                    </label>
                    <input
                      type="text"
                      required
                      value={solicitacaoResp}
                      onChange={(e) => setSolicitacaoResp(e.target.value)}
                      placeholder="Nome completo (com CRM)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Telefone da Recepção *
                    </label>
                    <input
                      type="text"
                      required
                      value={solicitacaoTelefone}
                      onChange={(e) => setSolicitacaoTelefone(e.target.value)}
                      placeholder="(87) 3700-0000"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    E-mail Institucional para Login *
                  </label>
                  <input
                    type="email"
                    required
                    value={solicitacaoEmail}
                    onChange={(e) => setSolicitacaoEmail(e.target.value)}
                    placeholder="recepcao@hospital.com.br"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalCredenciamentoAberto(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={enviandoSolicitacao}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-60"
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
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="sm:mx-auto sm:w-full sm:max-w-md py-16 flex flex-col justify-center items-center gap-3">
          <div className="h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-medium">Carregando portal de acesso...</span>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
