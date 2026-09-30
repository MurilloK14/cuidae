"use client";

import React from "react";
import Image from "next/image";

export const Footer: React.FC = () => {
  return (
    <footer id="contato" className="bg-white border-t border-slate-100 py-16 text-slate-500 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-12 border-b border-slate-100">
          <div className="space-y-3 max-w-sm">
            <div className="relative h-9 w-32">
              <Image src="/images/cuidae-logo-trimmed.png" alt="SaúdeIA" fill className="object-contain object-left" />
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">Conectando pessoas à saúde através da inteligência artificial.</p>
          </div>
          <nav className="flex flex-wrap items-center gap-6 sm:gap-8 text-sm font-medium text-slate-600">
            <a href="#inicio" className="hover:text-[#2b85ff] transition-colors">Início</a>
            <a href="#como-funciona" className="hover:text-[#2b85ff] transition-colors">Como funciona</a>
            <a href="#hospitais" className="hover:text-[#2b85ff] transition-colors">Hospitais</a>
            <a href="#sobre-nos" className="hover:text-[#2b85ff] transition-colors">Sobre nós</a>
            <a href="#contato" className="hover:text-[#2b85ff] transition-colors">Contato</a>
          </nav>
        </div>
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>© 2026 SaúdeIA. Todos os direitos reservados.</div>
          <div className="text-slate-400">Inteligência Artificial aplicada à conexão com serviços de saúde</div>
        </div>
      </div>
    </footer>
  );
};
