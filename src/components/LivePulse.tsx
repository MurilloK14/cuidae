"use client";

import React from "react";
import { Heart, Moon, UserCheck, Activity } from "lucide-react";

interface LivePulseProps {
  isDark: boolean;
}

export const LivePulse: React.FC<LivePulseProps> = ({ isDark }) => {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-20">
      <div className="flex items-center gap-2 mb-4">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
        </span>
        <h3 className="text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-200">
          Live Health Pulse
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Metric Cards Grid - 9 cols on Desktop */}
        <div className="md:col-span-8 lg:col-span-9 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Heart Rate */}
          <div className="relative overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:translate-y-[-2px] shadow-sm border border-slate-200/90 dark:border-white/10 bg-gradient-to-br from-[#c3f4fd] via-[#e2f0fb] to-[#fedbc8] text-slate-900">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-rose-500">
                <Heart className="w-4 h-4 fill-rose-500" />
              </div>
              <div>
                <span className="block text-xs font-bold leading-tight text-slate-900">
                  Heart Rate
                </span>
                <span className="block text-[10px] text-slate-600 font-medium">
                  Continuous
                </span>
              </div>
            </div>

            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
                120
              </span>
              <span className="text-xs font-semibold text-slate-700">bpm</span>
            </div>
            <span className="text-[10px] text-slate-600 font-medium">Optimal Rhythm</span>

            {/* Pulse Wave SVG Line */}
            <div className="mt-2 w-full h-8 overflow-hidden">
              <svg
                viewBox="0 0 160 30"
                className="w-full h-full stroke-orange-500/80 fill-none"
                preserveAspectRatio="none"
              >
                <path
                  d="M0,15 L35,15 L45,5 L52,25 L60,8 L68,22 L75,15 L160,15"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* Card 2: Sleep Score */}
          <div className="relative overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:translate-y-[-2px] shadow-sm border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-[#12192c]/90 backdrop-blur-xl">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-950/80 shadow-sm flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-xs font-bold leading-tight text-slate-900 dark:text-white">
                  Sleep Score
                </span>
                <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  8h 12m tracked
                </span>
              </div>
            </div>

            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                88
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">/ 100</span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              Deep Recovery
            </span>

            {/* Sleep Stages Bars Visual */}
            <div className="mt-3 flex items-end gap-1.5 h-6">
              {[
                { h: "h-3", color: "bg-cyan-300 dark:bg-cyan-600" },
                { h: "h-5", color: "bg-indigo-400 dark:bg-indigo-500" },
                { h: "h-4", color: "bg-cyan-400 dark:bg-cyan-500" },
                { h: "h-6", color: "bg-purple-400 dark:bg-purple-500" },
                { h: "h-3", color: "bg-cyan-300 dark:bg-cyan-600" },
                { h: "h-5", color: "bg-indigo-400 dark:bg-indigo-500" },
                { h: "h-4", color: "bg-cyan-400 dark:bg-cyan-500" },
                { h: "h-6", color: "bg-purple-500 dark:bg-purple-400" },
              ].map((bar, idx) => (
                <div
                  key={idx}
                  className={`flex-1 rounded-sm ${bar.h} ${bar.color} opacity-80 transition-all`}
                />
              ))}
            </div>
          </div>

          {/* Card 3: Stress Level */}
          <div className="relative overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:translate-y-[-2px] shadow-sm border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-[#12192c]/90 backdrop-blur-xl">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-950/80 shadow-sm flex items-center justify-center text-teal-600 dark:text-teal-400">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-xs font-bold leading-tight text-slate-900 dark:text-white">
                  Stress Level
                </span>
                <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  Index 1 - 10
                </span>
              </div>
            </div>

            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-teal-600 dark:text-teal-400">
                Low
              </span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              Calm & Balanced
            </span>

            {/* Segmented Progress Tracker Dots */}
            <div className="mt-4 flex items-center gap-1.5">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-full transition-all ${
                    i < 3
                      ? "bg-teal-400 dark:bg-teal-400"
                      : "bg-slate-200 dark:bg-slate-700/60"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Stats: 98% AI Accuracy and 500+ Active Users */}
        <div className="md:col-span-4 lg:col-span-3 flex sm:flex-row md:flex-col lg:flex-row items-center justify-around gap-6 p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-[#0f1628]/60 backdrop-blur-md">
          <div className="text-center sm:text-left">
            <div className="text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              98<span className="text-cyan-600 dark:text-cyan-400">%</span>
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              AI Accuracy
            </div>
          </div>

          <div className="w-[1px] h-10 bg-slate-200 dark:bg-white/10 hidden sm:block md:hidden lg:block" />

          <div className="text-center sm:text-left">
            <div className="text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              500<span className="text-purple-600 dark:text-purple-400">+</span>
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              Active Users
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
