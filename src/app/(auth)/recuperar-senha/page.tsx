'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { requestPasswordReset } from '@/lib/auth/actions';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('email', email);
      const result = await requestPasswordReset(formData);
      if (result.success) {
        setIsSuccess(true);
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[440px] mx-auto animate-fade-in-up font-jakarta py-6 px-4">
      {/* Top Header: Logo & ThemeToggle */}
      <div className="flex items-center justify-between mb-6">
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
        <ThemeToggle />
      </div>
      
      <div className="relative bg-white/95 dark:bg-[#0c1322]/95 backdrop-blur-xl py-8 px-5 sm:px-8 shadow-2xl shadow-slate-200/50 dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] rounded-3xl border border-slate-200/90 dark:border-slate-800/90 transition-colors duration-200 overflow-hidden">
        {/* Specular highlight rim */}
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 dark:via-blue-400/40 to-transparent pointer-events-none" />

        <div className="mb-4">
          <Link href="/login" className="inline-flex items-center text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Voltar para o login
          </Link>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
          Recuperar senha
        </h1>
        
        {isSuccess ? (
          <div className="mt-4 bg-emerald-500/10 dark:bg-emerald-950/40 p-4 rounded-2xl text-emerald-700 dark:text-emerald-300 text-sm border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Email enviado com sucesso!</p>
              <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 leading-relaxed">
                Enviamos um link de recuperação para o email informado. Verifique sua caixa de entrada e pasta de spam.
              </p>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Digite o email associado à sua conta e enviaremos um link para você redefinir sua senha com segurança.
            </p>

            {error && (
              <div className="mb-4 bg-red-500/10 dark:bg-red-950/40 p-3.5 rounded-2xl text-red-600 dark:text-red-400 text-xs sm:text-sm border border-red-200 dark:border-red-900/60 font-medium">
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Email
                </label>
                <div className="relative rounded-2xl group transition-all">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors">
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
                    className="block w-full h-12 pl-10 pr-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 flex justify-center items-center gap-2 rounded-2xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 shadow-lg shadow-blue-600/25 hover:shadow-blue-600/35 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? (
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Enviar link de recuperação'
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
