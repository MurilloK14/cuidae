"use client";

import React from "react";
import Image from "next/image";
import { MapPin, ArrowRight } from "lucide-react";

interface HospitalsSectionProps {
  onSelectHospital?: (hospitalName: string) => void;
}

export const HospitalsSection: React.FC<HospitalsSectionProps> = ({ onSelectHospital }) => {
  const hospitals = [
    {
      name: "Hospital Municipal (Exemplo)",
      image: "/images/hospital_1.jpg",
      distance: "2,3 km",
      specialties: "Pronto atendimento, Clínica Geral, Pediatria e Triagem",
      status: "Atendimento disponível",
    },
    {
      name: "Hospital São Lucas (Exemplo)",
      image: "/images/hospital_2.jpg",
      distance: "4,7 km",
      specialties: "Cardiologia, Ortopedia, Exames de Imagem e Laboratório",
      status: "Consultas e exames",
    },
    {
      name: "Hospital Vida (Exemplo)",
      image: "/images/hospital_3.jpg",
      distance: "1,1 km",
      specialties: "Especialidades Cirúrgicas, UTI e Centro de Diagnóstico",
      status: "Atendimento normal",
    },
  ];

  return (
    <section id="hospitais" className="py-24 sm:py-32 bg-white relative overflow-hidden">
      {/* Stylized Map Grid in Background */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <svg
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
        >
          <defs>
            <pattern
              id="hospital-map-grid"
              width="80"
              height="80"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 80 0 L 0 0 0 80"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="1"
              />
              <circle cx="80" cy="0" r="1.5" fill="#cbd5e1" />
              <circle cx="0" cy="80" r="1.5" fill="#cbd5e1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hospital-map-grid)" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mb-16 text-left">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#091426] tracking-[-0.03em] leading-tight">
            Uma rede conectada à sua cidade.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            A Cuidae aproxima você dos hospitais e serviços de saúde disponíveis na sua região.
          </p>
        </div>

        {/* Hospital Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {hospitals.map((hospital, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.05)] hover:border-slate-200 transition-all duration-300 flex flex-col group"
            >
              {/* Image Frame */}
              <div className="relative w-full aspect-[16/10] bg-slate-100 overflow-hidden">
                <Image
                  src={hospital.image}
                  alt={hospital.name}
                  fill
                  className="object-cover group-hover:scale-103 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                {/* Distance Badge */}
                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-semibold text-slate-800 shadow-sm flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#2b85ff]" />
                  <span className="tabular-nums">{hospital.distance}</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  {/* Status Indicator */}
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{hospital.status}</span>
                  </div>

                  {/* Hospital Name */}
                  <h3 className="text-lg font-bold text-[#091426] leading-snug">
                    {hospital.name}
                  </h3>

                  {/* Specialties */}
                  <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed font-normal">
                    <strong className="font-semibold text-slate-700">Especialidades:</strong>{" "}
                    {hospital.specialties}
                  </p>
                </div>

                {/* Button "Ver hospital" */}
                <div className="pt-2 border-t border-slate-50">
                  <button
                    onClick={() => onSelectHospital?.(hospital.name)}
                    className="w-full py-2.5 px-4 rounded-full bg-slate-50 hover:bg-[#edf4ff] text-slate-800 hover:text-[#2b85ff] text-xs font-semibold transition-colors flex items-center justify-center gap-2 border border-slate-100 hover:border-[#d8e8ff] active:scale-98"
                  >
                    <span>Ver hospital</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Clear Disclaimer Note */}
        <div className="mt-12 text-center text-xs text-slate-400">
          * Nomes e imagens representam hospitais parceiros e são exibidos para fins demonstrativos.
        </div>
      </div>
    </section>
  );
};
