"use client";

import React from "react";

export const IntegrationsBar: React.FC = () => {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16 relative z-20">
      <div className="w-full rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-lg px-6 py-5 flex flex-wrap items-center justify-between gap-6 sm:gap-8">
        {/* Fitbit */}
        <div className="flex items-center gap-2 text-slate-800 hover:text-cyan-600 transition-colors cursor-pointer">
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <circle cx="12" cy="3" r="1.5" />
            <circle cx="12" cy="8" r="2" />
            <circle cx="12" cy="13" r="2.5" />
            <circle cx="12" cy="18" r="2" />
            <circle cx="12" cy="22" r="1.5" />
            <circle cx="8" cy="8" r="1.2" />
            <circle cx="8" cy="13" r="1.8" />
            <circle cx="8" cy="18" r="1.2" />
            <circle cx="16" cy="8" r="1.2" />
            <circle cx="16" cy="13" r="1.8" />
            <circle cx="16" cy="18" r="1.2" />
            <circle cx="4" cy="13" r="1.2" />
            <circle cx="20" cy="13" r="1.2" />
          </svg>
          <span className="font-extrabold text-base sm:text-lg tracking-tight">fitbit</span>
        </div>

        {/* Garmin */}
        <div className="flex items-center gap-1.5 text-slate-900 hover:text-cyan-600 transition-colors cursor-pointer">
          <span className="font-black text-base sm:text-lg tracking-wider uppercase font-serif">
            GARMIN<span className="text-cyan-600 text-xs">▲</span>
          </span>
        </div>

        {/* Peloton */}
        <div className="flex items-center gap-2 text-slate-900 hover:text-cyan-600 transition-colors cursor-pointer">
          <div className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center font-black text-xs">
            P
          </div>
          <span className="font-extrabold text-sm sm:text-base tracking-widest uppercase">
            PELOTON
          </span>
        </div>

        {/* MyFitnessPal */}
        <div className="flex items-center gap-2 text-slate-900 hover:text-cyan-600 transition-colors cursor-pointer">
          <svg className="w-5 h-5 fill-none stroke-current stroke-[2.2]" viewBox="0 0 24 24">
            <circle cx="12" cy="6" r="2" />
            <path d="M7 11l5 4 5-4" />
            <path d="M12 15v6" />
            <path d="M9 21l3-3 3 3" />
          </svg>
          <span className="font-extrabold text-xs sm:text-sm tracking-wider uppercase">
            MYFITNESSPAL
          </span>
        </div>

        {/* WHOOP */}
        <div className="flex items-center text-slate-900 hover:text-cyan-600 transition-colors cursor-pointer">
          <span className="font-black text-base sm:text-lg tracking-widest uppercase">
            WHOOP
          </span>
        </div>

        {/* Strava */}
        <div className="flex items-center gap-1 text-slate-950 hover:text-orange-500 transition-colors cursor-pointer">
          <span className="font-black text-base sm:text-lg tracking-tight uppercase">
            STRAVA
          </span>
        </div>
      </div>
    </section>
  );
};
