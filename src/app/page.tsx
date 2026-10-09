"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { LiveTransitionBar } from "@/components/LiveTransitionBar";
import { HowItWorks } from "@/components/HowItWorks";
import { BenefitsSection } from "@/components/BenefitsSection";
import { HospitalsSection } from "@/components/HospitalsSection";
import { MissionSection } from "@/components/MissionSection";
import { ImpactSection } from "@/components/ImpactSection";
import { FinalCtaSection } from "@/components/FinalCtaSection";
import { Footer } from "@/components/Footer";
import { ConsultationModal } from "@/components/ConsultationModal";

export default function Home() {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantPrompt, setAssistantPrompt] = useState<string | undefined>(undefined);

  const handleOpenAssistant = (prompt?: string) => {
    setAssistantPrompt(prompt);
    setIsAssistantOpen(true);
  };

  const handleCloseAssistant = () => {
    setIsAssistantOpen(false);
    setAssistantPrompt(undefined);
  };

  return (
    <main className="min-h-screen bg-white text-slate-900 selection:bg-[#2b85ff] selection:text-white">
      <Navbar onOpenAssistant={handleOpenAssistant} />
      <Hero onOpenAssistant={handleOpenAssistant} />
      <LiveTransitionBar />
      <HowItWorks onOpenAssistant={handleOpenAssistant} />
      <BenefitsSection />
      <HospitalsSection onSelectHospital={(hospitalName) => handleOpenAssistant(`Gostaria de saber mais sobre o atendimento no ${hospitalName}`)} />
      <MissionSection />
      <ImpactSection />
      <FinalCtaSection onCtaClick={() => handleOpenAssistant("Gostaria de conhecer mais sobre o Cuidaê.")} />
      <Footer />
      <ConsultationModal isOpen={isAssistantOpen} onClose={handleCloseAssistant} initialPrompt={assistantPrompt} />
    </main>
  );
}
