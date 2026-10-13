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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in-up font-jakarta">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#091426] tracking-tight mb-3">Planos e Preços</h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
          Escolha o plano ideal para cuidar da sua saúde com a tecnologia e acolhimento do Cuidaê.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {/* Gratuito */}
        <div className="bg-white rounded-2xl p-7 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <h2 className="text-xl font-bold text-[#091426] mb-1">Gratuito</h2>
            <p className="text-xs text-slate-500 mb-6">Acesso essencial para todos os cidadãos</p>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight mb-6 tabular-nums">Grátis</div>
            <ul className="space-y-3.5 mb-8">
              {['Triagens ilimitadas com IA', 'Mapeamento de UBS e UPA locais', 'Histórico básico de saúde', 'Lembretes preventivos'].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <Check className="w-4 h-4 text-[#2b85ff] shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          {currentCamada === 'gratuito' ? (
            <button disabled className="w-full py-3.5 rounded-full border border-slate-200 text-slate-400 font-semibold text-sm cursor-not-allowed bg-slate-50">
              Plano atual
            </button>
          ) : (
            <button className="w-full py-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm transition-colors">
              Selecionar
            </button>
          )}
        </div>

        {/* Intermediário */}
        <div className="bg-white rounded-2xl p-7 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <h2 className="text-xl font-bold text-[#091426] mb-1">Intermediário</h2>
            <p className="text-xs text-slate-500 mb-6">Flexibilidade para quando precisar de médico</p>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight mb-6 tabular-nums">Pague por consulta</div>
            <ul className="space-y-3.5 mb-8">
              {['Tudo do plano Gratuito', 'Teleconsulta avulsa (R$ 39,90/consulta)', 'Análise fotográfica com IA clínica', 'Encaminhamento prioritário'].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <Check className="w-4 h-4 text-[#2b85ff] shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          {currentCamada === 'intermediaria' ? (
            <button disabled className="w-full py-3.5 rounded-full border border-slate-200 text-slate-400 font-semibold text-sm cursor-not-allowed bg-slate-50">
              Plano atual
            </button>
          ) : (
             <Link href="/planos/checkout?plano=intermediaria" className="block w-full py-3.5 rounded-full bg-blue-50 text-[#2b85ff] text-center font-semibold text-sm hover:bg-blue-100 transition-colors">
              Selecionar
            </Link>
          )}
        </div>

        {/* Premium */}
        <div className="bg-white rounded-2xl p-7 sm:p-8 border-2 border-[#2b85ff] shadow-md flex flex-col justify-between relative hover:shadow-lg transition-all">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xl font-bold text-[#091426]">Premium</h2>
              <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#2b85ff] text-white">
                Mais popular
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-6">Acompanhamento contínuo e telemedicina completa</p>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight mb-6 tabular-nums">
              R$ 79,90<span className="text-sm text-slate-500 font-normal">/mês</span>
            </div>
            <ul className="space-y-3.5 mb-8">
              {['Tudo do plano Intermediário', 'Teleconsultas médicas ilimitadas', 'Vínculo com clínica parceira', 'Atendimento prioritário na fila', 'Acompanhamento contínuo com lembretes'].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <Check className="w-4 h-4 text-[#2b85ff] shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          {currentCamada === 'premium' ? (
            <button disabled className="w-full py-3.5 rounded-full border border-slate-200 text-slate-400 font-semibold text-sm cursor-not-allowed bg-slate-50">
              Plano atual
            </button>
          ) : (
            <Link href="/planos/checkout?plano=premium" className="block w-full py-3.5 rounded-full bg-[#091426] hover:bg-[#1a2c4e] text-white text-center font-semibold text-sm transition-colors shadow-xs">
              Selecionar Plano Premium
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
