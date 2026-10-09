"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  ArrowRight,
  Clock,
  Phone,
  ShieldCheck,
  Stethoscope,
  Activity,
  Building2,
  ExternalLink,
  Search
} from "lucide-react";

interface HospitalsSectionProps {
  onSelectHospital?: (hospitalName: string) => void;
}

type CategoryFilter = "todos" | "ubs" | "upa" | "hospital";

export const HospitalsSection: React.FC<HospitalsSectionProps> = ({ onSelectHospital }) => {
  const [filter, setFilter] = useState<CategoryFilter>("todos");
  const [searchQuery, setSearchQuery] = useState("");

  const healthUnits = [
    {
      id: "ubs-jardim-saude",
      name: "UBS Jardim Saúde",
      typeLabel: "UBS • Unidade Básica de Saúde",
      typeCategory: "ubs" as CategoryFilter,
      image: "/images/hospital_1.jpg",
      distance: "800 m",
      address: "Av. do Cursino, 1420 — Saúde, São Paulo - SP",
      phone: "(11) 5058-2341",
      schedule: "Segunda a Sexta: 07h às 19h",
      status: "Atendimento Normal",
      statusColor: "emerald",
      badge: "SUS • 100% Gratuito",
      specialties: [
        "Clínica Geral",
        "Pediatria",
        "Campanha de Vacinação",
        "Pré-natal e Saúde da Mulher",
        "Retirada de Medicamentos"
      ],
      mapsUrl: "https://maps.google.com/?q=UBS+Jardim+Saude+Sao+Paulo"
    },
    {
      id: "upa-24h-centro",
      name: "UPA 24h Vergueiro / Centro",
      typeLabel: "UPA • Pronto Atendimento 24h",
      typeCategory: "upa" as CategoryFilter,
      image: "/images/hospital_2.jpg",
      distance: "2,1 km",
      address: "Rua Vergueiro, 900 — Liberdade / Centro, São Paulo - SP",
      phone: "(11) 3277-8500",
      schedule: "Plantão 24 Horas Ininterrupto",
      status: "Plantão Aberto 24h",
      statusColor: "emerald",
      badge: "Urgência & Emergência",
      specialties: [
        "Pronto-Socorro Adulto e Pediátrico",
        "Raio-X Digital e Eletrocardiograma",
        "Suturas e Pequenas Cirurgias",
        "Medicação e Hidratação Venosa",
        "Triagem com Classificação de Risco"
      ],
      mapsUrl: "https://maps.google.com/?q=UPA+Vergueiro+Sao+Paulo"
    },
    {
      id: "ubs-vila-mariana",
      name: "UBS Vila Mariana",
      typeLabel: "UBS • Estratégia Saúde da Família",
      typeCategory: "ubs" as CategoryFilter,
      image: "/images/hospital_3.jpg",
      distance: "3,2 km",
      address: "Rua Domingos de Morais, 2564 — Vila Mariana, São Paulo - SP",
      phone: "(11) 5573-1922",
      schedule: "Segunda a Sexta: 07h às 19h",
      status: "Atendimento Normal",
      statusColor: "emerald",
      badge: "Atenção Primária",
      specialties: [
        "Odontologia e Saúde Bucal",
        "Coleta de Exames Laboratoriais",
        "Acompanhamento de Hipertensos e Diabéticos",
        "Saúde Mental e Acolhimento",
        "Vacinação Infantil e Adulto"
      ],
      mapsUrl: "https://maps.google.com/?q=UBS+Vila+Mariana+Sao+Paulo"
    },
    {
      id: "hospital-municipal-jabaquara",
      name: "Hospital Municipal Dr. Arthur R. de Saboya",
      typeLabel: "Hospital Municipal de Referência",
      typeCategory: "hospital" as CategoryFilter,
      image: "/images/hospital_1.jpg",
      distance: "4,8 km",
      address: "Av. Francisco de Paula Q. Ribeiro, 280 — Jabaquara, São Paulo - SP",
      phone: "(11) 3394-8400",
      schedule: "Pronto-Socorro 24 Horas",
      status: "Pronto-Socorro Aberto",
      statusColor: "emerald",
      badge: "Alta Complexidade SUS",
      specialties: [
        "Pronto-Socorro de Traumatologia e Cirurgia",
        "Ortopedia e Neurologia de Urgência",
        "Centro Cirúrgico e Leitos de UTI",
        "Tomografia Computadorizada",
        "Internação Hospitalar"
      ],
      mapsUrl: "https://maps.google.com/?q=Hospital+Municipal+Arthur+Ribeiro+de+Saboya"
    }
  ];

  const filteredUnits = healthUnits.filter((unit) => {
    const matchesCategory = filter === "todos" || unit.typeCategory === filter;
    const matchesSearch =
      unit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.specialties.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <section id="hospitais" className="py-24 sm:py-32 bg-slate-50/70 relative overflow-hidden border-y border-slate-100">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <defs>
            <pattern id="ubs-map-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#e2e8f0" strokeWidth="1" />
              <circle cx="60" cy="0" r="1.5" fill="#cbd5e1" />
              <circle cx="0" cy="60" r="1.5" fill="#cbd5e1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#ubs-map-grid)" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2b85ff]/10 text-[#2b85ff] text-xs font-bold tracking-wider mb-4">
              <Building2 className="w-3.5 h-3.5" />
              REDE DE ATENDIMENTO INTEGRADA
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#091426] tracking-[-0.03em] leading-tight">
              Postos de Saúde, UPAs e Hospitais da sua região.
            </h2>
            <p className="mt-3 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              A SaúdeIA mapeia as Unidades Básicas de Saúde (UBS), prontos-atendimentos 24h e hospitais municipais para orientar você ao local correto conforme a gravidade dos seus sintomas.
            </p>
          </div>

          <Link
            href="/triagem"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#091426] hover:bg-[#1a2c4e] text-white text-sm font-medium transition-all duration-300 shadow-md hover:shadow-lg shrink-0 self-start md:self-auto"
          >
            <Stethoscope className="w-4 h-4 text-[#2b85ff]" />
            <span>Fazer Triagem e Ver Encaminhamento</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-10 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: "todos", label: "Todos os locais" },
              { id: "ubs", label: "Postos de Saúde (UBS)" },
              { id: "upa", label: "Prontos-Socorros (UPA 24h)" },
              { id: "hospital", label: "Hospitais Municipais" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as CategoryFilter)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                  filter === tab.id
                    ? "bg-[#091426] text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Quick Search Input */}
          <div className="relative min-w-[240px] sm:max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por bairro, especialidade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2b85ff] focus:bg-white text-slate-800 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Health Units Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredUnits.map((unit) => (
            <div
              key={unit.id}
              className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] hover:border-slate-300 transition-all duration-300 flex flex-col group"
            >
              {/* Photo & Distance Tag */}
              <div className="relative w-full aspect-[16/10] bg-slate-100 overflow-hidden">
                <Image
                  src={unit.image}
                  alt={unit.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

                {/* Distance Badge */}
                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-slate-800 shadow-sm flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#2b85ff]" />
                  <span>{unit.distance}</span>
                </div>

                {/* Classification Badge */}
                <div className="absolute bottom-3 left-3 bg-[#091426]/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-semibold text-white shadow-sm flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>{unit.badge}</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  {/* Status Indicator */}
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{unit.status}</span>
                  </div>

                  {/* Unit Name */}
                  <h3 className="text-base sm:text-lg font-bold text-[#091426] leading-snug group-hover:text-[#2b85ff] transition-colors">
                    {unit.name}
                  </h3>

                  {/* Type Label */}
                  <p className="text-xs font-medium text-slate-500 mt-0.5">
                    {unit.typeLabel}
                  </p>

                  {/* Address */}
                  <p className="mt-3 text-xs text-slate-600 flex items-start gap-1.5 leading-relaxed">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{unit.address}</span>
                  </p>

                  {/* Schedule */}
                  <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{unit.schedule}</span>
                  </p>

                  {/* Phone */}
                  <p className="mt-1 text-xs text-slate-500 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{unit.phone}</span>
                  </p>

                  {/* Specialties Pills */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Serviços Principais:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {unit.specialties.map((spec, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <a
                    href={unit.mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-50 hover:bg-[#edf4ff] text-slate-700 hover:text-[#2b85ff] text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-slate-200 hover:border-[#2b85ff]"
                  >
                    <span>Como Chegar</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    onClick={() => onSelectHospital?.(unit.name)}
                    className="py-2 px-3 rounded-xl bg-[#091426] hover:bg-[#1a2c4e] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                  >
                    <span>Ver</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Notice */}
        <div className="mt-12 bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-[#2b85ff] flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                Não sabe se deve ir a uma UBS ou UPA?
              </p>
              <p className="text-xs text-slate-500">
                Inicie uma triagem inteligente em 2 minutos para receber o encaminhamento clínico recomendado.
              </p>
            </div>
          </div>

          <Link
            href="/triagem"
            className="px-5 py-2.5 rounded-full bg-[#2b85ff] hover:bg-[#1a70e0] text-white text-xs font-bold transition-all shadow-sm shrink-0 flex items-center gap-1.5"
          >
            <span>Iniciar Triagem Grátis</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
};
