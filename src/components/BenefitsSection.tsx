"use client";

import React from "react";
import { Search, Layers, Clock, Heart } from "lucide-react";

export const BenefitsSection: React.FC = () => {
  const benefits = [
    {
      title: "Encontre atendimento",
      description: "Descubra onde encontrar o serviço que você precisa.",
      icon: Search,
    },
    {
      title: "Informação centralizada",
      description: "Tenha informações dos hospitais em um só lugar.",
      icon: Layers,
    },
    {
      title: "Atendimento mais rápido",
      description: "Reduza o tempo procurando onde ser atendido.",
      icon: Clock,
    },
    {
      title: "Saúde mais acessível",
      description: "Tecnologia trabalhando para aproximar pessoas e serviços de saúde.",
      icon: Heart,
    },
  ];

  return (
    <section className="py-24 sm:py-32 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-16 text-left">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#091426] tracking-[-0.03em] leading-tight">
            Menos burocracia. Mais acesso.
          </h2>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-8 rounded-3xl bg-white border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:border-slate-200 hover:shadow-[0_10px_30px_rgba(0,0,0,0.04)] transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Minimalist Icon */}
                  <div className="w-11 h-11 rounded-2xl bg-slate-50 text-[#091426] flex items-center justify-center mb-6">
                    <Icon className="w-5 h-5 stroke-[1.8]" />
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-[#091426] mb-3 leading-snug">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-slate-600 leading-relaxed font-normal">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
