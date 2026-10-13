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
  ArrowRight
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
    <div className="sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-up font-['Inter'] relative px-4">
      {/* Top Action: Theme Toggle */}
      <div className="flex justify-between items-center mb-6">
        <Link href="/" className="transition hover:opacity-90">
          <Image
            src="/images/cuidae-logo-trimmed.png"
            alt="Cuidaê Logo"
            width={144}
            height={40}
            className="h-10 w-36 object-contain dark:brightness-110"
            priority
          />
        </Link>
        <ThemeToggle />
      </div>

      {/* Caixa de Login do Paciente */}
      <div className="bg-white dark:bg-slate-900 py-8 px-5 sm:px-8 shadow-xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 transition-colors duration-200">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Acesse sua conta
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Acompanhe suas triagens com IA, prontuários e agendamentos
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-950/60 p-3.5 rounded-xl text-red-600 dark:text-red-400 text-xs sm:text-sm border border-red-100 dark:border-red-900 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        {/* Google Login (1 clique) */}
        <div className="mb-6">
          <GoogleButton label="Continuar com o Google" />
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 dark:text-slate-500 font-medium tracking-wider">
              ou continue com email
            </span>
          </div>
        </div>

        {/* Formulário de Email e Senha */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              E-mail
            </label>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
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
                className="block w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2b85ff] text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="senha" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Senha
              </label>
              <Link href="/recuperar-senha" className="text-xs font-medium text-[#2b85ff] hover:underline">
                Esqueceu a senha?
              </Link>
            </div>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
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
                className="block w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2b85ff] text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
                placeholder="••••••••"
              />
              <button
                type="button"
                aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center py-3.5 px-6 border border-transparent rounded-full shadow-md text-sm font-semibold text-white bg-[#091426] dark:bg-blue-600 hover:bg-[#1a2c4e] dark:hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2b85ff] transition disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Entrar</span>
                <LogIn className="ml-2 h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center pt-4 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Ainda não tem conta?{' '}
            <Link href="/cadastro" className="font-semibold text-[#2b85ff] hover:underline">
              Cadastrar grátis
            </Link>
          </p>
        </div>
      </div>

      {/* Banner Exclusivo: Acesso para Hospitais */}
      <div className="mt-6 text-center">
        <Link
          href="/hospital/login"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-semibold shadow-xs hover:border-blue-400 transition group"
        >
          <Building2 className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
          <span>É uma unidade de saúde? <strong>Acessar Portal Hospitalar</strong></span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
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
