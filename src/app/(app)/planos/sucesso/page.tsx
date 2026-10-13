'use client'

import { Suspense } from 'react'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function SucessoContent() {
  const searchParams = useSearchParams()
  const plano = searchParams.get('plano')
  const planoNome = plano === 'premium' ? 'Premium' : plano === 'intermediaria' ? 'Intermediário' : plano === 'avulsa' ? 'Teleconsulta' : 'Plano'

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center animate-fade-in-up font-jakarta">
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs">
        <div className="mb-6 flex justify-center">
          <div className="bg-emerald-50 border border-emerald-100 w-20 h-20 rounded-full flex items-center justify-center text-emerald-600 shadow-xs">
            <CheckCircle2 className="w-10 h-10" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#091426] tracking-tight mb-2">Assinatura Ativada!</h1>
        <p className="text-sm text-slate-600 mb-8 leading-relaxed">
          Seu plano <strong>{planoNome}</strong> está pronto para uso com todos os recursos liberados.
        </p>
        
        <Link 
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-[#091426] hover:bg-[#1a2c4e] text-white font-semibold text-sm rounded-full transition-all shadow-xs hover:shadow hover:-translate-y-0.5"
        >
          <span>Ir para o Dashboard</span>
          <ArrowRight className="w-4 h-4 text-[#2b85ff]" />
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
