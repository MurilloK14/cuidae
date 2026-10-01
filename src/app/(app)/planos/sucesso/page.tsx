'use client'

import { CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function SucessoPage() {
  const searchParams = useSearchParams()
  const plano = searchParams.get('plano')
  const planoNome = plano === 'premium' ? 'Premium' : plano === 'intermediaria' ? 'Intermediário' : plano === 'avulsa' ? 'Teleconsulta' : 'Plano'

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center animate-fade-in-up">
      <div className="mb-6 flex justify-center">
        <div className="bg-emerald-50 w-24 h-24 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        </div>
      </div>
      <h1 className="text-3xl font-bold text-[#091426] mb-4">Parabéns!</h1>
      <p className="text-lg text-slate-600 mb-8">
        Seu plano <strong>{planoNome}</strong> foi ativado com sucesso.
      </p>
      
      <Link 
        href="/dashboard"
        className="block w-full py-4 bg-[#091426] hover:bg-[#1a2c4e] text-white font-medium rounded-full transition-colors"
      >
        Ir para o Dashboard
      </Link>
    </div>
  )
}
