import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50/70 font-jakarta text-slate-900 antialiased flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-[#2b85ff]/8 via-transparent to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  );
}
