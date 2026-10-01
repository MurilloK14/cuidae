'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User, Mail, Lock, Phone, MapPin, Calendar, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { signUp } from '@/lib/auth/actions';

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
        // Redirect to login or show success message
        window.location.href = '/login?cadastro=sucesso';
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
    <div className="sm:mx-auto sm:w-full sm:max-w-xl animate-fade-in-up py-8">
      <div className="flex justify-center mb-8">
        <Image src="/images/cuidae-logo-trimmed.png" alt="SaúdeIA Logo" width={144} height={40} className="h-10 w-36 object-contain" />
      </div>
      
      <div className="bg-white py-8 px-4 shadow-xl sm:rounded-3xl border border-slate-100 sm:px-10">
        <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 mb-6">
          Crie sua conta
        </h2>
        
        {errors.form && (
          <div className="mb-6 bg-red-50 p-3 rounded-lg text-red-600 text-sm border border-red-100">
            {errors.form}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-900 border-b border-slate-100 pb-2">Informações Pessoais</h3>
            
            <div>
              <label htmlFor="nome_completo" className="block text-sm font-medium text-slate-700">Nome completo</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="nome_completo"
                  name="nome_completo"
                  type="text"
                  required
                  value={formData.nome_completo}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-3 rounded-xl border ${errors.nome_completo ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 focus:ring-[#2b85ff] focus:border-[#2b85ff]'} focus:outline-none focus:ring-2 sm:text-sm`}
                  placeholder="Seu nome completo"
                />
              </div>
              {errors.nome_completo && <p className="mt-1 text-sm text-red-600">{errors.nome_completo}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-3 rounded-xl border ${errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 focus:ring-[#2b85ff] focus:border-[#2b85ff]'} focus:outline-none focus:ring-2 sm:text-sm`}
                  placeholder="seu@email.com"
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="telefone" className="block text-sm font-medium text-slate-700">Telefone</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="telefone"
                    name="telefone"
                    type="tel"
                    required
                    value={formData.telefone}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-3 rounded-xl border ${errors.telefone ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 focus:ring-[#2b85ff] focus:border-[#2b85ff]'} focus:outline-none focus:ring-2 sm:text-sm`}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                {errors.telefone && <p className="mt-1 text-sm text-red-600">{errors.telefone}</p>}
              </div>

              <div>
                <label htmlFor="data_nascimento" className="block text-sm font-medium text-slate-700">Data de nascimento</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="data_nascimento"
                    name="data_nascimento"
                    type="date"
                    required
                    value={formData.data_nascimento}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-3 rounded-xl border ${errors.data_nascimento ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 focus:ring-[#2b85ff] focus:border-[#2b85ff]'} focus:outline-none focus:ring-2 sm:text-sm`}
                  />
                </div>
                {errors.data_nascimento && <p className="mt-1 text-sm text-red-600">{errors.data_nascimento}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
              <div>
                <label htmlFor="cidade" className="block text-sm font-medium text-slate-700">Cidade</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="cidade"
                    name="cidade"
                    type="text"
                    required
                    value={formData.cidade}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-3 rounded-xl border ${errors.cidade ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 focus:ring-[#2b85ff] focus:border-[#2b85ff]'} focus:outline-none focus:ring-2 sm:text-sm`}
                    placeholder="Sua cidade"
                  />
                </div>
                {errors.cidade && <p className="mt-1 text-sm text-red-600">{errors.cidade}</p>}
              </div>

              <div>
                <label htmlFor="uf" className="block text-sm font-medium text-slate-700">Estado (UF)</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <select
                    id="uf"
                    name="uf"
                    required
                    value={formData.uf}
                    onChange={handleChange}
                    className={`block w-full pl-3 pr-10 py-3 rounded-xl border ${errors.uf ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 focus:ring-[#2b85ff] focus:border-[#2b85ff]'} focus:outline-none focus:ring-2 sm:text-sm appearance-none bg-white`}
                  >
                    <option value="" disabled>Selecione</option>
                    {STATES.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  </div>
                </div>
                {errors.uf && <p className="mt-1 text-sm text-red-600">{errors.uf}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-medium text-slate-900 border-b border-slate-100 pb-2">Segurança</h3>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="senha" className="block text-sm font-medium text-slate-700">Senha</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="senha"
                    name="senha"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.senha}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-10 py-3 rounded-xl border ${errors.senha ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 focus:ring-[#2b85ff] focus:border-[#2b85ff]'} focus:outline-none focus:ring-2 sm:text-sm`}
                    placeholder="••••••••"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" /> : <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600" />}
                  </div>
                </div>
                {errors.senha && <p className="mt-1 text-sm text-red-600">{errors.senha}</p>}
              </div>

              <div>
                <label htmlFor="confirmar_senha" className="block text-sm font-medium text-slate-700">Confirmar Senha</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="confirmar_senha"
                    name="confirmar_senha"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmar_senha}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-10 py-3 rounded-xl border ${errors.confirmar_senha ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 focus:ring-[#2b85ff] focus:border-[#2b85ff]'} focus:outline-none focus:ring-2 sm:text-sm`}
                    placeholder="••••••••"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" /> : <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600" />}
                  </div>
                </div>
                {errors.confirmar_senha && <p className="mt-1 text-sm text-red-600">{errors.confirmar_senha}</p>}
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
                  className="h-4 w-4 text-[#2b85ff] focus:ring-[#2b85ff] border-slate-300 rounded cursor-pointer"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="aceite_termos" className="font-medium text-slate-700 cursor-pointer">
                  Eu concordo com os <Link href="/termos" className="text-[#2b85ff] hover:underline">Termos de Uso</Link> e <Link href="/privacidade" className="text-[#2b85ff] hover:underline">Política de Privacidade</Link>.
                </label>
                {errors.aceite_termos && <p className="mt-1 text-sm text-red-600">{errors.aceite_termos}</p>}
              </div>
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
                'Criar conta'
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600">
            Já tem conta?{' '}
            <Link href="/login" className="font-medium text-[#2b85ff] hover:underline">
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
