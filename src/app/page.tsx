"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
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
      <HowItWorks onOpenAssistant={handleOpenAssistant} />
      <ImpactSection />
      <FinalCtaSection onCtaClick={() => handleOpenAssistant("Gostaria de conhecer mais sobre a SaúdeIA.")} />
      <Footer />
      <ConsultationModal isOpen={isAssistantOpen} onClose={handleCloseAssistant} initialPrompt={assistantPrompt} />
    </main>
  );
}
