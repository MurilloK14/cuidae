'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, Eye, EyeOff, ArrowRight, LogIn } from 'lucide-react';
import { signIn } from '@/lib/auth/actions';
import { GoogleButton } from '@/components/GoogleButton';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', senha);
      const result = await signIn(formData);
      if (result?.error) {
        setError(result.error);
      }
    } catch (err: any) {
      // redirect() throws a NEXT_REDIRECT error — that's expected on success
      if (err?.digest?.startsWith('NEXT_REDIRECT')) return;
      setError(err.message || 'Ocorreu um erro ao fazer login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-up">
      <div className="flex justify-center mb-8">
        <Image src="/images/cuidae-logo-trimmed.png" alt="Cuidaê Logo" width={144} height={40} className="h-10 w-36 object-contain" />
      </div>
      
      <div className="bg-white py-8 px-4 shadow-xl sm:rounded-3xl border border-slate-100 sm:px-10">
        <h2 className="mt-2 text-center text-2xl font-bold tracking-tight text-slate-900 mb-6">
          Acesse sua conta
        </h2>
        
        {error && (
          <div className="mb-4 bg-red-50 p-3 rounded-lg text-red-600 text-sm border border-red-100">
            {error}
          </div>
        )}

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

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2b85ff] focus:border-[#2b85ff] sm:text-sm"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between">
              <label htmlFor="senha" className="block text-sm font-medium text-slate-700">
                Senha
              </label>
              <Link href="/recuperar-senha" className="text-sm font-medium text-[#2b85ff] hover:underline">
                Esqueci minha senha
              </Link>
            </div>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                id="senha"
                name="senha"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="block w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2b85ff] focus:border-[#2b85ff] sm:text-sm"
                placeholder="••••••••"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                ) : (
                  <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                )}
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3.5 px-8 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-[#091426] hover:bg-[#1a2c4e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2b85ff] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Entrar
                  <LogIn className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600">
            Ainda não tem conta?{' '}
            <Link href="/cadastro" className="font-medium text-[#2b85ff] hover:underline">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
