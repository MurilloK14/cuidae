import React from 'react';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { LogOut, User, Settings } from 'lucide-react';
import { signOut } from '@/lib/auth/actions';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('nome_completo, camada')
    .eq('id', user.id)
    .single();

  const nome = profile?.nome_completo || user.email?.split('@')[0] || 'Usuário';
  const primeiroNome = nome.split(' ')[0];
  const camada = profile?.camada || 'gratuita';

  const camadaLabel: Record<string, { text: string; color: string }> = {
    gratuita: { text: 'Grátis', color: 'bg-slate-100 text-slate-600' },
    intermediaria: { text: 'Intermediário', color: 'bg-blue-100 text-blue-700' },
    premium: { text: 'Premium', color: 'bg-amber-100 text-amber-700' },
  };

  const badge = camadaLabel[camada] || camadaLabel.gratuita;

  const navLinks = [
    { label: 'Dashboard', href: '/dashboard', icon: '📊' },
    { label: 'Nova Triagem', href: '/triagem', icon: '🩺' },
    { label: 'Planos', href: '/planos', icon: '⬆️' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="relative h-9 w-32">
                <Image
                  src="/images/cuidae-logo-trimmed.png"
                  alt="SaúdeIA"
                  fill
                  className="object-contain object-left"
                  sizes="128px"
                />
              </div>
            </Link>

            {/* Center Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}
            </nav>

            {/* Right Side: User Info */}
            <div className="flex items-center gap-3">
              <span className={`hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.color}`}>
                {badge.text}
              </span>

              <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-[#2b85ff]/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-[#2b85ff]" />
                </div>
                <span className="hidden sm:block text-sm font-medium text-slate-700">
                  {primeiroNome}
                </span>
              </div>

              <form action={signOut}>
                <button
                  type="submit"
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  title="Sair"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Nav */}
        <div className="md:hidden border-t border-slate-100">
          <div className="flex items-center justify-around py-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-[#2b85ff] transition-colors"
              >
                <span className="text-lg">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
