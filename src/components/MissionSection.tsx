"use client";

import React from "react";
import { Users, Building2, Brain, Activity, Heart } from "lucide-react";

export const MissionSection: React.FC = () => {
  return (
    <section id="nossa-missao" className="py-28 sm:py-36 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          {/* Left Column: Emotional Statement */}
          <div className="lg:col-span-6 space-y-6">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#091426] tracking-[-0.03em] leading-[1.08]">
              Saúde de qualidade, <br />
              para todos.
            </h2>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-xl">
              Acreditamos que a tecnologia pode aproximar pessoas, hospitais e oportunidades. Por
              isso, estamos construindo uma inteligência artificial capaz de tornar o acesso à saúde
              mais simples, rápido e acessível.
            </p>
          </div>

          {/* Right Column: Large Abstract Illustration of Network Connections */}
          <div className="lg:col-span-6 relative flex items-center justify-center">
            <div className="relative w-full max-w-[500px] aspect-square rounded-3xl bg-slate-50/60 border border-slate-100 p-8 flex items-center justify-center shadow-[0_4px_30px_rgba(0,0,0,0.02)]">
              {/* SVG Network Connections Canvas */}
              <svg
                viewBox="0 0 400 400"
                className="w-full h-full"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Connecting Lines */}
                <path
                  d="M200 200 L90 100"
                  stroke="#2b85ff"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  className="animate-pulse"
                />
                <path
                  d="M200 200 L310 100"
                  stroke="#2b85ff"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  className="animate-pulse"
                />
                <path
                  d="M200 200 L90 300"
                  stroke="#2b85ff"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  className="animate-pulse"
                />
                <path
                  d="M200 200 L310 300"
                  stroke="#2b85ff"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  className="animate-pulse"
                />
                <circle cx="200" cy="200" r="140" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="6 6" />

                {/* Animated Rings around Center */}
                <circle cx="200" cy="200" r="60" stroke="#bfdbfe" strokeWidth="1.5" className="animate-ping opacity-25" />
              </svg>

              {/* Center Node: Cuidae AI Core */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-[#2b85ff] text-white flex flex-col items-center justify-center shadow-[0_10px_30px_rgba(43,133,255,0.35)] z-20">
                <Brain className="w-8 h-8" />
                <span className="text-[10px] font-bold mt-0.5">IA Cuidae</span>
              </div>

              {/* Node 1 (Top Left): Pessoas / Cidadãos */}
              <div className="absolute top-12 left-12 p-3.5 rounded-2xl bg-white border border-slate-100 shadow-[0_8px_24px_rgba(0,0,0,0.03)] flex items-center gap-2.5 z-10">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2b85ff] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-[#091426]">Pessoas</div>
                  <div className="text-[10px] text-slate-500">Acesso simplificado</div>
                </div>
              </div>

              {/* Node 2 (Top Right): Hospitais */}
              <div className="absolute top-12 right-12 p-3.5 rounded-2xl bg-white border border-slate-100 shadow-[0_8px_24px_rgba(0,0,0,0.03)] flex items-center gap-2.5 z-10">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-[#091426]">Hospitais</div>
                  <div className="text-[10px] text-slate-500">Capacidade integrada</div>
                </div>
              </div>

              {/* Node 3 (Bottom Left): Atendimento & Oportunidades */}
              <div className="absolute bottom-12 left-12 p-3.5 rounded-2xl bg-white border border-slate-100 shadow-[0_8px_24px_rgba(0,0,0,0.03)] flex items-center gap-2.5 z-10">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-[#091426]">Atendimento</div>
                  <div className="text-[10px] text-slate-500">Triagem ágil</div>
                </div>
              </div>

              {/* Node 4 (Bottom Right): Humanização */}
              <div className="absolute bottom-12 right-12 p-3.5 rounded-2xl bg-white border border-slate-100 shadow-[0_8px_24px_rgba(0,0,0,0.03)] flex items-center gap-2.5 z-10">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                  <Heart className="w-4 h-4 fill-current" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-[#091426]">Cuidado</div>
                  <div className="text-[10px] text-slate-500">Saúde para todos</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
