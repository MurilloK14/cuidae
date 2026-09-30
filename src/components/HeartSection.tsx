"use client";

import React, { useState } from "react";
import { RealHeart3D } from "./RealHeart3D";
import {
  Activity,
  Heart,
  ShieldCheck,
  Zap,
  Bed,
  CheckCircle2,
  Stethoscope,
  ChevronRight,
  Rotate3d,
} from "lucide-react";

interface HeartSectionProps {
  onOpenAssistant: (prompt?: string) => void;
}

export const HeartSection: React.FC<HeartSectionProps> = ({ onOpenAssistant }) => {
  const [pulseRate, setPulseRate] = useState<number>(75);
  const [activeTelemetry, setActiveTelemetry] = useState<string>("bpm");

  return (
    <section id="tecnologia-3d" className="py-20 sm:py-28 bg-[#f8fbff] relative overflow-hidden border-y border-slate-100">
      {/* Background Soft Blobs */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-sky-100/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Context & Technological Superiority */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#e8f1fc] border border-[#d2e4ff] text-[#1b68d8] text-xs font-semibold tracking-wider uppercase">
              <Rotate3d className="w-3.5 h-3.5 text-[#1672eb]" />
              <span>Tecnologia 3D & Telemetria em Tempo Real</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0c1b33] tracking-tight leading-tight">
              O coração pulsante da nossa rede hospitalar.
            </h2>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Mais do que agendar consultas, a Cuidae processa dados clínicos e biomédicos
              com inteligência artificial para antecipar emergências e garantir que cada paciente
              chegue ao hospital certo no menor tempo possível.
            </p>

            {/* Technological Capability Cards */}
            <div className="space-y-3.5 pt-2">
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#e8f1fc] text-[#1672eb] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Triagem Cardiovascular e Prioridade Clínica
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Algoritmos neurais identificam sintomas de risco e acionam protocolos de socorro
                    imediato nos prontos-socorros parceiros.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bed className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Reserva Dinâmica de Leitos de Alta Complexidade
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Sincronização segundo a segundo com enfermarias e UTIs dos hospitais municipais
                    e particulares credenciados.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Telemetria Criptografada e Anonimizada
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Seus dados de saúde protegidos por criptografia de nível hospitalar e total
                    conformidade com a LGPD e o Conselho Federal de Medicina.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={() => onOpenAssistant("Gostaria de saber como a IA faz a triagem médica de emergência")}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0d1f36] hover:bg-[#162e4f] text-white text-sm font-medium transition-all shadow-sm hover:shadow"
              >
                <span>Simular triagem com IA</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Interaja com o modelo ao lado</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive 3D Heart + Real-Time Telemetry Overlays */}
          <div className="lg:col-span-6 relative flex items-center justify-center">
            {/* Main Interactive Stage Container */}
            <div className="relative w-full max-w-[520px] rounded-3xl bg-white/80 backdrop-blur-xl border border-slate-200/90 shadow-2xl p-6 sm:p-8 overflow-hidden">
              {/* Header inside the 3D Stage */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-bold text-slate-800 tracking-wide">
                    SISTEMA DE MONITORAMENTO BIOMÉDICO
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-full text-[10px] font-mono text-slate-600">
                  <span>3D GLTF</span> • <span>INTERATIVO</span>
                </div>
              </div>

              {/* The Three.js 3D Heart */}
              <div className="relative w-full my-2">
                <RealHeart3D pulseRate={pulseRate} />
              </div>

              {/* Interactive Telemetry Dock Under the Heart */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-rose-500 fill-current" />
                    Simular Frequência Cardíaca:
                  </span>
                  <span className="font-mono font-bold text-[#1672eb]">{pulseRate} BPM</span>
                </div>

                {/* Pulse Rate Presets */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Repouso (60)", rate: 60 },
                    { label: "Normal (75)", rate: 75 },
                    { label: "Atividade (95)", rate: 95 },
                  ].map((preset) => (
                    <button
                      key={preset.rate}
                      onClick={() => setPulseRate(preset.rate)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-medium transition-all ${
                        pulseRate === preset.rate
                          ? "bg-[#1672eb] text-white shadow-sm font-semibold"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Floating Telemetry Chip 1: SpO2 */}
              <div className="absolute top-20 left-4 sm:left-6 bg-white/95 backdrop-blur-md p-2.5 rounded-2xl shadow-lg border border-slate-100 text-xs">
                <div className="text-[10px] text-slate-400 font-medium">Saturação O₂</div>
                <div className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                  <span>98%</span>
                  <span className="text-[9px] font-semibold text-slate-400">Normal</span>
                </div>
              </div>

              {/* Floating Telemetry Chip 2: Live Network Beds */}
              <div className="absolute top-20 right-4 sm:right-6 bg-white/95 backdrop-blur-md p-2.5 rounded-2xl shadow-lg border border-slate-100 text-xs text-right">
                <div className="text-[10px] text-slate-400 font-medium">Leitos de UTI</div>
                <div className="text-sm font-bold text-[#1672eb]">24 Livres</div>
              </div>

              {/* Bottom Instruction Pill */}
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-medium pointer-events-none shadow-md">
                Passe o cursor sobre o coração para girar em 3D
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
