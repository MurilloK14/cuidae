"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  Network,
  ClipboardList,
  Heart,
  Building2,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  ChevronDown,
  Stethoscope,
  Activity,
  UserCheck
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ConsultationModal } from "@/components/ConsultationModal";

export default function ComoFuncionaPage() {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantPrompt, setAssistantPrompt] = useState<string | undefined>(undefined);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleOpenAssistant = (prompt?: string) => {
    setAssistantPrompt(prompt);
    setIsAssistantOpen(true);
  };

  const handleCloseAssistant = () => {
    setIsAssistantOpen(false);
    setAssistantPrompt(undefined);
  };

  const stepsDetails = [
    {
      num: "01",
      badge: "Passo 1 • Entrada do Paciente",
      title: "Você relata o que está sentindo com suas próprias palavras",
      desc: "Nossa inteligência artificial foi treinada para entender linguagem natural do dia a dia. Você não precisa saber termos médicos ou diagnósticos prévios.",
      bullets: [
        "Perguntas clínicas objetivas sobre dor, febre e duração dos sintomas",
        "Triagem orientada em menos de 2 minutos pelo celular ou computador",
        "Ambiente privado e seguro, com total sigilo médico e em conformidade com a LGPD",
        "Orientação sem burocracia ou formulários complexos"
      ],
      icon: Search,
      tagColor: "bg-blue-50 text-[#2b85ff] border-[#2b85ff]/20"
    },
    {
      num: "02",
      badge: "Passo 2 • Rede Municipal",
      title: "Cruzamento automático com a rede municipal de saúde",
      desc: "A inteligência artificial analisa a proximidade da sua casa e cruza com a estrutura de atendimento disponível na rede pública.",
      bullets: [
        "Mapeamento de Postos de Saúde (UBSs locais como UBS Jardim Saúde e UBS Vila Mariana)",
        "UPAs 24 Horas com plantão clínico e exames rápidos (ex: UPA 24h Vergueiro)",
        "Hospitais municipais de referência para urgências de alta complexidade",
        "Cálculo de distância, estimativa de tempo e melhores rotas de deslocamento"
      ],
      icon: Network,
      tagColor: "bg-purple-50 text-purple-600 border-purple-200"
    },
    {
      num: "03",
      badge: "Passo 3 • Classificação Clínica",
      title: "Classificação precisa de urgência pelo Protocolo Manchester",
      desc: "Evite ir ao pronto-socorro para casos leves e nunca demore para buscar socorro em situações de risco. A IA aplica critérios de triagem médica padronizados.",
      bullets: [
        "Verde (Não Urgente): Consultas de rotina e acompanhamento na UBS do bairro",
        "Amarelo (Urgência Moderada): Sintomas agudos avaliados em UBS ou teleconsulta",
        "Vermelho / Laranja (Emergência): Direcionamento imediato para UPA 24h ou SAMU 192",
        "Evita que você passe horas na recepção de um pronto-socorro lotado à toa"
      ],
      icon: ClipboardList,
      tagColor: "bg-amber-50 text-amber-600 border-amber-200"
    },
    {
      num: "04",
      badge: "Passo 4 • Direcionamento Final",
      title: "Atendimento ágil, rota traçada e resumo pronto para o médico",
      desc: "Você recebe instruções claras sobre onde ir, o que levar (Cartão SUS, documento com foto) e um resumo da sua pré-triagem para apresentar na recepção.",
      bullets: [
        "Rota calculada a pé ou de transporte com um toque no mapa",
        "Resumo estruturado dos sintomas para facilitar o acolhimento pela equipe de enfermagem",
        "Possibilidade de agendamento ou encaminhamento para telemedicina",
        "Acompanhamento contínuo da sua saúde no histórico da plataforma"
      ],
      icon: Heart,
      tagColor: "bg-emerald-50 text-emerald-600 border-emerald-200"
    }
  ];

  const faqs = [
    {
      q: "A triagem com IA substitui uma consulta médica presencial?",
      a: "Não. A SaúdeIA atua como uma ferramenta inteligente de triagem, orientação e encaminhamento ao serviço adequado do SUS (UBS, UPA ou Hospital), nunca substituindo o diagnóstico clínico ou prescrição definitiva de um médico."
    },
    {
      q: "Preciso pagar alguma coisa para usar a plataforma?",
      a: "A triagem básica com inteligência artificial, o mapeamento das unidades públicas locais e a orientação de cuidados são 100% gratuitos para todos os cidadãos."
    },
    {
      q: "Como o sistema sabe qual unidade está mais próxima de mim?",
      a: "Ao iniciar a triagem, você pode permitir a geolocalização do navegador ou informar seu CEP/bairro. O sistema consulta as bases integradas de UBSs e UPAs municipais para listar as unidades ativas mais convenientes."
    },
    {
      q: "Meus dados de saúde estão protegidos?",
      a: "Sim. Toda a plataforma opera em conformidade rigorosa com a Lei Geral de Proteção de Dados (LGPD) e padrões de segurança em saúde digital. Seus relatos são criptografados de ponta a ponta e nunca comercializados."
    },
    {
      q: "O que devo levar ao posto de saúde após receber a recomendação?",
      a: "Recomendamos levar um documento oficial com foto (RG ou CNH), seu Cartão Nacional de Saúde (Cartão SUS) ou CPF, e comprovante de endereço caso seja seu primeiro atendimento na UBS."
    }
  ];

  return (
    <main className="min-h-screen bg-white text-slate-900 selection:bg-[#2b85ff] selection:text-white pt-20">
      <Navbar onOpenAssistant={handleOpenAssistant} />

      {/* Hero Section of /como-funciona */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-slate-50 via-[#f0f6ff]/40 to-white relative overflow-hidden border-b border-slate-100">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#2b85ff]/10 rounded-full blur-[100px] pointer-events-none -z-10" />
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#2b85ff]/10 border border-[#2b85ff]/20 text-[#2b85ff] text-xs font-bold tracking-wider mb-6 shadow-sm">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>GUIA COMPLETO DE FUNCIONAMENTO</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#091426] tracking-tight leading-tight">
            Como a IA conecta seus sintomas <br className="hidden sm:inline" />
            ao atendimento certo no SUS.
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Entenda detalhadamente cada etapa da nossa inteligência artificial: desde a descrição dos seus sintomas até a chegada à UBS ou UPA mais indicada.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/triagem"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#091426] hover:bg-[#1a2c4e] text-white text-sm font-semibold transition-all shadow-md hover:shadow-lg"
            >
              <span>Iniciar Triagem Gratuita</span>
              <ArrowRight className="w-4 h-4 text-[#2b85ff]" />
            </Link>

            <button
              type="button"
              onClick={() => handleOpenAssistant("Gostaria de tirar dúvidas sobre o funcionamento da triagem.")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold transition-all shadow-sm"
            >
              <Stethoscope className="w-4 h-4 text-[#2b85ff]" />
              <span>Falar com a IA</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4 Steps In-Depth */}
      <section className="py-16 sm:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-16 sm:space-y-20">
          {stepsDetails.map((step, idx) => {
            const Icon = step.icon;
            const isEven = idx % 2 === 1;

            return (
              <div
                key={step.num}
                className={`flex flex-col ${isEven ? "lg:flex-row-reverse" : "lg:flex-row"} gap-8 lg:gap-14 items-center`}
              >
                {/* Left/Right Text Side */}
                <div className="flex-1 text-left space-y-4">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${step.tagColor}`}>
                    <span>{step.badge}</span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#091426] leading-tight">
                    {step.title}
                  </h2>

                  <p className="text-slate-600 text-base leading-relaxed">
                    {step.desc}
                  </p>

                  <div className="pt-2 space-y-2.5">
                    {step.bullets.map((b, bIdx) => (
                      <div key={bIdx} className="flex items-start gap-2.5 text-sm text-slate-700 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Visual Card Side */}
                <div className="w-full lg:w-[460px] bg-gradient-to-br from-slate-50 to-blue-50/40 p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden">
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-md border border-slate-100 flex items-center justify-center text-[#2b85ff] mb-6">
                    <Icon className="w-7 h-7" />
                  </div>

                  <div className="text-4xl font-black text-slate-300 mb-2">
                    {step.num}
                  </div>

                  <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-left">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">Status da Etapa:</span>
                      <span className="font-bold text-[#2b85ff] bg-blue-50 px-2 py-0.5 rounded">
                        Processamento Ativo
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 leading-snug">
                      Inteligência clínica conectada com bancos de dados municipais de saúde pública.
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-24 bg-slate-50/70 border-t border-slate-200/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200/60 text-slate-700 text-xs font-bold mb-3">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>DÚVIDAS FREQUENTES</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#091426]">
              Perguntas comuns sobre a nossa triagem
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, fIdx) => {
              const isOpen = openFaq === fIdx;

              return (
                <div
                  key={fIdx}
                  className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden transition-all shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : fIdx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-slate-900 text-sm sm:text-base hover:text-[#2b85ff] transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-[#2b85ff]" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="py-16 bg-[#091426] text-white text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-4">
            Pronto para experimentar a triagem?
          </h2>
          <p className="text-slate-300 text-sm sm:text-base mb-8 max-w-xl mx-auto">
            Leva menos de 2 minutos e é 100% gratuito. Receba a melhor recomendação para sua saúde agora mesmo.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/triagem"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#2b85ff] hover:bg-blue-600 text-white text-sm font-bold transition-all shadow-lg hover:shadow-xl"
            >
              <span>Começar Triagem Online</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all border border-white/10"
            >
              <span>Voltar para a Página Inicial</span>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      <ConsultationModal isOpen={isAssistantOpen} onClose={handleCloseAssistant} initialPrompt={assistantPrompt} />
    </main>
  );
}
