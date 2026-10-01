'use client'

import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import Link from 'next/link'
import { getUserCamada } from '@/lib/planos/actions'

export default function PlanosPage() {
  const [currentCamada, setCurrentCamada] = useState<string>('gratuito')

  useEffect(() => {
    async function load() {
      const camada = await getUserCamada()
      if (camada) setCurrentCamada(camada)
    }
    load()
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in-up">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#091426] mb-4">Planos e Preços</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Escolha o plano ideal para cuidar da sua saúde com a tecnologia da SaúdeIA.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {/* Gratuito */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col">
          <h2 className="text-2xl font-bold text-[#091426] mb-2">Gratuito</h2>
          <div className="text-3xl font-bold text-slate-900 mb-6">Grátis</div>
          <ul className="space-y-4 mb-8 flex-1">
            {['Triagens ilimitadas', 'Histórico básico', 'Lembretes'].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-slate-700">
                <Check className="w-5 h-5 text-[#2b85ff] flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          {currentCamada === 'gratuito' ? (
            <button disabled className="w-full py-4 rounded-full border border-slate-200 text-slate-500 font-medium cursor-not-allowed">
              Plano atual
            </button>
          ) : (
            <button className="w-full py-4 rounded-full bg-[#eef5ff] text-[#2b85ff] font-medium hover:bg-blue-100 transition-colors">
              Selecionar
            </button>
          )}
        </div>

        {/* Intermediário */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col">
          <h2 className="text-2xl font-bold text-[#091426] mb-2">Intermediário</h2>
          <div className="text-3xl font-bold text-slate-900 mb-6">Pague por consulta</div>
          <ul className="space-y-4 mb-8 flex-1">
            {['Tudo do plano Gratuito', 'Teleconsulta avulsa (R$ 39,90/consulta)', 'Análise de foto com IA'].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-slate-700">
                <Check className="w-5 h-5 text-[#2b85ff] flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          {currentCamada === 'intermediaria' ? (
            <button disabled className="w-full py-4 rounded-full border border-slate-200 text-slate-500 font-medium cursor-not-allowed">
              Plano atual
            </button>
          ) : (
             <Link href="/planos/checkout?plano=intermediaria" className="block w-full py-4 rounded-full bg-[#eef5ff] text-[#2b85ff] text-center font-medium hover:bg-blue-100 transition-colors">
              Selecionar
            </Link>
          )}
        </div>

        {/* Premium */}
        <div className="bg-white rounded-3xl p-8 border-2 border-[#2b85ff] shadow-md flex flex-col relative">
          <div className="absolute top-0 right-6 -translate-y-1/2 bg-[#2b85ff] text-white text-sm font-bold px-3 py-1 rounded-full">
            Mais popular
          </div>
          <h2 className="text-2xl font-bold text-[#091426] mb-2">Premium</h2>
          <div className="text-3xl font-bold text-slate-900 mb-6">R$ 79,90<span className="text-lg text-slate-500 font-normal">/mês</span></div>
          <ul className="space-y-4 mb-8 flex-1">
            {['Tudo do plano Intermediário', 'Consultas ilimitadas', 'Vínculo com clínica parceira', 'Prioridade no atendimento'].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-slate-700">
                <Check className="w-5 h-5 text-[#2b85ff] flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          {currentCamada === 'premium' ? (
            <button disabled className="w-full py-4 rounded-full border border-slate-200 text-slate-500 font-medium cursor-not-allowed">
              Plano atual
            </button>
          ) : (
            <Link href="/planos/checkout?plano=premium" className="block w-full py-4 rounded-full bg-[#091426] text-white text-center font-medium hover:bg-[#1a2c4e] transition-colors">
              Selecionar
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
