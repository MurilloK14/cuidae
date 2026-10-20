'use client'

import React, { Suspense } from 'react'
import { CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

function SucessoContent() {
  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center animate-fade-in-up font-jakarta">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 shadow-xs">
        <div className="mb-6 flex justify-center">
          <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800 w-20 h-20 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs">
            <CheckCircle2 className="w-10 h-10" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#091426] dark:text-white tracking-tight mb-2">
          Acesso Gratuito Ativo!
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
          Sua conta no <strong>Cuidaê SUS</strong> está 100% configurada. Todos os serviços de saúde, IA e vacinas são livres de custos.
        </p>
        
        <Link 
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-[#2b85ff] hover:bg-blue-600 text-white font-semibold text-sm rounded-xl transition-all shadow-xs"
        >
          <span>Ir para o Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}

export default function SucessoPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto py-24 text-center">
          <div className="h-8 w-8 border-2 border-[#2b85ff] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      }
    >
      <SucessoContent />
    </Suspense>
  )
}
