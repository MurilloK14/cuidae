'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, ArrowRight, HeartPulse } from 'lucide-react'
import Link from 'next/link'

export default function CheckoutPage() {
  const router = useRouter()

  useEffect(() => {
    // Redireciona suavemente após alguns segundos, garantindo que o usuário saiba que é gratuito
    const timer = setTimeout(() => {
      router.push('/dashboard')
    }, 4000)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="max-w-2xl mx-auto py-16 px-4 text-center font-jakarta animate-fade-in">
      <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto mb-6">
        <ShieldCheck className="w-8 h-8" />
      </div>

      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mb-3">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        Sistema 100% Gratuito
      </span>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#091426] dark:text-white mb-3">
        Nenhum Pagamento é Necessário
      </h1>

      <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed mb-8 max-w-lg mx-auto">
        O Cuidaê é uma plataforma pública de apoio ao SUS. Todas as funcionalidades de triagem clínica, inteligência artificial e agendamento são totalmente gratuitas.
      </p>

      <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 mb-8 text-left space-y-2">
        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <HeartPulse className="w-4 h-4 text-[#2b85ff]" />
          Seu acesso gratuito está ativo
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Você será redirecionado automaticamente para o seu painel em instantes.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/dashboard"
          className="w-full sm:w-auto px-6 py-3 bg-[#2b85ff] hover:bg-blue-600 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2"
        >
          Ir para o Dashboard
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/triagem"
          className="w-full sm:w-auto px-6 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm rounded-xl border border-slate-200 dark:border-slate-700 transition"
        >
          Iniciar Triagem
        </Link>
      </div>
    </div>
  )
}
