'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  User,
  Settings,
  Bell,
  Moon,
  Sun,
  Shield,
  Phone,
  Mail,
  HeartPulse,
  Save,
  CheckCircle2,
  AlertCircle,
  Laptop,
  ArrowLeft,
  Key,
  LogOut
} from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import { signOut } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/client'
import { ESTADOS_BRASILEIROS, formatPhone } from '@/lib/constants'

export default function ConfiguracoesPage() {
  const { theme, setTheme } = useTheme()

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [cidade, setCidade] = useState('')
  const [uf, setUf] = useState('PE')

  // Dados de Saúde / Emergência
  const [tipoSanguineo, setTipoSanguineo] = useState('O+')
  const [alergias, setAlergias] = useState('')
  const [contatoEmergenciaNome, setContatoEmergenciaNome] = useState('')
  const [contatoEmergenciaTelefone, setContatoEmergenciaTelefone] = useState('')

  // Notificações
  const [notifWhatsapp, setNotifWhatsapp] = useState(true)
  const [notifEmail, setNotifEmail] = useState(true)
  const [notifTriagem, setNotifTriagem] = useState(true)

  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    const carregarPerfil = async () => {
      try {
        setLoading(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          setEmail(user.email || '')
          setNome(user.user_metadata?.full_name || user.user_metadata?.name || '')

          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          if (profile) {
            setNome(profile.nome_completo || '')
            setTelefone(profile.telefone || '')
            setDataNascimento(profile.data_nascimento || '')
            setCidade(profile.cidade || '')
            setUf(profile.uf || 'PE')
          }
        }

        // Carrega dados locais de saúde/notificações
        const saudeSalva = localStorage.getItem('cuidae_user_health')
        if (saudeSalva) {
          const s = JSON.parse(saudeSalva)
          if (s.tipoSanguineo) setTipoSanguineo(s.tipoSanguineo)
          if (s.alergias) setAlergias(s.alergias)
          if (s.contatoEmergenciaNome) setContatoEmergenciaNome(s.contatoEmergenciaNome)
          if (s.contatoEmergenciaTelefone) setContatoEmergenciaTelefone(s.contatoEmergenciaTelefone)
          if (s.notifWhatsapp !== undefined) setNotifWhatsapp(s.notifWhatsapp)
          if (s.notifEmail !== undefined) setNotifEmail(s.notifEmail)
          if (s.notifTriagem !== undefined) setNotifTriagem(s.notifTriagem)
        }
      } catch (err: any) {
        console.error('Erro ao carregar perfil:', err)
      } finally {
        setLoading(false)
      }
    }

    carregarPerfil()
  }, [])

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvando(true)
    setErro('')
    setSucesso(false)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        await supabase.from('profiles').upsert({
          id: user.id,
          nome_completo: nome,
          telefone,
          data_nascimento: dataNascimento || null,
          cidade,
          uf,
        })
      }

      // Salva preferências de emergência e notificações
      localStorage.setItem(
        'cuidae_user_health',
        JSON.stringify({
          tipoSanguineo,
          alergias,
          contatoEmergenciaNome,
          contatoEmergenciaTelefone,
          notifWhatsapp,
          notifEmail,
          notifTriagem,
        })
      )

      setSucesso(true)
      setTimeout(() => setSucesso(false), 4000)
    } catch (err: any) {
      setErro(err.message || 'Erro ao salvar alterações.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-fade-in font-['Inter']">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl shadow-xs transition-colors duration-200">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/20 text-[#2b85ff] dark:text-blue-400 flex items-center justify-center">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Configurações da Conta
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Personalize seu perfil, ficha de saúde, tema escuro e notificações
            </p>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao Dashboard</span>
        </Link>
      </div>

      {/* Alerta de Feedback */}
      {sucesso && (
        <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 p-4 rounded-2xl flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="font-semibold">Configurações salvas com sucesso!</span>
        </div>
      )}

      {erro && (
        <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 p-4 rounded-2xl flex items-center gap-3 text-red-800 dark:text-red-300 text-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400" />
          <span>{erro}</span>
        </div>
      )}

      <form onSubmit={handleSalvar} className="space-y-6">
        {/* SEÇÃO 1: APARÊNCIA & TEMA ESCURO */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 rounded-3xl shadow-xs transition-colors duration-200 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Moon className="w-5 h-5 text-indigo-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Aparência do Aplicativo (Modo Escuro)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition text-center cursor-pointer ${
                theme === 'light'
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Sun className="w-6 h-6 text-amber-500" />
              <span className="text-xs font-bold">Modo Claro</span>
              <span className="text-[11px] text-slate-400">Interface clássica iluminada</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition text-center cursor-pointer ${
                theme === 'dark'
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Moon className="w-6 h-6 text-indigo-400" />
              <span className="text-xs font-bold">Modo Escuro</span>
              <span className="text-[11px] text-slate-400">Conforto visual noturno</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('system')}
              className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition text-center cursor-pointer ${
                theme === 'system'
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Laptop className="w-6 h-6 text-slate-500" />
              <span className="text-xs font-bold">Padrão do Sistema</span>
              <span className="text-[11px] text-slate-400">Segue seu dispositivo</span>
            </button>
          </div>
        </div>

        {/* SEÇÃO 2: DADOS PESSOAIS */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 rounded-3xl shadow-xs transition-colors duration-200 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <User className="w-5 h-5 text-blue-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Dados do Paciente
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nome Completo
              </label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2b85ff]"
                placeholder="Seu nome completo"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                E-mail (Login)
              </label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(formatPhone(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2b85ff]"
                placeholder="(87) 99999-9999"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Data de Nascimento
              </label>
              <input
                type="date"
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2b85ff]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Cidade
              </label>
              <input
                type="text"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2b85ff]"
                placeholder="Ex: Garanhuns"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Estado (UF)
              </label>
              <select
                value={uf}
                onChange={(e) => setUf(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2b85ff]"
              >
                {ESTADOS_BRASILEIROS.map((est) => (
                  <option key={est.sigla} value={est.sigla}>
                    {est.nome} ({est.sigla})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SEÇÃO 3: FICHA DE EMERGÊNCIA & SAÚDE */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 rounded-3xl shadow-xs transition-colors duration-200 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <HeartPulse className="w-5 h-5 text-red-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Ficha Médica & Contato de Emergência
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tipo Sanguíneo
              </label>
              <select
                value={tipoSanguineo}
                onChange={(e) => setTipoSanguineo(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2b85ff]"
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="Não sei">Não sei informar</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Alergias a Medicamentos (ex: Dipirona, Penicilina)
              </label>
              <input
                type="text"
                value={alergias}
                onChange={(e) => setAlergias(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2b85ff]"
                placeholder="Nenhuma alergia conhecida"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nome do Contato de Emergência
              </label>
              <input
                type="text"
                value={contatoEmergenciaNome}
                onChange={(e) => setContatoEmergenciaNome(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2b85ff]"
                placeholder="Ex: Maria (Mãe / Cônjuge)"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Telefone de Emergência
              </label>
              <input
                type="text"
                value={contatoEmergenciaTelefone}
                onChange={(e) => setContatoEmergenciaTelefone(formatPhone(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2b85ff]"
                placeholder="(87) 98888-8888"
              />
            </div>
          </div>
        </div>

        {/* SEÇÃO 4: PREFERÊNCIAS DE NOTIFICAÇÕES */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 rounded-3xl shadow-xs transition-colors duration-200 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Bell className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Notificações e Avisos
            </h2>
          </div>

          <div className="space-y-3.5">
            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer">
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  Lembrete de Agendamento por WhatsApp
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Receba o protocolo e lembrete 2h antes da consulta hospitalar
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifWhatsapp}
                onChange={(e) => setNotifWhatsapp(e.target.checked)}
                className="w-5 h-5 rounded text-[#2b85ff] focus:ring-[#2b85ff] accent-[#2b85ff]"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer">
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  Avisos de Triagem e IA por E-mail
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Cópia do relatório clínico detalhado em PDF e confirmação de encaminhamento
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifEmail}
                onChange={(e) => setNotifEmail(e.target.checked)}
                className="w-5 h-5 rounded text-[#2b85ff] focus:ring-[#2b85ff] accent-[#2b85ff]"
              />
            </label>
          </div>
        </div>

        {/* BOTÃO SALVAR */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={salvando}
            className="px-7 py-3 rounded-2xl bg-[#091426] dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white font-bold text-sm flex items-center gap-2 transition shadow-md disabled:opacity-60 cursor-pointer"
          >
            {salvando ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salvar Configurações</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
