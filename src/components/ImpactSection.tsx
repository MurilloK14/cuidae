import React from 'react';
import { Building2, Users, Clock, ShieldCheck, ArrowRight } from 'lucide-react';

export const ImpactSection: React.FC = () => {
  const stats = [
    {
      icon: <Building2 className="w-5 h-5 text-[#0ea5e9]" />,
      label: "Hospitais parceiros",
      value: "+8",
      description: "Já conectados à plataforma"
    },
    {
      icon: <Users className="w-5 h-5 text-[#0ea5e9]" />,
      label: "Atendimentos mensais",
      value: "+12.000",
      description: "E crescendo todos os dias"
    },
    {
      icon: <Clock className="w-5 h-5 text-[#0ea5e9]" />,
      label: "Tempo de espera",
      value: "-60%",
      description: "Com a IA e a integração dos sistemas"
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-[#0ea5e9]" />,
      label: "Mais saúde para",
      value: "100%",
      description: "Da nossa comunidade"
    }
  ];

  return (
    <section className="py-24 bg-[#091426] text-white">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">
          
          {/* Left Content */}
          <div className="w-full lg:w-1/3 flex flex-col space-y-6">
            <div>
              <span className="text-[#0ea5e9] font-semibold tracking-wider text-xs uppercase">
                Impacto Real
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold mt-3 leading-tight text-white whitespace-pre-line">
                {"Tecnologia que\nfaz a diferença"}
              </h2>
            </div>
            
            <p className="text-slate-300 text-lg leading-relaxed">
              Estamos construindo um futuro onde a saúde é mais acessível, rápida e eficiente para todos os moradores da nossa cidade.
            </p>
            
            <div>
              <button className="group inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/30 text-white hover:bg-white/10 transition-colors font-medium">
                Conheça nosso propósito
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Right Content - Stats Grid */}
          <div className="w-full lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 flex flex-col items-start"
              >
                <div className="p-3 bg-white/[0.05] rounded-xl mb-6">
                  {stat.icon}
                </div>
                <div className="text-slate-400 text-sm mb-1">{stat.label}</div>
                <div className="text-4xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-slate-400 text-sm">{stat.description}</div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};
