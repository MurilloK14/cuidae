import React from 'react';
import { Search, Network, ClipboardList, Heart, Building2, ChevronRight, MapPin, User } from 'lucide-react';

interface HowItWorksProps {
  onOpenAssistant?: (prompt?: string) => void;
}

export function HowItWorks({ onOpenAssistant }: HowItWorksProps) {
  return (
    <section className="py-20 bg-white" id="como-funciona">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left Side Content */}
          <div className="w-full lg:w-1/2 space-y-8">
            <div className="mb-12">
              <span className="text-xs font-semibold tracking-wider text-[#091426] uppercase flex items-center gap-1 mb-6">
                SIMPLES, <span className="text-[#0ea5e9]">RÁPIDO</span> E EFICIENTE
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#091426] tracking-[-0.02em] mb-4">
                Como funciona?
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed max-w-lg">
                Nossa IA se conecta diretamente com os sistemas dos hospitais da cidade, reunindo informações em tempo real para te oferecer o melhor atendimento.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
              {/* Step 1 */}
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-full border-2 border-[#0ea5e9]/20 flex items-center justify-center text-[#0ea5e9]">
                  <Search size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-[#091426] text-sm">1. Você informa o que precisa</h3>
                  <p className="text-sm text-gray-500 mt-1">Pode ser uma consulta, um exame, um leito ou uma orientação.</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-full border-2 border-[#0ea5e9]/20 flex items-center justify-center text-[#0ea5e9]">
                  <Network size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-[#091426] text-sm">2. A IA busca nos hospitais</h3>
                  <p className="text-sm text-gray-500 mt-1">Ela consulta os sistemas dos hospitais da cidade e encontra as melhores opções para você.</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-full border-2 border-[#0ea5e9]/20 flex items-center justify-center text-[#0ea5e9]">
                  <ClipboardList size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-[#091426] text-sm">3. Você recebe a melhor opção</h3>
                  <p className="text-sm text-gray-500 mt-1">Com base na sua necessidade, a IA indica os hospitais, horários e serviços disponíveis.</p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-full border-2 border-[#0ea5e9]/20 flex items-center justify-center text-[#0ea5e9]">
                  <Heart size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-[#091426] text-sm">4. Você é atendido</h3>
                  <p className="text-sm text-gray-500 mt-1">É só confirmar e seguir para o atendimento, com todo o suporte da nossa plataforma.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Phone Mockup */}
          <div className="w-full lg:w-1/2 relative flex justify-center items-center mt-12 lg:mt-0">
            <style>{`
              @keyframes float-gentle {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-12px); }
              }
              .animate-float-gentle {
                animation: float-gentle 6s ease-in-out infinite;
              }
            `}</style>

            {/* Background decoration */}
            <div className="absolute w-[120%] h-[120%] bg-gradient-to-tr from-[#0ea5e9]/5 to-transparent rounded-full blur-3xl -z-10" />

            <div className="relative w-full max-w-[320px] animate-float-gentle">
              {/* Floating Cards */}
              <div className="absolute -left-4 sm:-left-32 top-10 z-20 bg-white p-3 rounded-xl shadow-[0_12px_24px_-8px_rgba(0,0,0,0.15)] border border-gray-100 animate-[bounce_4s_ease-in-out_infinite]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-[#091426]">Hospital Municipal</div>
                    <div className="text-[10px] text-gray-500">2,3 km • Pronto atendimento</div>
                  </div>
                </div>
              </div>

              <div className="absolute -left-2 sm:-left-24 bottom-24 z-20 bg-white p-3 rounded-xl shadow-[0_12px_24px_-8px_rgba(0,0,0,0.15)] border border-gray-100 animate-[bounce_5s_ease-in-out_infinite_reverse]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-[#091426]">Hospital São Lucas</div>
                    <div className="text-[10px] text-gray-500">4,7 km • Exames</div>
                  </div>
                </div>
              </div>

              <div className="absolute -right-4 sm:-right-20 top-1/2 -translate-y-1/2 z-20 bg-white p-3 rounded-xl shadow-[0_12px_24px_-8px_rgba(0,0,0,0.15)] border border-gray-100 animate-[bounce_4.5s_ease-in-out_infinite]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-[#091426]">Hospital Vida</div>
                    <div className="text-[10px] text-gray-500">1,1 km • UTI, Internação</div>
                  </div>
                </div>
              </div>

              {/* Phone Frame */}
              <div className="relative rounded-[2.5rem] bg-gray-900 p-3 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.25)] border-gray-800 border-4">
                {/* Phone Notch */}
                <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-10">
                  <div className="w-1/3 h-full bg-gray-900 rounded-b-xl"></div>
                </div>

                {/* Phone Screen */}
                <div className="bg-gray-50 rounded-[2rem] overflow-hidden w-full aspect-[9/19] flex flex-col pt-6 relative">
                  {/* App Header */}
                  <div className="px-5 py-4 bg-white flex justify-between items-center shadow-sm z-0">
                    <div className="font-bold text-lg text-[#091426]">SaúdeIA</div>
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                      <User size={16} />
                    </div>
                  </div>

                  <div className="p-5 flex-1 space-y-6">
                    {/* Greeting */}
                    <div>
                      <h2 className="text-xl font-bold text-[#091426]">Olá, Maria!</h2>
                      <p className="text-sm text-gray-500 mt-1">Como podemos te ajudar hoje?</p>
                    </div>

                    {/* Search Bar */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex items-center gap-2 cursor-pointer hover:border-gray-200 transition-colors" onClick={() => onOpenAssistant?.()}>
                      <Search size={18} className="text-gray-400" />
                      <span className="text-sm text-gray-400">Digite o que você precisa...</span>
                    </div>

                    {/* Menu Options */}
                    <div className="space-y-3">
                      {[
                        'Agendar consulta',
                        'Consultar exames',
                        'Verificar leitos',
                        'Falar com um hospital'
                      ].map((option, idx) => (
                        <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex justify-between items-center cursor-pointer hover:border-[#0ea5e9]/30 transition-colors" onClick={() => onOpenAssistant?.(option)}>
                          <span className="text-sm font-medium text-[#091426]">{option}</span>
                          <ChevronRight size={16} className="text-gray-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
