"use client";

import React from "react";
import Image from "next/image";

export const Footer: React.FC = () => {
  return (
    <footer id="contato" className="bg-white dark:bg-[#090e17] border-t border-slate-100 dark:border-slate-800 py-20 text-slate-500 dark:text-slate-400 text-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-10 pb-12 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-4 max-w-sm">
            <div className="relative h-9 w-32">
              <Image src="/images/cuidae-logo-trimmed.png" alt="Cuidaê" fill className="object-contain object-left dark:brightness-110" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[15px] leading-relaxed">Conectando cidadãos aos serviços de saúde pública de forma rápida, simples e acolhedora.</p>
          </div>
          <nav className="flex flex-wrap items-center gap-6 sm:gap-8 text-[15px] font-medium text-slate-600 dark:text-slate-300">
            <a href="#inicio" className="hover:text-[#2b85ff] dark:hover:text-[#38bdf8] transition-colors duration-200">Início</a>
            <a href="#como-funciona" className="hover:text-[#2b85ff] dark:hover:text-[#38bdf8] transition-colors duration-200">Como funciona</a>
            <a href="#hospitais" className="hover:text-[#2b85ff] dark:hover:text-[#38bdf8] transition-colors duration-200">Hospitais</a>
            <a href="#nossa-missao" className="hover:text-[#2b85ff] dark:hover:text-[#38bdf8] transition-colors duration-200">Sobre nós</a>
            <a href="#contato" className="hover:text-[#2b85ff] dark:hover:text-[#38bdf8] transition-colors duration-200">Contato</a>
          </nav>
        </div>
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400 dark:text-slate-500">
          <div>© 2026 Cuidaê. Todos os direitos reservados.</div>
          <div>Tecnologia acolhedora aplicada à orientação em saúde pública</div>
        </div>
      </div>
    </footer>
  );
};
