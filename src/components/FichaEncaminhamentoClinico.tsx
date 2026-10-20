'use client'

import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import {
  Printer,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Download,
  Building2,
  Calendar,
  Clock,
  User,
  HeartPulse,
  QrCode as QrCodeIcon,
  MessageSquare,
  FileText,
  CheckCircle2,
  ExternalLink
} from 'lucide-react'
import { buildWhatsappUrl, formatarWhatsappAgendamento } from '@/lib/whatsapp'
import type { AgendamentoHospitalar } from '@/lib/types'

interface FichaProps {
  agendamento: AgendamentoHospitalar
  onClose?: () => void
}

export function FichaEncaminhamentoClinico({ agendamento, onClose }: FichaProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')

  // URL pública ou de validação do protocolo
  const urlValidacao = typeof window !== 'undefined'
    ? `${window.location.origin}/agendamento/confirmacao/${agendamento.id || agendamento.protocolo}`
    : `https://cuidae.saude.gov.br/validar/${agendamento.protocolo}`

  useEffect(() => {
    async function gerarQr() {
      try {
        const dataUrl = await QRCode.toDataURL(urlValidacao, {
          width: 256,
          margin: 1,
          color: {
            dark: '#091426',
            light: '#ffffff',
          },
        })
        setQrCodeDataUrl(dataUrl)
      } catch (err) {
        console.error('Erro ao gerar QR Code:', err)
      }
    }
    gerarQr()
  }, [urlValidacao])

  const isVerde = agendamento.nivel_urgencia === 'verde'
  const isAmarelo = agendamento.nivel_urgencia === 'amarelo'
  const isVermelho = agendamento.nivel_urgencia === 'vermelho'

  const corManchester = isVermelho
    ? {
        nome: 'VERMELHO — EMERGÊNCIA',
        tempo: 'Atendimento Imediato (0 minutos)',
        badge: 'bg-red-600 text-white border-red-700',
        borda: 'border-red-500',
        fundo: 'bg-red-50',
      }
    : isAmarelo
    ? {
        nome: 'AMARELO — URGENTE',
        tempo: 'Avaliação Médica em até 60 minutos',
        badge: 'bg-amber-500 text-white border-amber-600',
        borda: 'border-amber-400',
        fundo: 'bg-amber-50',
      }
    : {
        nome: 'VERDE — POUCO URGENTE',
        tempo: 'Atendimento Prioritário em até 120 minutos',
        badge: 'bg-emerald-600 text-white border-emerald-700',
        borda: 'border-emerald-500',
        fundo: 'bg-emerald-50',
      }

  const dataAtendimentoFormatada = agendamento.data_agendamento
    ? new Date(agendamento.data_agendamento + 'T12:00:00').toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : 'Data a confirmar'

  const dataEmissaoFormatada = new Date(agendamento.created_at || Date.now()).toLocaleString('pt-BR')

  const handleImprimir = () => {
    window.print()
  }

  const urlWhatsapp = buildWhatsappUrl(formatarWhatsappAgendamento(agendamento))

  return (
    <div className="space-y-4">
      {/* Barra de Ações (Oculta na Impressão) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900 text-white rounded-2xl print:hidden shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold leading-tight">Ficha Clínica Pronta para Download / Impressão</p>
            <p className="text-[11px] text-slate-300">Formatada para folha A4 com QR Code de validação digital</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão WhatsApp Grátis */}
          <a
            href={urlWhatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Salvar no WhatsApp</span>
          </a>

          {/* Botão Imprimir / Salvar PDF */}
          <button
            type="button"
            onClick={handleImprimir}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2b85ff] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir / Baixar PDF</span>
          </button>
        </div>
      </div>

      {/* DOCUMENTO OFICIAL A4 IMPRESSO */}
      <div
        id="ficha-encaminhamento-a4"
        className="bg-white text-slate-900 p-8 sm:p-10 rounded-2xl border border-slate-300 shadow-sm font-jakarta print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none max-w-4xl mx-auto"
        style={{ minHeight: '297mm' }}
      >
        {/* Cabeçalho Oficial SUS / Ministério da Saúde */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-900 text-white flex items-center justify-center font-black text-xl tracking-tighter shrink-0 border border-blue-950">
                SUS
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                  República Federativa do Brasil • Ministério da Saúde
                </p>
                <h1 className="text-lg sm:text-xl font-black uppercase text-slate-950 tracking-tight leading-tight">
                  Ficha Integrada de Encaminhamento Clínico
                </h1>
                <p className="text-xs font-semibold text-slate-700">
                  Sistema Municipal de Regulação & Acolhimento • Cuidaê Saúde Digital
                </p>
              </div>
            </div>

            {/* Número do Protocolo & Hash */}
            <div className="text-right shrink-0">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Número do Protocolo</span>
              <span className="font-mono text-base font-black text-blue-900 block tracking-wider">
                {agendamento.protocolo}
              </span>
              <span className="text-[9px] font-mono text-slate-500 block mt-0.5">
                Hash: {agendamento.transmissao_hospital?.hash_seguranca?.substring(0, 16) || 'AUTH-DIGITAL-OK'}
              </span>
            </div>
          </div>
        </div>

        {/* Faixa Classificação de Risco Manchester */}
        <div className={`p-4 rounded-xl border-2 ${corManchester.borda} ${corManchester.fundo} mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3`}>
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border shadow-xs ${corManchester.badge}`}>
              {corManchester.nome}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Protocolo de Classificação de Risco de Manchester</p>
              <p className="text-[11px] text-slate-600 font-medium">Tempo Recomendado: <strong>{corManchester.tempo}</strong></p>
            </div>
          </div>
          <div className="text-xs font-semibold text-slate-700 bg-white/80 px-3 py-1 rounded-md border border-slate-200">
            Acolhimento Pré-Hospitalar com IA
          </div>
        </div>

        {/* Grid de Dados do Paciente e Agendamento */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Caixa do Paciente */}
          <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/60">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-2">
              Identificação do Paciente
            </span>
            <div className="space-y-1 text-xs">
              <p><strong>Nome Completo:</strong> {agendamento.paciente_nome}</p>
              <p><strong>Cartão SUS / ID:</strong> {agendamento.user_id !== 'anonimo' ? agendamento.user_id : 'Documento verificado na entrada'}</p>
              <p><strong>Data de Emissão:</strong> {dataEmissaoFormatada}</p>
              <p><strong>Canal Emissor:</strong> Plataforma Cuidaê Digital (Cidadão SUS)</p>
            </div>
          </div>

          {/* Caixa da Unidade de Destino */}
          <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/60">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-2">
              Unidade de Destino e Agendamento
            </span>
            <div className="space-y-1 text-xs">
              <p><strong>Unidade Hospitalar:</strong> {agendamento.unidade_nome}</p>
              <p><strong>Endereço:</strong> {agendamento.unidade_endereco || 'Garanhuns - PE'}</p>
              <p><strong>Data do Atendimento:</strong> {dataAtendimentoFormatada}</p>
              <p><strong>Horário Reservado:</strong> {agendamento.horario || 'Ordem de Chegada / Acolhimento'}</p>
              <p><strong>Especialidade / Setor:</strong> {agendamento.especialidade}</p>
            </div>
          </div>
        </div>

        {/* Quadro Clínico / Sintomas e Hipótese Diagnóstica */}
        <div className="border border-slate-300 rounded-xl p-5 mb-6 space-y-4">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block border-b border-slate-200 pb-1">
            Avaliação Clínica e Prontuário Preliminar
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-bold text-slate-700 block mb-1">Queixa Principal / Sintomas Relatados:</span>
              <p className="text-xs bg-slate-100 p-2.5 rounded-lg border border-slate-200 font-medium text-slate-800 leading-relaxed">
                "{agendamento.sintomas_citados}"
              </p>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-700 block mb-1">Diagnóstico Preliminar e Parecer da IA:</span>
              <p className="text-xs bg-blue-50 p-2.5 rounded-lg border border-blue-200 font-bold text-blue-950 leading-relaxed">
                {agendamento.diagnostico_ia}
              </p>
            </div>
          </div>

          {agendamento.orientacao_ia && (
            <div>
              <span className="text-xs font-bold text-slate-700 block mb-1">Orientações e Condutas Recomendadas:</span>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                {agendamento.orientacao_ia}
              </p>
            </div>
          )}

          {agendamento.resumo_clinico_hospital && (
            <div>
              <span className="text-xs font-bold text-slate-700 block mb-1">Resumo Clínico Transmitido à Enfermagem:</span>
              <p className="text-[11px] text-slate-600 leading-relaxed italic bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                {agendamento.resumo_clinico_hospital}
              </p>
            </div>
          )}
        </div>

        {/* Área do QR Code Dinâmico e Validação da Recepção */}
        <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-50/40">
          <div className="space-y-2 max-w-md">
            <div className="flex items-center gap-2">
              <QrCodeIcon className="w-5 h-5 text-blue-800" />
              <h3 className="text-sm font-black text-slate-900 uppercase">Validação Eletrônica na Recepção</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              O recepcionista ou enfermeiro de triagem pode <strong>escanear o QR Code ao lado</strong> com a câmera do celular ou leitor de código de barras para validar instantaneamente este protocolo no sistema hospitalar Cuidaê.
            </p>
            <p className="text-[11px] font-mono text-slate-500 break-all">
              Link de Validação: {urlValidacao}
            </p>
          </div>

          <div className="shrink-0 text-center">
            {qrCodeDataUrl ? (
              <div className="bg-white p-2 rounded-xl border border-slate-300 shadow-xs inline-block">
                <img
                  src={qrCodeDataUrl}
                  alt={`QR Code ${agendamento.protocolo}`}
                  className="w-32 h-32 object-contain"
                />
              </div>
            ) : (
              <div className="w-32 h-32 bg-slate-200 animate-pulse rounded-xl flex items-center justify-center text-xs text-slate-500">
                Gerando QR...
              </div>
            )}
            <span className="text-[10px] font-bold text-slate-500 block mt-1 uppercase tracking-wider">
              Autenticação Digital
            </span>
          </div>
        </div>

        {/* Rodapé e Assinaturas Legais */}
        <div className="pt-4 border-t-2 border-slate-900 text-slate-600">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-6 pt-4">
            <div className="text-center pt-8 border-t border-slate-400">
              <p className="text-xs font-bold text-slate-900 uppercase">{agendamento.paciente_nome}</p>
              <p className="text-[10px] text-slate-500">Assinatura do Paciente ou Responsável Legal</p>
            </div>
            <div className="text-center pt-8 border-t border-slate-400">
              <p className="text-xs font-bold text-slate-900 uppercase">Acolhimento & Triagem de Recepção</p>
              <p className="text-[10px] text-slate-500">Carimbo e Assinatura do Profissional / Coren / CRM</p>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 leading-tight space-y-1">
            <p>
              * Documento emitido em conformidade com as diretrizes do Sistema Único de Saúde (SUS), Portaria nº 2048/GM/MS e Resolução CFM nº 2.314/2022.
            </p>
            <p>
              Cuidaê Saúde Digital • Sistema 100% Gratuito à População • Autenticidade verificável eletronicamente pelo protocolo {agendamento.protocolo}.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
