"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { LivePulse } from "@/components/LivePulse";
import { IntegrationsBar } from "@/components/IntegrationsBar";
import { Sparkles, Eye, Check } from "lucide-react";

export default function Home() {
  // Default to light theme (white as primary color), as explicitly requested by user
  const [isDark, setIsDark] = useState<boolean>(false);
  const [showModelModal, setShowModelModal] = useState<boolean>(false);

  useEffect(() => {
    // Apply dark class to html document element
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  return (
    <main
      className={`min-h-screen relative transition-colors duration-500 overflow-x-hidden ${
        isDark ? "bg-[#070b14] text-white" : "bg-[#ffffff] text-slate-900"
      }`}
    >
      {/* Background Decorative Grid & Subtle Noise */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${
          isDark
            ? "opacity-20 bg-[radial-gradient(#1e293b_1px,transparent_1px)]"
            : "opacity-40 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)]"
        }`}
        style={{ backgroundSize: "28px 28px" }}
      />

      {/* Floating Theme / Reference Banner */}
      <aside aria-label="Controle de visualização do tema" className="w-full bg-slate-100/80 dark:bg-white/5 border-b border-slate-200/80 dark:border-white/10 py-1.5 px-4 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 font-semibold text-cyan-700 dark:text-cyan-400">
              <Sparkles className="w-3 h-3" />
              Tema Atual:
            </span>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {isDark ? "🌙 Escuro (Fiel ao Modelo)" : "☀️ Branco Clínico (Solicitado)"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="text-[11px] font-semibold underline underline-offset-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800"
            >
              Alternar para {isDark ? "Tema Branco" : "Tema Escuro"}
            </button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <button
              onClick={() => setShowModelModal(true)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <Eye className="w-3 h-3" />
              Ver Imagem de Referência
            </button>
          </div>
        </div>
      </aside>

      {/* Navbar */}
      <Navbar isDark={isDark} toggleTheme={toggleTheme} />

      {/* Hero Section */}
      <Hero isDark={isDark} />

      {/* Live Health Pulse Widgets */}
      <LivePulse isDark={isDark} />

      {/* Partner Integrations Dock */}
      <IntegrationsBar />

      {/* Modal to View Original Image Reference */}
      {showModelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative max-w-4xl w-full bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <span>Imagem de Referência Original</span>
                <span className="text-xs font-normal text-slate-400">
                  (modelo hero.jpg)
                </span>
              </h3>
              <button
                onClick={() => setShowModelModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 rounded-xl overflow-hidden border border-slate-800">
              <img
                src="/images/modelo_hero.jpg"
                alt="Modelo Hero Original"
                className="w-full h-auto object-contain max-h-[70vh]"
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
