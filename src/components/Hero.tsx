"use client";

import React from "react";
import Image from "next/image";
import {
  ArrowRight,
  Bot,
  Calendar,
  FileText,
  Bed,
  Building2,
  ChevronRight,
  ShieldCheck
} from "lucide-react";

interface HeroProps {
  onOpenAssistant: (prompt?: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenAssistant }) => {
  return (
    <section id="inicio" className="min-h-[calc(100vh-4.5rem)] flex items-center pt-20 pb-8 lg:pt-24 lg:pb-10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Side */}
          <div className="lg:col-span-7 flex flex-col items-start text-left animate-fade-in-up opacity-0" style={{ animationDelay: "0.1s" }}>
            {/* Small Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold tracking-wider mb-4 sm:mb-6">
              ASSISTENTE DE SAÚDE INTELIGENTE
            </div>
            
            {/* Heading */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-extrabold text-slate-900 leading-[1.12] tracking-[-0.03em] mb-4 sm:mb-6">
              Conectando você<br />
              aos postos e hospitais<br />
              <span className="text-[#2b85ff]">com clareza e agilidade.</span>
            </h1>
            
            {/* Paragraph */}
            <p className="text-base sm:text-lg text-slate-600 mb-6 sm:mb-8 max-w-xl leading-relaxed">
              O Cuidaê analisa seus sintomas em menos de 2 minutos e indica se você deve ir a um posto de saúde (UBS), UPA 24h ou realizar teleconsulta. Menos tempo de espera e cuidado certo para a sua saúde.
            </p>
            
            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
              <a
                href="/triagem"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#091426] hover:bg-[#1a2c4e] text-white font-medium transition-all duration-300 shadow-[0_8px_20px_-8px_rgba(9,20,38,0.5)] hover:shadow-[0_12px_24px_-8px_rgba(9,20,38,0.6)] hover:-translate-y-0.5 text-sm sm:text-base"
              >
                <span>Fazer Triagem Gratuita</span>
                <ArrowRight className="w-5 h-5" />
              </a>
              
              <a
                href="#como-funciona"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-medium transition-all duration-300 hover:bg-slate-50 shadow-sm text-sm sm:text-base"
              >
                Como funciona
              </a>
            </div>
          </div>

          {/* Right Side */}
          <div className="lg:col-span-5 relative mt-8 lg:mt-0 max-w-md mx-auto lg:max-w-none w-full">
            {/* Main Image Container */}
            <div className="relative rounded-3xl overflow-hidden aspect-[4/5] max-h-[460px] sm:max-h-[500px] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.15)] border border-slate-100/50 transition-transform duration-500 hover:scale-[1.01]">
              <Image
                src="/images/doctor_hero.jpg"
                alt="Profissional de Saúde"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent mix-blend-overlay"></div>
            </div>

            {/* Floating Chatbot Card (Left) */}
            <div className="absolute top-1/4 -left-3 sm:-left-8 lg:-left-12 w-[260px] sm:w-[300px] bg-white rounded-2xl shadow-[0_16px_32px_-12px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden transform transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] z-10">
              <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#2b85ff]/10 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-[#2b85ff]" />
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-tight">
                  Olá! Como posso te ajudar hoje?
                </p>
              </div>
              <div className="p-2 space-y-0.5">
                {[
                  { label: "Agendar consulta", icon: Calendar },
                  { label: "Consultar disponibilidade de leitos", icon: Bed },
                  { label: "Verificar exames", icon: FileText },
                  { label: "Falar com um hospital", icon: Building2 }
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => onOpenAssistant?.(item.label)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors group text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-slate-400 group-hover:text-[#2b85ff] transition-colors" />
                        <span className="text-xs sm:text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
                          {item.label}
                        </span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#2b85ff] group-hover:translate-x-0.5 transition-all" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Floating Stats Card (Right) */}
            <div className="absolute bottom-4 -right-2 sm:-right-6 lg:-right-8 bg-slate-900/85 backdrop-blur-md rounded-2xl p-3.5 shadow-xl border border-white/10 z-10">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="text-white text-xs sm:text-sm font-medium leading-snug tracking-wide">
                  Mais acesso<br />
                  Mais eficiência<br />
                  Mais vidas
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="mt-8 pt-4 flex justify-center">
          <a
            href="#como-funciona"
            className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs font-semibold text-slate-500 hover:text-[#2b85ff] transition-all shadow-sm hover:shadow"
          >
            <span className="w-2 h-2 rounded-full bg-[#2b85ff] animate-ping" />
            <span>Role para ver como funciona</span>
            <span className="inline-block text-slate-400 group-hover:text-[#2b85ff] group-hover:translate-y-0.5 transition-transform">↓</span>
          </a>
        </div>
      </div>
    </section>
  );
};
