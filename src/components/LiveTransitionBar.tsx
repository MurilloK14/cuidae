"use client";

import React from "react";
import { Activity, Zap, MapPin, ShieldCheck, Stethoscope } from "lucide-react";

export const LiveTransitionBar: React.FC = () => {
  return (
    <div className="w-full relative z-20 py-4 bg-[#091426] text-white border-y border-slate-800 shadow-xl overflow-hidden">
      {/* Subtle Glowing Background Accent */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-[#2b85ff]/20 to-blue-600/10 pointer-events-none" />
      <div className="absolute -top-12 left-1/4 w-96 h-24 bg-[#2b85ff]/25 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 items-center">
          
          {/* Metric 1 */}
          <div className="flex items-center gap-3 p-2 rounded-xl transition-all hover:bg-white/5">
            <div className="w-10 h-10 rounded-xl bg-[#2b85ff]/20 border border-[#2b85ff]/30 flex items-center justify-center text-[#2b85ff] shrink-0">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-base font-extrabold text-white tracking-tight">&lt; 2 min</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium leading-tight">
                Triagem rápida e orientada
              </p>
            </div>
          </div>

          {/* Metric 2 */}
          <div className="flex items-center gap-3 p-2 rounded-xl transition-all hover:bg-white/5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm sm:text-base font-extrabold text-white tracking-tight">UBSs & UPAs</span>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium leading-tight">
                Rede municipal integrada
              </p>
            </div>
          </div>

          {/* Metric 3 */}
          <div className="flex items-center gap-3 p-2 rounded-xl transition-all hover:bg-white/5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-[#2b85ff] shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm sm:text-base font-extrabold text-white tracking-tight">Geolocalização</span>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium leading-tight">
                Unidade mais próxima de você
              </p>
            </div>
          </div>

          {/* Metric 4 */}
          <div className="flex items-center gap-3 p-2 rounded-xl transition-all hover:bg-white/5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm sm:text-base font-extrabold text-white tracking-tight">100% Gratuito</span>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium leading-tight">
                Privacidade & LGPD garantidos
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
