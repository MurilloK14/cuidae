'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, ArrowLeft } from 'lucide-react';
import { requestPasswordReset } from '@/lib/auth/actions';

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
    <div className="sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-up">
      <div className="flex justify-center mb-8">
        <Image src="/images/cuidae-logo-trimmed.png" alt="Cuidaê Logo" width={144} height={40} className="h-10 w-36 object-contain" />
      </div>
      
      <div className="bg-white py-8 px-4 shadow-xl sm:rounded-3xl border border-slate-100 sm:px-10">
        <div className="mb-6">
          <Link href="/login" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para o login
          </Link>
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
          Recuperar senha
        </h2>
        
        {isSuccess ? (
          <div className="mt-4 bg-green-50 p-4 rounded-xl text-green-800 text-sm border border-green-200">
            <p className="font-medium">Email enviado com sucesso!</p>
            <p className="mt-1">Enviamos um link de recuperação para o email informado. Verifique sua caixa de entrada e spam.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-600 mb-6">
              Digite o email associado à sua conta e enviaremos um link para você redefinir sua senha.
            </p>

            {error && (
              <div className="mb-4 bg-red-50 p-3 rounded-lg text-red-600 text-sm border border-red-100">
                {error}
              </div>
            )}

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
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-3.5 px-8 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-[#091426] hover:bg-[#1a2c4e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2b85ff] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
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
