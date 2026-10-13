import React from 'react';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getSessionByToken } from '@/lib/db/hospitalAuthStore';
import { LogOut, User, Settings, Building2 } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { signOut } from '@/lib/auth/actions';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const hospitalToken = cookieStore.get('cuidae_hospital_session')?.value;
  const hospitalSession = hospitalToken ? getSessionByToken(hospitalToken) : null;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !hospitalSession) {
    redirect('/login');
  }

  let nome = 'Usuário';
  let primeiroNome = 'Usuário';
  let badge = { text: 'Grátis', color: 'bg-slate-100 text-slate-600' };

  if (hospitalSession) {
    nome = hospitalSession.hospital_nome;
    primeiroNome = hospitalSession.hospital_curto || hospitalSession.hospital_nome.split(' ')[0];
    badge = { text: 'Hospital Credenciado', color: 'bg-emerald-100 text-emerald-800' };
  } else if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('nome_completo, camada')
      .eq('id', user.id)
      .single();

    nome = profile?.nome_completo || user.email?.split('@')[0] || 'Usuário';
    primeiroNome = nome.split(' ')[0];
    const camada = profile?.camada || 'gratuita';

    const camadaLabel: Record<string, { text: string; color: string }> = {
      gratuita: { text: 'Grátis', color: 'bg-slate-100 text-slate-600' },
      intermediaria: { text: 'Intermediário', color: 'bg-blue-100 text-blue-700' },
      premium: { text: 'Premium', color: 'bg-amber-100 text-amber-700' },
    };

    badge = camadaLabel[camada] || camadaLabel.gratuita;
  }

  const navLinks = [
    { label: 'Dashboard', href: '/dashboard', icon: '📊' },
    { label: 'Nova Triagem', href: '/triagem', icon: '🩺' },
    { label: 'Agendamentos', href: '/agendamento/meus-agendamentos', icon: '🗓️' },
    { label: 'Unidades', href: '/unidades', icon: '🏥' },
    { label: 'Configurações', href: '/configuracoes', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-[#090e17] font-jakarta text-slate-900 dark:text-slate-100 antialiased transition-colors duration-200">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2 group transition-opacity hover:opacity-90">
              <div className="relative h-9 w-32">
                <Image
                  src="/images/cuidae-logo-trimmed.png"
                  alt="Cuidaê"
                  fill
                  className="object-contain object-left dark:brightness-110"
                  sizes="128px"
                  priority
                />
              </div>
            </Link>

            {/* Center Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-all"
                >
                  <span className="text-sm">{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}
            </nav>

            {/* Right Side: User Info & Theme */}
            <div className="flex items-center gap-2.5">
              <ThemeToggle />

              <span className={`hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.color} border-current/15`}>
                {badge.text}
              </span>

              <Link
                href="/configuracoes"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Configurações da Conta"
              >
                <Settings className="w-4 h-4" />
              </Link>

              <div className="flex items-center gap-2 pl-2.5 border-l border-slate-200/80 dark:border-slate-800">
                <div className="w-8 h-8 rounded-full bg-[#2b85ff]/10 dark:bg-blue-500/20 border border-[#2b85ff]/20 flex items-center justify-center text-[#2b85ff] dark:text-blue-400">
                  <User className="w-4 h-4" />
                </div>
                <span className="hidden sm:block text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {primeiroNome}
                </span>
              </div>

              <form action={signOut}>
                <button
                  type="submit"
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Sair da conta"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Nav */}
        <div className="md:hidden border-t border-slate-200/70 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
          <div className="flex items-center justify-around py-1.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-[#2b85ff] dark:hover:text-blue-400 transition-colors"
              >
                <span className="text-base">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {children}
      </main>
    </div>
  );
}
