"use client";

import React, { useState } from "react";
import { ChevronDown, Moon, Sun, Sparkles, Menu, X } from "lucide-react";

interface NavbarProps {
  isDark: boolean;
  toggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ isDark, toggleTheme }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState("EN");

  const navLinks = [
    { label: "Home", href: "#", active: true },
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Solutions", href: "#solutions" },
    { label: "Resources", href: "#resources" },
  ];

  return (
    <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2 relative z-50">
      <nav className="flex items-center justify-between py-2.5 px-4 sm:px-6 rounded-full border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-[#0e1424]/70 backdrop-blur-xl shadow-sm transition-all duration-300">
        {/* Logo */}
        <div className="flex items-center space-x-3 cursor-pointer">
          <div className="relative w-8 h-8 flex items-center justify-center">
            {/* Geometric Wings / Heart AI Logo as in mock */}
            <svg
              viewBox="0 0 32 32"
              className="w-7 h-7 filter drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 8C6 8 13 14 15 24C12 21 8 19 6 8Z"
                fill="url(#logoGrad1)"
              />
              <path
                d="M26 8C26 8 19 14 17 24C20 21 24 19 26 8Z"
                fill="url(#logoGrad2)"
              />
              <defs>
                <linearGradient id="logoGrad1" x1="6" y1="8" x2="15" y2="24" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#c084fc" />
                  <stop offset="1" stopColor="#6366f1" />
                </linearGradient>
                <linearGradient id="logoGrad2" x1="26" y1="8" x2="17" y2="24" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#818cf8" />
                  <stop offset="1" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
            Vital<span className="text-cyan-600 dark:text-cyan-400 font-extrabold">AI</span>
          </span>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center space-x-7 text-sm font-medium">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={`transition-colors duration-200 ${
                link.active
                  ? "text-slate-900 dark:text-white font-semibold"
                  : "text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-300"
              }`}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right Side Actions */}
        <div className="hidden lg:flex items-center space-x-4">
          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-2 py-1 rounded-md transition-colors"
            >
              <span>{selectedLang === "EN" ? "🇺🇸 EN" : "🇧🇷 PT"}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {langDropdownOpen && (
              <div className="absolute right-0 mt-2 w-28 py-1.5 bg-white dark:bg-[#151c30] rounded-xl border border-slate-200 dark:border-white/10 shadow-lg text-xs z-50">
                <button
                  onClick={() => {
                    setSelectedLang("EN");
                    setLangDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-2"
                >
                  <span>🇺🇸</span> English
                </button>
                <button
                  onClick={() => {
                    setSelectedLang("PT");
                    setLangDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-2"
                >
                  <span>🇧🇷</span> Português
                </button>
              </div>
            )}
          </div>

          {/* Theme Toggle (White / Dark) */}
          <button
            onClick={toggleTheme}
            aria-label="Alternar Tema"
            title={isDark ? "Mudar para Tema Branco" : "Mudar para Tema Escuro"}
            className="flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-amber-300 hover:bg-slate-200 dark:hover:bg-white/20 transition-all"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Login Button */}
          <button className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 transition-colors">
            Login
          </button>

          {/* Primary CTA - Pill Button */}
          <button className="relative group overflow-hidden rounded-full p-[1px] font-medium text-xs sm:text-sm tracking-wide transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
            <span className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 rounded-full opacity-80 group-hover:opacity-100 transition-opacity" />
            <span className="relative block px-5 py-2 rounded-full bg-white dark:bg-[#0c1220] text-slate-900 dark:text-white font-medium group-hover:bg-opacity-90 dark:group-hover:bg-[#10182b] transition-colors border border-transparent">
              Get started Now
            </span>
          </button>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label="Alternar Tema"
            className="p-1.5 rounded-full border border-slate-200 dark:border-white/10 text-slate-700 dark:text-amber-300"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-700 dark:text-slate-200 hover:text-slate-900"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#0e1424]/95 backdrop-blur-xl shadow-xl space-y-3">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-cyan-600 dark:hover:text-cyan-400"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex flex-col gap-2.5">
            <button className="w-full py-2 text-sm font-medium text-slate-700 dark:text-slate-200 text-center">
              Login
            </button>
            <button className="w-full py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-medium shadow-md">
              Get started Now
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
