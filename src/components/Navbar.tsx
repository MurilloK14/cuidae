"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { ArrowRight, Menu, X } from "lucide-react";

interface NavbarProps {
  onOpenAssistant?: (prompt?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAssistant }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("inicio");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      const sections = ["inicio", "como-funciona", "hospitais", "nossa-missao", "contato"];
      const scrollPosition = window.scrollY + 140;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Início", href: "#inicio", id: "inicio" },
    { label: "Como funciona", href: "#como-funciona", id: "como-funciona" },
    { label: "Hospitais", href: "#hospitais", id: "hospitais" },
    { label: "Sobre nós", href: "#nossa-missao", id: "nossa-missao" },
    { label: "Contato", href: "#contato", id: "contato" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] py-3"
          : "bg-white/80 backdrop-blur-sm border-b border-slate-100/60 py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href="#inicio" className="flex items-center gap-2 group">
            <div className="relative h-9 w-32 sm:h-10 sm:w-36">
              <Image
                src="/images/cuidae-logo-trimmed.png"
                alt="SaúdeIA"
                fill
                priority
                className="object-contain object-left"
                sizes="(max-width: 640px) 128px, 144px"
              />
            </div>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-9 text-[15px] font-medium text-slate-600">
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.id}
                  href={link.href}
                  className={`transition-colors duration-200 hover:text-[#2b85ff] relative py-1 group ${
                    isActive ? "text-slate-900 font-semibold" : "text-slate-600"
                  }`}
                >
                  {link.label}
                  <span className={`absolute -bottom-1 left-0 h-[2px] bg-[#2b85ff] rounded-full transition-all duration-300 ${isActive ? 'w-full opacity-100' : 'w-0 opacity-0 group-hover:w-full group-hover:opacity-30'}`} />
                </a>
              );
            })}
          </nav>

          {/* Right Action */}
          <div className="hidden sm:flex items-center">
            <button
              onClick={() => onOpenAssistant?.("Quero acessar o sistema")}
              className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#091426] hover:bg-[#1a2c4e] text-white text-sm font-medium transition-all duration-300 shadow-[0_4px_12px_-4px_rgba(9,20,38,0.4)] hover:shadow-[0_8px_16px_-6px_rgba(9,20,38,0.5)] hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Acessar o sistema</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu de navegação"
              className="p-2 text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 pb-4 border-t border-slate-100 space-y-2 animate-in fade-in">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-xl text-sm font-medium ${
                  activeSection === link.id
                    ? "bg-[#eef5ff] text-[#2b85ff] font-semibold"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {link.label}
              </a>
            ))}
            <div className="pt-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAssistant?.("Quero acessar o sistema");
                }}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#091426] text-white text-sm font-medium shadow-sm"
              >
                <span>Acessar o sistema</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
