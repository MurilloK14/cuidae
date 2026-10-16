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
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  ArrowLeft
} from 'lucide-react';
import { signIn } from '@/lib/auth/actions';
import { GoogleButton } from '@/components/GoogleButton';
import { ThemeToggle } from '@/components/ThemeToggle';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const tabParam = searchParams.get('tab') || searchParams.get('perfil');
    // Se o usuário veio procurando o hospital, redireciona para a página dedicada
    if (tabParam === 'hospital') {
      router.replace('/hospital/login');
      return;
    }
    const urlError = searchParams.get('error');
    if (urlError) setError(urlError);
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Se o usuário tentar logar com email do hospital na tela do paciente, redireciona para o portal hospitalar
    if (email.toLowerCase().includes('hospital.') || email.toLowerCase().includes('@cuidae.med.br')) {
      router.push('/hospital/login');
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

  return (
    <div className="w-full max-w-[440px] mx-auto animate-fade-in-up font-jakarta relative px-4">
      {/* Top Header: Navigation & Theme Toggle */}
      <div className="flex items-center justify-between mb-6">
        <Link 
          href="/" 
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Início</span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Caixa de Login do Paciente */}
      <div className="relative rounded-3xl bg-white/95 dark:bg-[#0c1322]/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xl shadow-slate-200/50 dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-6 sm:p-8 transition-colors duration-200 overflow-hidden">
        {/* Specular highlight rim */}
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 dark:via-blue-400/40 to-transparent pointer-events-none" />

        {/* Brand Logo & Title */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <Link href="/" className="inline-block transition hover:opacity-90">
              <Image
                src="/images/cuidae-logo-trimmed.png"
                alt="Cuidaê Logo"
                width={140}
                height={38}
                className="h-9 w-auto object-contain dark:brightness-110"
                priority
              />
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Acesse sua conta
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Triagens com IA, agendamentos e prontuários em um só lugar
          </p>
        </div>

        {error && (
          <div className="mb-5 bg-red-500/10 dark:bg-red-950/40 p-3.5 rounded-2xl text-red-600 dark:text-red-400 text-xs sm:text-sm border border-red-200 dark:border-red-900/60 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
            <div className="leading-relaxed font-medium">{error}</div>
          </div>
        )}

        {/* Google Login (1 clique) */}
        <div className="mb-6">
          <GoogleButton label="Continuar com o Google" />
        </div>

        {/* Divisor */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white dark:bg-[#0c1322] px-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[11px]">
              ou continue com email
            </span>
          </div>
        </div>

        {/* Formulário de Email e Senha */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              E-mail
            </label>
            <div className="relative rounded-2xl group transition-all">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors">
                <Mail className="h-4 w-4" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full h-12 pl-10 pr-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-500 transition-all"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="senha" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Senha
              </label>
              <Link href="/recuperar-senha" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 hover:underline transition-colors">
                Esqueceu a senha?
              </Link>
            </div>
            <div className="relative rounded-2xl group transition-all">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="senha"
                name="senha"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="block w-full h-12 pl-10 pr-11 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-500 transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 flex justify-center items-center gap-2 rounded-2xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 shadow-lg shadow-blue-600/25 hover:shadow-blue-600/35 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer group"
          >
            {isLoading ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Entrar</span>
                <LogIn className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center pt-5 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Ainda não tem conta?{' '}
            <Link href="/cadastro" className="font-bold text-blue-600 dark:text-blue-400 hover:underline transition-colors">
              Cadastre-se grátis
            </Link>
          </p>
        </div>
      </div>

      {/* Banner Exclusivo: Acesso para Hospitais */}
      <div className="mt-5 text-center">
        <Link
          href="/hospital/login"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-400/60 dark:hover:border-blue-500/40 text-xs font-semibold shadow-xs hover:shadow-sm transition-all group"
        >
          <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
          <span>É uma unidade de saúde? <strong>Acessar Portal Hospitalar</strong></span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Trust & Security Badge */}
      <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        <span>Ambiente seguro • Em conformidade com a LGPD</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-[440px] mx-auto py-16 flex flex-col justify-center items-center gap-3">
          <div className="h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-medium font-jakarta">Carregando portal de acesso...</span>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
