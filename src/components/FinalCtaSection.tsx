import React from 'react';
import { ArrowRight } from 'lucide-react';

interface FinalCtaSectionProps {
  onCtaClick?: () => void;
}

export const FinalCtaSection: React.FC<FinalCtaSectionProps> = ({ onCtaClick }) => {
  return (
    <section className="py-32 bg-gradient-to-b from-slate-100 to-slate-50 dark:from-[#0c1322] dark:to-[#090e17] transition-colors">
      <div className="container mx-auto px-4 max-w-4xl text-center">
        <div className="flex flex-col items-center space-y-8">
          
          <span className="text-[#091426] dark:text-[#38bdf8] font-bold tracking-[0.15em] text-xs uppercase mb-2">
            Nosso Objetivo
          </span>
          
          <h2 className="text-4xl sm:text-5xl font-extrabold text-[#091426] dark:text-white leading-[1.15] max-w-2xl tracking-[-0.03em]">
            Saúde de qualidade, para todos.
          </h2>
          
          <p className="text-slate-600 dark:text-slate-300 text-xl leading-relaxed max-w-2xl mb-6">
            Acreditamos que a tecnologia pode aproximar pessoas, hospitais e oportunidades. Por isso, estamos construindo uma IA que trabalha ao lado dos hospitais da cidade, para que ninguém fique sem atendimento.
          </p>
          
          <button 
            onClick={onCtaClick}
            className="group inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#091426] dark:bg-[#2b85ff] text-white hover:bg-[#1a2c4e] dark:hover:bg-[#1d6fd6] transition-all duration-300 font-medium text-lg shadow-[0_8px_20px_-8px_rgba(9,20,38,0.5)] dark:shadow-[0_8px_20px_-8px_rgba(43,133,255,0.4)] hover:-translate-y-0.5"
          >
            Junte-se a nós
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          
        </div>
      </div>
    </section>
  );
};
