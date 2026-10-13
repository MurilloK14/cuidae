"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, X } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

interface NavbarProps {
  onOpenAssistant?: (prompt?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAssistant }) => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("inicio");

  useEffect(() => {
    if (pathname !== "/") return;
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
  }, [pathname]);

  const navLinks = [
    { label: "Início", href: pathname === "/" ? "#inicio" : "/#inicio", id: "inicio" },
    { label: "Como funciona", href: pathname === "/" ? "#como-funciona" : "/como-funciona", id: "como-funciona" },
    { label: "Hospitais", href: pathname === "/" ? "#hospitais" : "/#hospitais", id: "hospitais" },
    { label: "Sobre nós", href: pathname === "/" ? "#nossa-missao" : "/#nossa-missao", id: "nossa-missao" },
    { label: "Contato", href: pathname === "/" ? "#contato" : "/#contato", id: "contato" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.02)] py-3"
          : "bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-100/60 dark:border-slate-800/60 py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 group">
            <div className="relative h-9 w-32 sm:h-10 sm:w-36" style={{ maxWidth: '144px', maxHeight: '40px' }}>
              <Image
                src="/images/cuidae-logo-trimmed.png"
                alt="Cuidaê"
                fill
                priority
                className="object-contain object-left dark:brightness-110"
                sizes="(max-width: 640px) 128px, 144px"
              />
            </div>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-9 text-[15px] font-medium text-slate-600 dark:text-slate-300">
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.id}
                  href={link.href}
                  className={`transition-colors duration-200 hover:text-[#2b85ff] relative py-1 group ${
                    isActive ? "text-slate-900 dark:text-white font-semibold" : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {link.label}
                  <span className={`absolute -bottom-1 left-0 h-[2px] bg-[#2b85ff] rounded-full transition-all duration-300 ${isActive ? 'w-full opacity-100' : 'w-0 opacity-0 group-hover:w-full group-hover:opacity-30'}`} />
                </a>
              );
            })}
          </nav>

          {/* Right Action */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <a
              href="/login"
              className="text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-[#2b85ff] px-3 py-2 rounded-lg transition-colors"
            >
              Entrar
            </a>
            <a
              href="/triagem"
              className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#091426] dark:bg-[#2b85ff] hover:bg-[#1a2c4e] dark:hover:bg-blue-600 text-white text-sm font-medium transition-all duration-300 shadow-[0_4px_12px_-4px_rgba(9,20,38,0.4)] hover:shadow-[0_8px_16px_-6px_rgba(9,20,38,0.5)] hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Fazer Triagem</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </a>
          </div>

          {/* Mobile Right Controls: Theme + Hamburger */}
          <div className="flex md:hidden items-center gap-1.5">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu de navegação"
              className="p-2 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 pb-4 border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-3 space-y-2 animate-in fade-in shadow-xl">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-xl text-sm font-medium ${
                  activeSection === link.id
                    ? "bg-[#eef5ff] dark:bg-blue-950/60 text-[#2b85ff] dark:text-blue-400 font-semibold"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
              <a
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Fazer Login
              </a>
              <a
                href="/triagem"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-[#091426] dark:bg-blue-600 text-white text-sm font-medium shadow-sm"
              >
                <span>Fazer Triagem Gratuita</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
