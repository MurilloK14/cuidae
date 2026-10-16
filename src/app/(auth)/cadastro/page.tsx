'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User, Mail, Lock, Phone, MapPin, Calendar, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { signUp } from '@/lib/auth/actions';
import { GoogleButton } from '@/components/GoogleButton';
import { ThemeToggle } from '@/components/ThemeToggle';

const STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function CadastroPage() {
  const [formData, setFormData] = useState({
    nome_completo: '',
    email: '',
    senha: '',
    confirmar_senha: '',
    telefone: '',
    data_nascimento: '',
    cidade: '',
    uf: '',
    aceite_termos: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const formatPhone = (value: string) => {
    const v = value.replace(/\D/g, '').slice(0, 11);
    if (v.length >= 11) {
      return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
    } else if (v.length >= 7) {
      return `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6)}`;
    } else if (v.length >= 3) {
      return `(${v.slice(0, 2)}) ${v.slice(2)}`;
    } else if (v.length > 0) {
      return `(${v}`;
    }
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'telefone') {
      setFormData(prev => ({ ...prev, [name]: formatPhone(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (formData.nome_completo.length < 3) newErrors.nome_completo = 'Nome deve ter no mínimo 3 caracteres.';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) newErrors.email = 'Email inválido.';
    
    if (formData.senha.length < 8) newErrors.senha = 'A senha deve ter pelo menos 8 caracteres.';
    else if (!/[A-Z]/.test(formData.senha)) newErrors.senha = 'A senha deve ter pelo menos 1 letra maiúscula.';
    else if (!/[0-9]/.test(formData.senha)) newErrors.senha = 'A senha deve ter pelo menos 1 número.';
    
    if (formData.senha !== formData.confirmar_senha) newErrors.confirmar_senha = 'As senhas não coincidem.';
    
    if (formData.telefone.replace(/\D/g, '').length < 10) newErrors.telefone = 'Telefone inválido.';
    
    if (!formData.data_nascimento) {
      newErrors.data_nascimento = 'Data de nascimento é obrigatória.';
    } else {
      const birthDate = new Date(formData.data_nascimento);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
      
      if (birthDate > today) newErrors.data_nascimento = 'Data não pode ser no futuro.';
      else if (age < 13) newErrors.data_nascimento = 'Você deve ter pelo menos 13 anos.';
    }
    
    if (!formData.cidade.trim()) newErrors.cidade = 'Cidade é obrigatória.';
    if (!formData.uf) newErrors.uf = 'Estado (UF) é obrigatório.';
    if (!formData.aceite_termos) newErrors.aceite_termos = 'Você deve aceitar os termos de uso.';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }
    
    setIsLoading(true);
    setErrors({});
    
    try {
      const fd = new FormData();
      fd.append('email', formData.email);
      fd.append('password', formData.senha);
      fd.append('nome_completo', formData.nome_completo);
      fd.append('telefone', formData.telefone);
      fd.append('data_nascimento', formData.data_nascimento);
      fd.append('cidade', formData.cidade);
      fd.append('uf', formData.uf);
      
      const result = await signUp(fd);
      if (result.success) {
        // Redireciona diretamente para o dashboard com sessão ativa
        window.location.href = '/dashboard';
      } else if (result.error) {
        setErrors({ form: result.error });
      }
    } catch (err: any) {
      setErrors({ form: err.message || 'Ocorreu um erro ao criar a conta.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="sm:mx-auto sm:w-full sm:max-w-xl animate-fade-in-up font-jakarta py-6 px-4">
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
      
      <div className="relative bg-white/95 dark:bg-[#0c1322]/95 backdrop-blur-xl py-8 px-5 sm:px-10 shadow-2xl shadow-slate-200/50 dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] sm:rounded-3xl border border-slate-200/90 dark:border-slate-800/90 transition-colors duration-200 overflow-hidden">
        {/* Specular highlight rim */}
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 dark:via-blue-400/40 to-transparent pointer-events-none" />

        <h2 className="text-center text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
          Crie sua conta
        </h2>
        <p className="text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6">
          Cadastre-se para acessar triagens inteligentes e histórico completo
        </p>
        
        {errors.form && (
          <div className="mb-6 bg-red-500/10 dark:bg-red-950/40 p-3.5 rounded-2xl text-red-600 dark:text-red-400 text-xs sm:text-sm border border-red-200 dark:border-red-900/60 font-medium">
            {errors.form}
          </div>
        )}

        {/* Google Signup */}
        <div className="mb-6">
          <GoogleButton label="Cadastrar com o Google" />
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-[#0c1322] px-3 text-slate-400 dark:text-slate-500 font-semibold tracking-wider text-[11px]">
              ou preencha com seus dados
            </span>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800/80 pb-2">Informações Pessoais</h3>
            
            <div>
              <label htmlFor="nome_completo" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Nome completo</label>
              <div className="relative rounded-2xl group transition-all">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="nome_completo"
                  name="nome_completo"
                  type="text"
                  required
                  value={formData.nome_completo}
                  onChange={handleChange}
                  className={`block w-full h-12 pl-10 pr-3.5 rounded-2xl border ${errors.nome_completo ? 'border-red-400 dark:border-red-800' : 'border-slate-200 dark:border-slate-800'} bg-slate-50/70 dark:bg-slate-900/80 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-sm font-medium transition-all`}
                  placeholder="Seu nome completo"
                />
              </div>
              {errors.nome_completo && <p className="mt-1 text-xs text-red-500">{errors.nome_completo}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Email</label>
              <div className="relative rounded-2xl group transition-all">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`block w-full h-12 pl-10 pr-3.5 rounded-2xl border ${errors.email ? 'border-red-400 dark:border-red-800' : 'border-slate-200 dark:border-slate-800'} bg-slate-50/70 dark:bg-slate-900/80 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-sm font-medium transition-all`}
                  placeholder="seu@email.com"
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="telefone" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Telefone</label>
                <div className="relative rounded-2xl group transition-all">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    id="telefone"
                    name="telefone"
                    type="tel"
                    required
                    value={formData.telefone}
                    onChange={handleChange}
                    className={`block w-full h-12 pl-10 pr-3.5 rounded-2xl border ${errors.telefone ? 'border-red-400 dark:border-red-800' : 'border-slate-200 dark:border-slate-800'} bg-slate-50/70 dark:bg-slate-900/80 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-sm font-medium transition-all`}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                {errors.telefone && <p className="mt-1 text-xs text-red-500">{errors.telefone}</p>}
              </div>

              <div>
                <label htmlFor="data_nascimento" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Data de nascimento</label>
                <div className="relative rounded-2xl group transition-all">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <input
                    id="data_nascimento"
                    name="data_nascimento"
                    type="date"
                    required
                    value={formData.data_nascimento}
                    onChange={handleChange}
                    className={`block w-full h-12 pl-10 pr-3.5 rounded-2xl border ${errors.data_nascimento ? 'border-red-400 dark:border-red-800' : 'border-slate-200 dark:border-slate-800'} bg-slate-50/70 dark:bg-slate-900/80 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-sm font-medium transition-all`}
                  />
                </div>
                {errors.data_nascimento && <p className="mt-1 text-xs text-red-500">{errors.data_nascimento}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
              <div>
                <label htmlFor="cidade" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Cidade</label>
                <div className="relative rounded-2xl group transition-all">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <input
                    id="cidade"
                    name="cidade"
                    type="text"
                    required
                    value={formData.cidade}
                    onChange={handleChange}
                    className={`block w-full h-12 pl-10 pr-3.5 rounded-2xl border ${errors.cidade ? 'border-red-400 dark:border-red-800' : 'border-slate-200 dark:border-slate-800'} bg-slate-50/70 dark:bg-slate-900/80 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-sm font-medium transition-all`}
                    placeholder="Sua cidade"
                  />
                </div>
                {errors.cidade && <p className="mt-1 text-xs text-red-500">{errors.cidade}</p>}
              </div>

              <div>
                <label htmlFor="uf" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Estado (UF)</label>
                <div className="relative rounded-2xl group transition-all">
                  <select
                    id="uf"
                    name="uf"
                    required
                    value={formData.uf}
                    onChange={handleChange}
                    className={`block w-full h-12 pl-3.5 pr-10 rounded-2xl border ${errors.uf ? 'border-red-400 dark:border-red-800' : 'border-slate-200 dark:border-slate-800'} bg-slate-50/70 dark:bg-slate-900/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-sm font-medium appearance-none transition-all cursor-pointer`}
                  >
                    <option value="" disabled>UF</option>
                    {STATES.map(state => (
                      <option key={state} value={state} className="dark:bg-slate-900 dark:text-white">{state}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
                {errors.uf && <p className="mt-1 text-xs text-red-500">{errors.uf}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800/80 pb-2">Segurança</h3>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="senha" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Senha</label>
                <div className="relative rounded-2xl group transition-all">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="senha"
                    name="senha"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.senha}
                    onChange={handleChange}
                    className={`block w-full h-12 pl-10 pr-11 rounded-2xl border ${errors.senha ? 'border-red-400 dark:border-red-800' : 'border-slate-200 dark:border-slate-800'} bg-slate-50/70 dark:bg-slate-900/80 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-sm font-medium transition-all`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.senha && <p className="mt-1 text-xs text-red-500">{errors.senha}</p>}
              </div>

              <div>
                <label htmlFor="confirmar_senha" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Confirmar Senha</label>
                <div className="relative rounded-2xl group transition-all">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="confirmar_senha"
                    name="confirmar_senha"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmar_senha}
                    onChange={handleChange}
                    className={`block w-full h-12 pl-10 pr-11 rounded-2xl border ${errors.confirmar_senha ? 'border-red-400 dark:border-red-800' : 'border-slate-200 dark:border-slate-800'} bg-slate-50/70 dark:bg-slate-900/80 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-sm font-medium transition-all`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    aria-label={showConfirmPassword ? 'Ocultar confirmação de senha' : 'Exibir confirmação de senha'}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmar_senha && <p className="mt-1 text-xs text-red-500">{errors.confirmar_senha}</p>}
              </div>
            </div>
          </div>

          <div className="pt-2">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="aceite_termos"
                  name="aceite_termos"
                  type="checkbox"
                  checked={formData.aceite_termos}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 rounded cursor-pointer"
                />
              </div>
              <div className="ml-3 text-xs sm:text-sm">
                <label htmlFor="aceite_termos" className="font-medium text-slate-600 dark:text-slate-400 cursor-pointer">
                  Eu concordo com os <Link href="/termos" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">Termos de Uso</Link> e <Link href="/privacidade" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">Política de Privacidade</Link>.
                </label>
                {errors.aceite_termos && <p className="mt-1 text-xs text-red-500">{errors.aceite_termos}</p>}
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 flex justify-center items-center gap-2 rounded-2xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 shadow-lg shadow-blue-600/25 hover:shadow-blue-600/35 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Criar conta'
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center pt-5 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Já tem conta?{' '}
            <Link href="/login" className="font-bold text-blue-600 dark:text-blue-400 hover:underline transition-colors">
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
