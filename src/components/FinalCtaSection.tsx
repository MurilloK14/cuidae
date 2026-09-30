import React from 'react';
import { ArrowRight } from 'lucide-react';

interface FinalCtaSectionProps {
  onCtaClick?: () => void;
}

export const FinalCtaSection: React.FC<FinalCtaSectionProps> = ({ onCtaClick }) => {
  return (
    <section className="py-24 bg-slate-50">
      <div className="container mx-auto px-4 max-w-4xl text-center">
        <div className="flex flex-col items-center space-y-6">
          
          <span className="text-[#091426] font-semibold tracking-wider text-xs uppercase">
            Nosso Objetivo
          </span>
          
          <h2 className="text-3xl sm:text-4xl font-bold text-[#091426] leading-tight max-w-2xl">
            Saúde de qualidade, para todos.
          </h2>
          
          <p className="text-slate-600 text-lg leading-relaxed max-w-2xl mb-4">
            Acreditamos que a tecnologia pode aproximar pessoas, hospitais e oportunidades. Por isso, estamos construindo uma IA que trabalha ao lado dos hospitais da cidade, para que ninguém fique sem atendimento.
          </p>
          
          <button 
            onClick={onCtaClick}
            className="group inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#091426] text-white hover:bg-[#091426]/90 transition-colors font-medium text-lg shadow-lg hover:shadow-xl"
          >
            Junte-se a nós
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          
        </div>
      </div>
    </section>
  );
};
