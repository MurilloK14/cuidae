"use client";

import React from "react";
import Image from "next/image";

export const Footer: React.FC = () => {
  return (
    <footer id="contato" className="bg-white border-t border-slate-100 py-20 text-slate-500 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-10 pb-12 border-b border-slate-100">
          <div className="space-y-4 max-w-sm">
            <div className="relative h-9 w-32">
              <Image src="/images/cuidae-logo-trimmed.png" alt="Cuidaê" fill className="object-contain object-left" />
            </div>
            <p className="text-slate-500 text-[15px] leading-relaxed">Conectando cidadãos aos serviços de saúde pública de forma rápida, simples e acolhedora.</p>
          </div>
          <nav className="flex flex-wrap items-center gap-6 sm:gap-8 text-[15px] font-medium text-slate-600">
            <a href="#inicio" className="hover:text-[#2b85ff] transition-colors duration-200">Início</a>
            <a href="#como-funciona" className="hover:text-[#2b85ff] transition-colors duration-200">Como funciona</a>
            <a href="#hospitais" className="hover:text-[#2b85ff] transition-colors duration-200">Hospitais</a>
            <a href="#nossa-missao" className="hover:text-[#2b85ff] transition-colors duration-200">Sobre nós</a>
            <a href="#contato" className="hover:text-[#2b85ff] transition-colors duration-200">Contato</a>
          </nav>
        </div>
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <div>© 2026 Cuidaê. Todos os direitos reservados.</div>
          <div className="text-slate-400">Tecnologia acolhedora aplicada à orientação em saúde pública</div>
        </div>
      </div>
    </footer>
  );
};
