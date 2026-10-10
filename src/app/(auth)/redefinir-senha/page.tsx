'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Lock, Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react';
import { resetPassword } from '@/lib/auth/actions';

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
    <div className="sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-up">
      <div className="flex justify-center mb-8">
        <Image src="/images/cuidae-logo-trimmed.png" alt="Cuidaê Logo" width={144} height={40} className="h-10 w-36 object-contain" />
      </div>
      
      <div className="bg-white py-8 px-4 shadow-xl sm:rounded-3xl border border-slate-100 sm:px-10">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-6 text-center">
          Criar nova senha
        </h2>
        
        {isSuccess ? (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <ShieldCheck className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-slate-900 font-medium mb-2">Senha redefinida com sucesso!</p>
            <p className="text-slate-600 text-sm mb-6">Sua senha foi atualizada e agora você pode acessar sua conta.</p>
            <Link 
              href="/login"
              className="w-full flex justify-center py-3.5 px-8 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-[#091426] hover:bg-[#1a2c4e] transition-colors"
            >
              Fazer login
            </Link>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            {errors.form && (
              <div className="bg-red-50 p-3 rounded-lg text-red-600 text-sm border border-red-100">
                {errors.form}
              </div>
            )}

            <div>
              <label htmlFor="novaSenha" className="block text-sm font-medium text-slate-700">
                Nova senha
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="novaSenha"
                  type={showNovaSenha ? 'text' : 'password'}
                  required
                  value={novaSenha}
                  onChange={(e) => { setNovaSenha(e.target.value); setErrors((p) => ({...p, novaSenha: ''})); }}
                  className={`block w-full pl-10 pr-10 py-3 rounded-xl border ${errors.novaSenha ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 focus:ring-[#2b85ff] focus:border-[#2b85ff]'} focus:outline-none focus:ring-2 sm:text-sm`}
                  placeholder="Mínimo 8 caracteres"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer" onClick={() => setShowNovaSenha(!showNovaSenha)}>
                  {showNovaSenha ? (
                    <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                  )}
                </div>
              </div>
              {errors.novaSenha && <p className="mt-1 text-sm text-red-600">{errors.novaSenha}</p>}
            </div>

            <div>
              <label htmlFor="confirmarNovaSenha" className="block text-sm font-medium text-slate-700">
                Confirmar nova senha
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="confirmarNovaSenha"
                  type={showConfirmarSenha ? 'text' : 'password'}
                  required
                  value={confirmarNovaSenha}
                  onChange={(e) => { setConfirmarNovaSenha(e.target.value); setErrors((p) => ({...p, confirmarNovaSenha: ''})); }}
                  className={`block w-full pl-10 pr-10 py-3 rounded-xl border ${errors.confirmarNovaSenha ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 focus:ring-[#2b85ff] focus:border-[#2b85ff]'} focus:outline-none focus:ring-2 sm:text-sm`}
                  placeholder="Repita a nova senha"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer" onClick={() => setShowConfirmarSenha(!showConfirmarSenha)}>
                  {showConfirmarSenha ? (
                    <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                  )}
                </div>
              </div>
              {errors.confirmarNovaSenha && <p className="mt-1 text-sm text-red-600">{errors.confirmarNovaSenha}</p>}
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
                  'Redefinir senha'
                )}
              </button>
            </div>
            
            <div className="mt-4 text-center">
              <Link href="/login" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Voltar para o login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
