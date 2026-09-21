"use client";

import React from "react";
import { Sparkles, ArrowUpRight, ChevronDown, Activity, ShieldCheck, Heart } from "lucide-react";
import { HeartVisual } from "./HeartVisual";
import { MeshyHeart3D } from "./MeshyHeart3D";
import { RealHeart3D } from "./RealHeart3D";

interface HeroProps {
  isDark: boolean;
}

export const Hero: React.FC<HeroProps> = ({ isDark }) => {
  return (
    <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 overflow-hidden">
      {/* Ambient background glow orbs */}
      <div
        className={`absolute top-1/4 -left-20 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-opacity duration-500 ${
          isDark
            ? "bg-purple-900/30 opacity-60"
            : "bg-purple-200/50 opacity-70"
        }`}
      />
      <div
        className={`absolute top-10 right-0 w-[30rem] h-[30rem] rounded-full blur-3xl pointer-events-none transition-opacity duration-500 ${
          isDark
            ? "bg-cyan-900/25 opacity-70"
            : "bg-cyan-100/70 opacity-80"
        }`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        {/* Left Column: Typography & CTAs */}
        <div className="lg:col-span-7 flex flex-col items-start space-y-6 lg:pr-4">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-medium tracking-wide transition-all shadow-sm backdrop-blur-md bg-white/80 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 animate-pulse" />
            <span>AI Powered Health Intelligence</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-[3.75rem] font-extrabold tracking-tight leading-[1.08] text-slate-900 dark:text-white">
            Intelligent Health <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 dark:from-cyan-400 dark:via-sky-300 dark:to-purple-400">
              starts with AI
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300 max-w-xl font-normal">
            Get real-time wellness insights, personalized recommendations, and full
            control over your health metrics with our advanced AI platform.
          </p>

          {/* CTAs Row */}
          <div className="flex flex-wrap items-center gap-4 pt-2 w-full sm:w-auto">
            {/* Primary Button */}
            <button className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-sm sm:text-base transition-all duration-200 shadow-lg shadow-cyan-400/25 hover:shadow-cyan-400/40 hover:-translate-y-0.5 active:translate-y-0">
              <span>Wellness Dashboard</span>
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* Health Summary / Metric Pill */}
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-full border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-md text-xs sm:text-sm text-slate-800 dark:text-slate-200 shadow-sm">
              <span className="font-medium text-slate-500 dark:text-slate-400">
                Health Summary <span className="text-slate-400 dark:text-slate-500">(Metrics)</span>
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
              <span className="font-semibold text-slate-900 dark:text-white">$950/mo.</span>
              <span className="flex items-center text-emerald-600 dark:text-emerald-400 font-medium">
                +1.5%
                <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: 3D Holographic Heart with Parallax Tilt & Floating Glass Card */}
        <div className="lg:col-span-5 relative flex items-center justify-center min-h-[500px] lg:min-h-[580px]">
          {/* Three.js 3D WebGL Model (Hologram & PBR) */}
          <div className="relative w-full max-w-[560px] flex items-center justify-center">
            <RealHeart3D isDark={isDark} />
          </div>

          {/* Floating Frosted Glass Card: AI Analysis for Your Body */}
          <div className="absolute -bottom-4 left-0 sm:-left-6 max-w-[260px] p-4 rounded-2xl border backdrop-blur-xl transition-all duration-300 shadow-xl bg-white/90 dark:bg-[#10192e]/85 border-slate-200/90 dark:border-cyan-400/30 text-slate-800 dark:text-white">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-500 flex items-center justify-center text-white shadow-sm">
                <Activity className="w-3.5 h-3.5" />
              </div>
              <h4 className="font-semibold text-xs tracking-tight text-slate-900 dark:text-white">
                AI Analysis for Your Body
              </h4>
            </div>

            <p className="text-[11px] leading-snug text-slate-600 dark:text-slate-300 mb-3">
              Uses health data, specific markers, and biometric metrics analyzed for optimal
              performance.
            </p>

            <button className="w-full py-1.5 px-3 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-medium text-xs transition-colors shadow-sm text-center">
              Health Now
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
