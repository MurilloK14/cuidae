"use client";

import React, { useState } from "react";
import {
  Search,
  Network,
  ClipboardList,
  Heart,
  Building2,
  ChevronRight,
  MapPin,
  User,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

interface HowItWorksProps {
  onOpenAssistant?: (prompt?: string) => void;
}

export function HowItWorks({ onOpenAssistant }: HowItWorksProps) {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      num: "01",
      title: "Você relata o que está sentindo",
      desc: "Descreva seus sintomas, intensidade da dor e se tem febre ou outras condições. Nossa IA faz perguntas clínicas guiadas em menos de 2 minutos.",
      icon: Search,
      color: "from-blue-500 to-[#2b85ff]",
      badge: "Entrada do Paciente"
    },
    {
      num: "02",
      title: "A IA cruza dados com a rede municipal",
      desc: "O sistema analisa o grau de urgência (Verde, Amarelo ou Vermelho) e mapeia os postos de saúde (UBS), UPAs 24h e hospitais da sua região.",
      icon: Network,
      color: "from-[#2b85ff] to-cyan-500",
      badge: "Análise Clínica & Região"
    },
    {
      num: "03",
      title: "Você recebe o encaminhamento exato",
      desc: "Recomendação clara: ir a uma UBS para consulta de rotina, procurar UPA 24h imediatamente ou agendar teleconsulta pelo celular.",
      icon: ClipboardList,
      color: "from-cyan-500 to-emerald-500",
      badge: "Classificação Inteligente"
    },
    {
      num: "04",
      title: "Atendimento ágil e sem filas perdidas",
      desc: "Com o encaminhamento e a unidade correta em mãos, você economiza horas evitando ir ao local errado e recebe cuidados mais rápidos.",
      icon: Heart,
      color: "from-emerald-500 to-rose-500",
      badge: "Cuidado Concluído"
    }
  ];

  return (
    <section
      id="como-funciona"
      className="py-24 sm:py-36 bg-gradient-to-b from-slate-50 via-[#f0f6ff]/40 to-white relative overflow-hidden border-b border-slate-100"
    >
      {/* Background Radial Glow & Medical Grid */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#2b85ff]/10 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-400/10 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16 sm:mb-20 text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#2b85ff]/10 border border-[#2b85ff]/20 text-[#2b85ff] text-xs font-bold tracking-wider mb-4 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#2b85ff] animate-ping" />
            <span>FLUXO SIMPLES EM 4 PASSOS</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#091426] tracking-[-0.03em] leading-tight">
            Como a IA conecta seus sintomas ao atendimento certo.
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Esqueça a dúvida de saber se deve ir ao postinho ou correr para o pronto-socorro. Nossa inteligência artificial guia cada etapa com clareza e rapidez.
          </p>
        </div>

        {/* Content Layout: Steps Left + Live Simulated Phone Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Interactive 4-Step Cards */}
          <div className="lg:col-span-7 space-y-4">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isSelected = activeStep === idx;

              return (
                <div
                  key={step.num}
                  onClick={() => setActiveStep(idx)}
                  className={`cursor-pointer p-5 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all duration-300 relative group ${
                    isSelected
                      ? "bg-white border-[#2b85ff] shadow-[0_12px_32px_-8px_rgba(43,133,255,0.15)] ring-1 ring-[#2b85ff]/20"
                      : "bg-white/70 hover:bg-white border-slate-200/80 hover:border-slate-300 shadow-sm"
                  }`}
                >
                  <div className="flex items-start gap-4 sm:gap-5">
                    {/* Number Badge with Gradient */}
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 transition-all duration-300 shadow-sm ${
                        isSelected
                          ? "bg-gradient-to-br from-[#091426] to-[#1e3a68] text-white scale-105"
                          : "bg-slate-100 text-slate-700 group-hover:bg-[#2b85ff]/10 group-hover:text-[#2b85ff]"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[11px] font-extrabold text-[#2b85ff] uppercase tracking-wider">
                          Passo {step.num} • {step.badge}
                        </span>
                        {isSelected && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Visualizando
                          </span>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-[#091426] leading-snug">
                        {step.title}
                      </h3>

                      <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Quick Action Link */}
            <div className="pt-4 flex items-center gap-4">
              <Link
                href="/triagem"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#091426] hover:bg-[#1a2c4e] text-white text-xs sm:text-sm font-semibold transition-all shadow-sm hover:shadow-md"
              >
                <span>Experimente a Triagem Agora</span>
                <ArrowRight className="w-4 h-4 text-[#2b85ff]" />
              </Link>
              <span className="text-xs text-slate-400 font-medium">
                100% Gratuito • Sem necessidade de baixar app
              </span>
            </div>
          </div>

          {/* Right Column: Smartphone Mockup with Realtime Pulsing Radar & Floating Local Badges */}
          <div className="lg:col-span-5 relative flex justify-center items-center">
            
            {/* Animated Radar Pulse Rings */}
            <div className="absolute w-[360px] h-[360px] sm:w-[420px] sm:h-[420px] rounded-full border border-[#2b85ff]/15 animate-ping opacity-25 pointer-events-none" />
            <div className="absolute w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] rounded-full border border-cyan-400/20 animate-pulse pointer-events-none" />

            {/* Floating Live Badge 1: UBS Jardim Saúde */}
            <div className="absolute -left-4 sm:-left-12 top-8 z-20 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-[0_12px_28px_-6px_rgba(0,0,0,0.12)] border border-slate-100 flex items-center gap-3 animate-[bounce_4s_ease-in-out_infinite] transition-transform">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2b85ff] flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-[#091426]">UBS Jardim Saúde</div>
                <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>800 m • Fila Rápida (10 min)</span>
                </div>
              </div>
            </div>

            {/* Floating Live Badge 2: UPA 24h Vergueiro */}
            <div className="absolute -right-4 sm:-right-10 top-1/2 -translate-y-6 z-20 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-[0_12px_28px_-6px_rgba(0,0,0,0.12)] border border-slate-100 flex items-center gap-3 animate-[bounce_5s_ease-in-out_infinite_reverse] transition-transform">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-[#091426]">UPA 24h Vergueiro</div>
                <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>2,1 km • Plantão Ativo & Raio-X</span>
                </div>
              </div>
            </div>

            {/* Floating Live Badge 3: Teleconsulta Médica */}
            <div className="absolute -left-2 sm:-left-8 bottom-10 z-20 bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-[0_12px_28px_-6px_rgba(0,0,0,0.12)] border border-slate-100 flex items-center gap-2.5 animate-[bounce_4.5s_ease-in-out_infinite] transition-transform">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-[#091426]">Teleconsulta 24h</div>
                <div className="text-[10px] text-purple-600 font-semibold">
                  Médico disponível em 5 min
                </div>
              </div>
            </div>

            {/* Phone Hardware Shell */}
            <div className="relative rounded-[2.5rem] bg-slate-900 p-3 shadow-[0_25px_50px_-12px_rgba(9,20,38,0.35)] border-4 border-slate-800 w-[280px] sm:w-[310px] z-10">
              {/* Dynamic Island / Notch */}
              <div className="absolute top-3 inset-x-0 flex justify-center z-20">
                <div className="w-24 h-4 bg-slate-900 rounded-full" />
              </div>

              {/* Screen Content */}
              <div className="bg-slate-50 rounded-[2rem] overflow-hidden w-full aspect-[9/18.5] flex flex-col pt-5">
                {/* App Status Header */}
                <div className="px-4 py-3 bg-white flex justify-between items-center border-b border-slate-100 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#2b85ff] text-white flex items-center justify-center font-bold text-xs">
                      S
                    </div>
                    <span className="font-extrabold text-sm text-[#091426]">SaúdeIA</span>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>

                {/* Simulated Triage Interface */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3 text-left">
                  <div className="space-y-2">
                    <div className="bg-[#eef5ff] text-[#2b85ff] p-3 rounded-2xl rounded-tl-sm text-xs font-medium leading-relaxed border border-[#2b85ff]/15">
                      🩺 <strong>Triagem IA:</strong> Qual o seu sintoma principal hoje?
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-[11px] text-slate-800 font-semibold shadow-sm flex items-center justify-between">
                      <span>Dor de garganta e febre (38°C)</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2b85ff]" />
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-700">Classificação:</span>
                        <span className="font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                          Amarelo • Moderado
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        Recomendação: Avaliação clínica em UBS ou teleconsulta.
                      </p>
                    </div>
                  </div>

                  {/* Destination Card inside Phone */}
                  <div className="bg-[#091426] text-white p-3 rounded-2xl space-y-1.5 shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                        Mais Próxima (800m)
                      </span>
                      <span className="text-[10px] text-slate-300">Aberto</span>
                    </div>
                    <p className="text-xs font-bold leading-tight">UBS Jardim Saúde</p>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px] text-slate-300">
                      <span>A pé: 10 min</span>
                      <span className="text-[#2b85ff] font-bold">Ver Rota →</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
