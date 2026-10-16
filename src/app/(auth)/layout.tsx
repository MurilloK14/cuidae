import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b14] font-jakarta text-slate-900 dark:text-slate-100 antialiased flex flex-col justify-center py-10 sm:py-14 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
      {/* Ambient lighting meshes */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] sm:w-[900px] h-[450px] bg-gradient-to-b from-blue-500/10 dark:from-blue-600/20 via-indigo-500/5 dark:via-indigo-600/10 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] sm:w-[500px] h-[400px] bg-gradient-to-t from-teal-500/10 dark:from-cyan-500/15 via-transparent to-transparent blur-3xl pointer-events-none -z-10" />
      
      {/* Subtle fine dot pattern for depth */}
      <div 
        className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 dark:opacity-30 pointer-events-none -z-10" 
      />

      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  );
}

