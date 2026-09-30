"use client";

import React from "react";
import { ArrowRight, Sparkles, HeartHandshake } from "lucide-react";

interface CtaSectionProps {
  onJoinClick?: () => void;
}

export const CtaSection: React.FC<CtaSectionProps> = ({ onJoinClick }) => {
  return (
    <section id="sobre-nos" className="py-24 sm:py-32 bg-white relative overflow-hidden">
      {/* Gentle Wave Ambient Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-sky-50/40 to-blue-50/30 pointer-events-none" />

      {/* Decorative Wave SVG at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none opacity-40">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full preserve-3d"
        >
          <path
            d="M0 40C240 100 480 0 720 50C960 100 1200 20 1440 60V120H0V40Z"
            fill="#dbeafe"
          />
        </svg>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Eyebrow */}
        <div className="inline-block text-[#1672eb] text-xs sm:text-sm font-bold tracking-wider uppercase mb-3">
          NOSSO OBJETIVO
        </div>

        {/* Heading */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0c1b33] tracking-tight leading-tight mb-6">
          Saúde de qualidade, para todos.
        </h2>

        {/* Subtext */}
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto mb-10">
          Acreditamos que a tecnologia pode aproximar pessoas, hospitais e oportunidades. Por isso,
          estamos construindo uma IA que trabalha ao lado dos hospitais da cidade, para que ninguém
          fique sem atendimento.
        </p>

        {/* Button */}
        <div>
          <button
            onClick={onJoinClick}
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-[#0d1f36] hover:bg-[#162e4f] text-white text-sm sm:text-base font-medium transition-all duration-200 shadow-md hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>Junte-se a nós</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
