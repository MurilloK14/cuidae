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
    <section id="inicio" className="pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Side */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Small Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-xs font-bold tracking-wider mb-6">
              INTELIGÊNCIA ARTIFICIAL A SERVIÇO DA SUA SAÚDE
            </div>
            
            {/* Heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-6">
              Conectando você<br />
              aos hospitais da cidade<br />
              <span className="text-[#2b85ff]">com o poder da IA.</span>
            </h1>
            
            {/* Paragraph */}
            <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl leading-relaxed">
              Nossa plataforma usa inteligência artificial para integrar os hospitais da sua cidade, facilitando o acesso a atendimentos, exames, leitos e orientações médicas. Mais agilidade, menos burocracia e saúde para todos.
            </p>
            
            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <button
                onClick={() => onOpenAssistant?.("Quero começar a usar o sistema agora")}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-[#091426] hover:bg-[#15233c] text-white font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                <span>Começar agora</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              
              <a
                href="#como-funciona"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-medium transition-all duration-200 hover:bg-slate-50"
              >
                Saiba como funciona
              </a>
            </div>
          </div>

          {/* Right Side */}
          <div className="lg:col-span-5 relative mt-10 lg:mt-0">
            {/* Main Image Container */}
            <div className="relative rounded-3xl overflow-hidden aspect-[4/5] sm:aspect-[3/4] shadow-2xl border border-slate-100/50">
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
            <div className="absolute top-1/4 -left-4 sm:-left-12 lg:-left-20 w-[280px] sm:w-[320px] bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 overflow-hidden transform transition-transform hover:scale-[1.02] z-10">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#2b85ff]/10 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-[#2b85ff]" />
                </div>
                <p className="text-sm font-semibold text-slate-800 leading-tight">
                  Olá! Como posso te ajudar hoje?
                </p>
              </div>
              <div className="p-2 space-y-1">
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
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-slate-400 group-hover:text-[#2b85ff] transition-colors" />
                        <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
                          {item.label}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#2b85ff] group-hover:translate-x-0.5 transition-all" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Floating Stats Card (Right) */}
            <div className="absolute top-1/2 -right-4 sm:-right-8 lg:-right-12 translate-y-8 bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/10 z-10">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="text-white text-sm font-medium leading-relaxed tracking-wide">
                  Mais acesso<br />
                  Mais eficiência<br />
                  Mais vidas
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
};
