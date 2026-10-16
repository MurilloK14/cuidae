'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Lock, Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react';
import { resetPassword } from '@/lib/auth/actions';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function RedefinirSenhaPage() {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (novaSenha.length < 8) newErrors.novaSenha = 'A senha deve ter pelo menos 8 caracteres.';
    else if (!/[A-Z]/.test(novaSenha)) newErrors.novaSenha = 'A senha deve ter pelo menos 1 letra maiúscula.';
    else if (!/[0-9]/.test(novaSenha)) newErrors.novaSenha = 'A senha deve ter pelo menos 1 número.';
    
    if (novaSenha !== confirmarNovaSenha) newErrors.confirmarNovaSenha = 'As senhas não coincidem.';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsLoading(true);
    setErrors({});
    
    try {
      const formData = new FormData();
      formData.append('nova_senha', novaSenha);
      const result = await resetPassword(formData);
      if (result?.error) {
        setErrors({ form: result.error });
      } else {
        setIsSuccess(true);
      }
    } catch (err: any) {
      if (err?.digest?.startsWith('NEXT_REDIRECT')) {
        setIsSuccess(true);
        return;
      }
      setErrors({ form: err.message || 'Ocorreu um erro ao redefinir a senha.' });
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

        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2 text-center">
          Criar nova senha
        </h1>
        <p className="text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6">
          Defina uma nova senha forte para acessar sua conta
        </p>
        
        {isSuccess ? (
          <div className="text-center py-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 mb-4">
              <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-slate-900 dark:text-white font-bold text-lg mb-2">Senha redefinida com sucesso!</p>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mb-6">Sua senha foi atualizada e agora você pode acessar sua conta com segurança.</p>
            <Link 
              href="/login"
              className="w-full h-12 flex justify-center items-center gap-2 rounded-2xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 shadow-lg shadow-blue-600/25 transition-all"
            >
              Fazer login
            </Link>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            {errors.form && (
              <div className="mb-4 bg-red-500/10 dark:bg-red-950/40 p-3.5 rounded-2xl text-red-600 dark:text-red-400 text-xs sm:text-sm border border-red-200 dark:border-red-900/60 font-medium">
                {errors.form}
              </div>
            )}

            <div>
              <label htmlFor="novaSenha" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Nova senha
              </label>
              <div className="relative rounded-2xl group transition-all">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="novaSenha"
                  type={showNovaSenha ? 'text' : 'password'}
                  required
                  value={novaSenha}
                  onChange={(e) => { setNovaSenha(e.target.value); setErrors((p) => ({...p, novaSenha: ''})); }}
                  className={`block w-full h-12 pl-10 pr-11 rounded-2xl border ${errors.novaSenha ? 'border-red-400 dark:border-red-800' : 'border-slate-200 dark:border-slate-800'} bg-slate-50/70 dark:bg-slate-900/80 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-sm font-medium transition-all`}
                  placeholder="Mínimo 8 caracteres"
                />
                <button
                  type="button"
                  aria-label={showNovaSenha ? 'Ocultar nova senha' : 'Exibir nova senha'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  onClick={() => setShowNovaSenha(!showNovaSenha)}
                >
                  {showNovaSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.novaSenha && <p className="mt-1 text-xs text-red-500">{errors.novaSenha}</p>}
            </div>

            <div>
              <label htmlFor="confirmarNovaSenha" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Confirmar nova senha
              </label>
              <div className="relative rounded-2xl group transition-all">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="confirmarNovaSenha"
                  type={showConfirmarSenha ? 'text' : 'password'}
                  required
                  value={confirmarNovaSenha}
                  onChange={(e) => { setConfirmarNovaSenha(e.target.value); setErrors((p) => ({...p, confirmarNovaSenha: ''})); }}
                  className={`block w-full h-12 pl-10 pr-11 rounded-2xl border ${errors.confirmarNovaSenha ? 'border-red-400 dark:border-red-800' : 'border-slate-200 dark:border-slate-800'} bg-slate-50/70 dark:bg-slate-900/80 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-sm font-medium transition-all`}
                  placeholder="Repita a nova senha"
                />
                <button
                  type="button"
                  aria-label={showConfirmarSenha ? 'Ocultar confirmação de nova senha' : 'Exibir confirmação de nova senha'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  onClick={() => setShowConfirmarSenha(!showConfirmarSenha)}
                >
                  {showConfirmarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmarNovaSenha && <p className="mt-1 text-xs text-red-500">{errors.confirmarNovaSenha}</p>}
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
                  'Redefinir senha'
                )}
              </button>
            </div>
            
            <div className="mt-4 text-center">
              <Link href="/login" className="inline-flex items-center text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group">
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
                Voltar para o login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
