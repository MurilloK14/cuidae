'use client'

import React, { useState } from 'react'
import { Printer, Share2, Copy, Check, MessageSquare } from 'lucide-react'

interface BotoesCompartilhamentoProps {
  triagem: {
    id: string
    sintoma_principal: string
    nivel_urgencia?: string
    recomendacao?: string
    especialidade?: string
    explicacao?: string
    orientacao?: string
    fonteIA?: string
    created_at?: string
    hipotesesDiagnosticas?: Array<{ nome: string; probabilidade: number }>
  }
}

export function BotoesCompartilhamentoTriagem({ triagem }: BotoesCompartilhamentoProps) {
  const [copiado, setCopiado] = useState(false)

  const urgenciaTexto =
    triagem.nivel_urgencia === 'vermelho'
      ? '🔴 Emergência (Alta Prioridade)'
      : triagem.nivel_urgencia === 'amarelo'
      ? '🟡 Urgente (Prioridade Moderada)'
      : '🟢 Pouco Urgente (Atenção Básica)'

  const listaHipoteses = triagem.hipotesesDiagnosticas?.length
    ? triagem.hipotesesDiagnosticas.map((h) => `  • ${h.nome}: ${h.probabilidade}%`).join('\n')
    : ''

  const textoResumo =
    `🏥 *Laudo de Triagem Cuidaê / SUS*\n` +
    `📅 Data: ${new Date(triagem.created_at || Date.now()).toLocaleDateString('pt-BR')}\n\n` +
    `📋 *Queixa Relatada:* ${triagem.sintoma_principal}\n` +
    `🚦 *Classificação de Risco:* ${urgenciaTexto}\n` +
    `🩺 *Hipótese Principal:* ${triagem.recomendacao || triagem.explicacao}\n` +
    (listaHipoteses ? `📊 *Diagnóstico Diferencial (Infermedica):*\n${listaHipoteses}\n` : '') +
    (triagem.especialidade ? `👨‍⚕️ *Especialidade Indicada:* ${triagem.especialidade}\n` : '') +
    (triagem.orientacao ? `💡 *Orientações:* ${triagem.orientacao}\n` : '') +
    `\nValidação Clínica: Motor Infermedica API v3 + Google Gemini`

  const handleCopiar = async () => {
    try {
      await navigator.clipboard.writeText(textoResumo)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      // Fallback
    }
  }

  const handleImprimir = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  const urlWhatsapp = `https://api.whatsapp.com/send?text=${encodeURIComponent(textoResumo)}`

  return (
    <div className="flex flex-wrap items-center gap-2.5 print:hidden">
      {/* WhatsApp */}
      <a
        href={urlWhatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all"
        title="Enviar resumo médico pelo WhatsApp"
      >
        <MessageSquare className="w-4 h-4" />
        <span>Enviar no WhatsApp</span>
      </a>

      {/* Imprimir / PDF */}
      <button
        type="button"
        onClick={handleImprimir}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs transition-all"
        title="Imprimir prontuário ou salvar como PDF"
      >
        <Printer className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        <span>Imprimir / Salvar PDF</span>
      </button>

      {/* Copiar Texto */}
      <button
        type="button"
        onClick={handleCopiar}
        className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium rounded-xl transition-all"
        title="Copiar texto completo para a área de transferência"
      >
        {copiado ? (
          <>
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-emerald-700 dark:text-emerald-300 font-semibold">Copiado!</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 text-slate-400" />
            <span>Copiar Resumo</span>
          </>
        )}
      </button>
    </div>
  )
}
