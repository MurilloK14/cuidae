'use client'

import React from 'react'
import { ShieldCheck, HeartPulse, Check, Sparkles, ArrowRight, Syringe, Building2, FileText, QrCode } from 'lucide-react'
import Link from 'next/link'

export default function PlanosPage() {
  const recursosGratuitos = [
    {
      titulo: 'Triagem Inteligente com IA Clínica',
      desc: 'Avaliação de sintomas em tempo real com apoio dos motores Infermedica e Google Gemini.',
      icon: Sparkles,
    },
    {
      titulo: 'Protocolo de Manchester SUS',
      desc: 'Classificação oficial de risco (Emergência, Urgente, Eletivo) com tempo recomendado de espera.',
      icon: HeartPulse,
    },
    {
      titulo: 'Caderneta Digital de Vacinação',
      desc: 'Escaneamento por foto e PDF do Meu SUS Digital e cartões físicos de papel com IA.',
      icon: Syringe,
    },
    {
      titulo: 'Ficha de Encaminhamento Clínico em PDF',
      desc: 'Comprovante com QR Code dinâmico para leitura e validação instantânea na recepção da UBS/Hospital.',
      icon: QrCode,
    },
    {
      titulo: 'Mapeamento Georreferenciado de Unidades',
      desc: 'Localização em tempo real de UBS, USF, UPA 24h e hospitais de referência com rotas.',
      icon: Building2,
    },
    {
      titulo: 'Agendamento Direto na Recepção Hospitalar',
      desc: 'Transmissão eletrônica de prontuário preliminar para redução de filas e acolhimento ágil.',
      icon: FileText,
    },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in-up font-jakarta">
      {/* Cabeçalho de Destaque SUS Gratuito */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mb-4">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Sistema Único de Saúde • 100% Gratuito
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#091426] dark:text-white tracking-tight mb-4">
          Acesso Público, Universal e Sem Custos
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          O Cuidaê foi concebido com uma premissa fundamental: <strong>a saúde pública deve ser acessível a todos os cidadãos</strong>. Não existem planos pagos, mensalidades ou cobranças por consulta.
        </p>
      </div>

      {/* Card Principal - Tudo Liberado */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-8 sm:p-10 shadow-sm mb-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-300">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-[#091426] dark:text-white">
                Plano Cidadão SUS
              </h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Todas as ferramentas clínicas e inteligência artificial disponíveis ilimitadamente.
            </p>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-6 py-3 rounded-2xl text-center">
            <span className="text-xs uppercase font-extrabold text-emerald-700 dark:text-emerald-300 block tracking-wider">Custo</span>
            <span className="text-3xl font-extrabold text-emerald-800 dark:text-emerald-200">R$ 0,00</span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block font-medium">Sempre Gratuito</span>
          </div>
        </div>

        {/* Grade de Recursos */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-8">
          {recursosGratuitos.map((rec, i) => {
            const Icon = rec.icon
            return (
              <div key={i} className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/70 border border-blue-100 dark:border-blue-900 flex items-center justify-center text-[#2b85ff] dark:text-blue-400 shrink-0 mt-0.5">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {rec.titulo}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {rec.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Chamada para Ação */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Acesso integral liberado para todos os usuários cadastrados.
          </p>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              href="/vacinas"
              className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs text-center transition"
            >
              Minhas Vacinas
            </Link>
            <Link
              href="/triagem"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#2b85ff] hover:bg-blue-600 text-white font-bold text-xs text-center transition shadow-sm flex items-center justify-center gap-2"
            >
              Iniciar Nova Triagem Gratuita
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
