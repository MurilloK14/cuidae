"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Network,
  ClipboardList,
  Heart,
  Building2,
  MapPin,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Sparkles
} from "lucide-react";
import Link from "next/link";

interface HowItWorksProps {
  onOpenAssistant?: (prompt?: string) => void;
}

export function HowItWorks({ onOpenAssistant }: HowItWorksProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const steps = [
    {
      num: "01",
      title: "Você relata o que está sentindo",
      short: "Perguntas clínicas inteligentes em menos de 2 minutos.",
      desc: "Descreva sintomas, intensidade da dor e sinais de febre. A IA faz perguntas clínicas objetivas para entender a gravidade sem jargões médicos.",
      icon: Search,
      badge: "Entrada do Paciente",
      phoneScreen: {
        tag: "PASSO 1 • TRIAGEM",
        bubble: "Olá! Conte em poucas palavras o que você está sentindo.",
        patientInput: "Dor forte de garganta e febre de 38,5°C há 2 dias.",
        status: "Perguntas clínicas ativas",
        subtext: "Identificando sintomas associados..."
      }
    },
    {
      num: "02",
      title: "O Cuidaê cruza dados com a rede municipal",
      short: "Mapeamento em tempo real de UBSs, UPAs e hospitais.",
      desc: "O sistema analisa seu endereço e cruza com os postos de saúde (UBS), UPAs 24h e prontos-socorros com atendimento ativo na sua região.",
      icon: Network,
      badge: "Rede Municipal Ativa",
      phoneScreen: {
        tag: "PASSO 2 • GEOLOCALIZAÇÃO",
        bubble: "Mapeando unidades no raio de 3 km...",
        patientInput: "2 unidades com atendimento ativo encontradas",
        status: "UBS Jardim Saúde (800m) • UPA 24h (2,1km)",
        subtext: "Cruzando tempo de espera e especialidades..."
      }
    },
    {
      num: "03",
      title: "Você recebe o encaminhamento exato",
      short: "Classificação por cores do SUS sem adivinhação.",
      desc: "Recomendação precisa: se você deve ir a uma UBS para consulta programada, correr para a UPA 24h ou resolver com teleconsulta imediata.",
      icon: ClipboardList,
      badge: "Classificação Inteligente",
      phoneScreen: {
        tag: "PASSO 3 • CLASSIFICAÇÃO",
        bubble: "Nível de urgência analisado:",
        patientInput: "Classificação: Amarelo (Urgência Moderada)",
        status: "Atendimento prioritário em UBS indicada",
        subtext: "Evite pronto-socorro para não esperar na fila errada."
      }
    },
    {
      num: "04",
      title: "Atendimento ágil e sem filas perdidas",
      short: "Chegue no local certo sabendo o que levar e o que esperar.",
      desc: "Com o direcionamento em mãos, você não perde horas esperando no posto errado e já chega com o resumo da sua triagem pronto para o médico.",
      icon: Heart,
      badge: "Cuidado Concluído",
      phoneScreen: {
        tag: "PASSO 4 • ROTA & CUIDADO",
        bubble: "Unidade selecionada: UBS Jardim Saúde",
        patientInput: "Tempo a pé: 10 min • Fila estimada: 15 min",
        status: "Leve documento com foto e Cartão SUS",
        subtext: "Triagem preliminar enviada com sucesso!"
      }
    }
  ];

  // Auto rotate steps if user is not manually hovering/interacting
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, steps.length]);

  const currentStep = steps[activeStep];

  return (
    <section
      id="como-funciona"
      className="lg:min-h-[calc(100vh-4.5rem)] flex flex-col justify-center py-10 sm:py-14 lg:py-12 bg-gradient-to-b from-slate-50 via-[#f0f6ff]/40 to-white relative overflow-hidden border-b border-slate-100"
    >
      {/* Background Radial Glow */}
      <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-[#2b85ff]/10 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-cyan-400/10 rounded-full blur-[90px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        
        {/* Compact Header: Fits desktop viewport comfortably */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 lg:mb-8 text-left">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2b85ff]/10 border border-[#2b85ff]/20 text-[#2b85ff] text-[11px] font-bold tracking-wider mb-2.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2b85ff] animate-ping" />
              <span>FLUXO SIMPLES EM 4 PASSOS</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-[2.25rem] font-black text-[#091426] tracking-tight leading-tight">
              Como o Cuidaê conecta seus sintomas ao atendimento certo.
            </h2>

            <p className="mt-1.5 text-xs sm:text-sm lg:text-base text-slate-600 leading-relaxed font-normal">
              Sem dúvidas entre postinho ou pronto-socorro. Veja em tempo real como o fluxo funciona em 4 etapas rápidas:
            </p>
          </div>

          <div className="hidden md:flex items-center gap-3 shrink-0">
            <Link
              href="/como-funciona"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2b85ff] hover:text-blue-700 transition-colors"
            >
              <span>Ver guia detalhado</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Content Layout: 4 Steps Left + Compact Smartphone Mockup Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          
          {/* Left Column: Interactive 4-Step Cards */}
          <div
            className="lg:col-span-7 space-y-2.5"
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
          >
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isSelected = activeStep === idx;

              return (
                <div
                  key={step.num}
                  onClick={() => {
                    setActiveStep(idx);
                    setIsAutoPlaying(false);
                  }}
                  className={`cursor-pointer p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all duration-300 relative group ${
                    isSelected
                      ? "bg-white border-[#2b85ff] shadow-[0_10px_25px_-6px_rgba(43,133,255,0.18)] ring-1 ring-[#2b85ff]/30 translate-x-1"
                      : "bg-white/70 hover:bg-white border-slate-200/80 hover:border-slate-300 shadow-sm"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Number Badge with Gradient */}
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm shrink-0 transition-all duration-300 shadow-sm ${
                        isSelected
                          ? "bg-gradient-to-br from-[#091426] to-[#1e3a68] text-white scale-105"
                          : "bg-slate-100 text-slate-700 group-hover:bg-[#2b85ff]/10 group-hover:text-[#2b85ff]"
                      }`}
                    >
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-[10px] font-extrabold text-[#2b85ff] uppercase tracking-wider">
                          Passo {step.num} • {step.badge}
                        </span>
                        {isSelected ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Visualizando
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 group-hover:text-slate-600 font-medium">
                            Clique para ver
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-[#091426] leading-snug">
                        {step.title}
                      </h3>

                      {isSelected ? (
                        <p className="mt-1 text-xs text-slate-600 leading-relaxed font-normal animate-fade-in">
                          {step.desc}
                        </p>
                      ) : (
                        <p className="mt-0.5 text-xs text-slate-500 truncate font-normal">
                          {step.short}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Quick Action Link and SUS Badge */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                href="/triagem"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#091426] hover:bg-[#1a2c4e] text-white text-xs font-semibold transition-all shadow-sm hover:shadow-md"
              >
                <span>Fazer Triagem Gratuita Agora</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#2b85ff]" />
              </Link>

              <button
                type="button"
                onClick={() => onOpenAssistant?.("Como funciona a triagem de sintomas?")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-50 hover:bg-blue-100 text-[#2b85ff] text-xs font-semibold transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tirar dúvidas com a IA</span>
              </button>

              <span className="text-[11px] text-slate-400 font-medium ml-auto hidden sm:inline-block">
                100% Gratuito • Sem necessidade de cadastro prévio
              </span>
            </div>
          </div>

          {/* Right Column: Compact Smartphone Mockup with Realtime Synchronized Screen */}
          <div className="lg:col-span-5 relative flex justify-center items-center py-2">
            
            {/* Animated Radar Pulse Rings */}
            <div className="absolute w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] rounded-full border border-[#2b85ff]/15 animate-ping opacity-20 pointer-events-none" />
            <div className="absolute w-[220px] h-[220px] sm:w-[260px] sm:h-[260px] rounded-full border border-cyan-400/25 animate-pulse pointer-events-none" />

            {/* Floating Live Badge Top: UBS Jardim Saúde */}
            <div className="absolute -left-2 sm:-left-6 top-2 z-20 bg-white/95 backdrop-blur-md p-2.5 sm:p-3 rounded-xl sm:rounded-2xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.12)] border border-slate-100 flex items-center gap-2.5 transition-transform hover:scale-105">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2b85ff] flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-[#091426]">UBS Jardim Saúde</div>
                <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>800 m • Fila Rápida</span>
                </div>
              </div>
            </div>

            {/* Floating Live Badge Bottom: UPA 24h Vergueiro */}
            <div className="absolute -right-2 sm:-right-6 bottom-4 z-20 bg-white/95 backdrop-blur-md p-2.5 sm:p-3 rounded-xl sm:rounded-2xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.12)] border border-slate-100 flex items-center gap-2.5 transition-transform hover:scale-105">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-[#091426]">UPA 24h Vergueiro</div>
                <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>2,1 km • Plantão Ativo</span>
                </div>
              </div>
            </div>

            {/* Phone Hardware Shell (Compact height: ~430px) */}
            <div className="relative rounded-[2rem] bg-slate-900 p-2.5 shadow-[0_20px_45px_-10px_rgba(9,20,38,0.3)] border-[3px] border-slate-800 w-[260px] sm:w-[275px] z-10">
              {/* Dynamic Island / Notch */}
              <div className="absolute top-2 inset-x-0 flex justify-center z-20">
                <div className="w-20 h-3.5 bg-slate-900 rounded-full" />
              </div>

              {/* Screen Content */}
              <div className="bg-slate-50 rounded-[1.6rem] overflow-hidden w-full aspect-[9/17.5] flex flex-col pt-4">
                
                {/* App Status Header */}
                <div className="px-3.5 py-2.5 bg-white flex justify-between items-center border-b border-slate-100 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-md bg-[#2b85ff] text-white flex items-center justify-center font-bold text-[11px]">
                      C
                    </div>
                    <span className="font-extrabold text-xs text-[#091426]">Cuidaê</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                      Ao vivo
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                </div>

                {/* Simulated Triage Interface - Dynamically updates with activeStep */}
                <div className="p-3 flex-1 flex flex-col justify-between space-y-2 text-left">
                  <div className="space-y-2">
                    {/* Current Step Tag inside Phone */}
                    <div className="inline-block px-2 py-0.5 bg-slate-200/70 text-slate-700 rounded text-[9px] font-extrabold uppercase tracking-wide">
                      {currentStep.phoneScreen.tag}
                    </div>

                    {/* AI Chat Bubble */}
                    <div className="bg-[#eef5ff] text-[#2b85ff] p-2.5 rounded-xl rounded-tl-sm text-[11px] font-medium leading-relaxed border border-[#2b85ff]/15">
                      🩺 <strong>Assistente Cuidaê:</strong> {currentStep.phoneScreen.bubble}
                    </div>

                    {/* Patient / System Box */}
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-[10px] text-slate-800 font-semibold shadow-sm flex items-center justify-between">
                      <span className="leading-snug">{currentStep.phoneScreen.patientInput}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2b85ff] shrink-0 ml-1.5" />
                    </div>

                    {/* Status & Recommendation Card */}
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-slate-700">Situação:</span>
                        <span className="font-bold text-[#2b85ff] text-[10px]">
                          {currentStep.badge}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-600 font-medium leading-tight">
                        {currentStep.phoneScreen.status}
                      </p>
                      <p className="text-[8.5px] text-slate-400 leading-tight italic">
                        {currentStep.phoneScreen.subtext}
                      </p>
                    </div>
                  </div>

                  {/* Destination / Action Card inside Phone */}
                  <div className="bg-[#091426] text-white p-2.5 rounded-xl space-y-1 shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">
                        Recomendado SUS
                      </span>
                      <span className="text-[9px] text-slate-300">Aberto</span>
                    </div>
                    <p className="text-[11px] font-bold leading-tight">UBS Jardim Saúde</p>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[9px] text-slate-300">
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
