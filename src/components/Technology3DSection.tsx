"use client";

import React, { useState } from "react";
import { RealHeart3D } from "./RealHeart3D";
import { Activity, ShieldCheck, Heart } from "lucide-react";

export const Technology3DSection: React.FC = () => {
  const [pulseRate, setPulseRate] = useState<number>(72);

  return (
    <section className="py-24 sm:py-32 bg-white relative overflow-hidden border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Context */}
          <div className="lg:col-span-6 space-y-6">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#091426] tracking-[-0.03em] leading-tight">
              Tecnologia a serviço da vida.
            </h2>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              O coração tecnológico da Cuidae processa dados em tempo real para conectar você ao
              recurso certo com máxima precisão, auxiliando na redução de filas e facilitando o
              acesso hospitalar.
            </p>

            {/* Feature Points */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2b85ff] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#091426]">
                    Processamento Inteligente de Demandas
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-relaxed font-normal">
                    Identificação rápida do melhor serviço hospitalar com base na urgência e
                    disponibilidade.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#091426]">
                    Segurança e Privacidade dos Dados
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-relaxed font-normal">
                    Em total conformidade com a LGPD e regulamentações do Conselho Federal de
                    Medicina.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive 3D Heart */}
          <div className="lg:col-span-6 relative flex items-center justify-center">
            <div className="relative w-full max-w-[480px] bg-slate-50/70 rounded-3xl p-6 sm:p-8 border border-slate-100 flex flex-col items-center justify-center shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
              {/* Header Status Tag */}
              <div className="w-full flex items-center justify-between pb-3 border-b border-slate-200/60 text-xs text-slate-500">
                <span className="font-semibold text-slate-800">Modelo Anatômico 3D</span>
                <span className="text-[11px] font-mono text-slate-400">Interativo com o cursor</span>
              </div>

              {/* 3D Heart */}
              <div className="w-full my-2">
                <RealHeart3D pulseRate={pulseRate} />
              </div>

              {/* Pulse Controls */}
              <div className="w-full pt-4 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" />
                  Simulação de frequência:
                </span>
                <div className="flex items-center gap-1.5">
                  {[60, 72, 90].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => setPulseRate(rate)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                        pulseRate === rate
                          ? "bg-[#091426] text-white shadow-2xs"
                          : "bg-white text-slate-600 hover:bg-slate-200 border border-slate-200"
                      }`}
                    >
                      <span className="tabular-nums">{rate}</span> BPM
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
