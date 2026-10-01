import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
  Stethoscope,
  Clock,
  Bell,
  ArrowUpRight,
  ChevronRight,
  CalendarCheck,
  Syringe,
  FileSearch,
  Sparkles,
} from 'lucide-react';

// Color mappings for urgency levels
const urgenciaConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  verde: { label: 'Baixa', color: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
  amarelo: { label: 'Moderada', color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500' },
  vermelho: { label: 'Alta', color: 'text-red-700', bg: 'bg-red-50', dot: 'bg-red-500' },
};

const recomendacaoLabel: Record<string, string> = {
  ubs: 'Procurar UBS',
  upa: 'Ir à UPA',
  teleconsulta: 'Teleconsulta',
  esperar: 'Pode esperar',
};

const tipoLembreteIcon: Record<string, React.ReactNode> = {
  vacina: <Syringe className="w-4 h-4 text-blue-500" />,
  consulta: <CalendarCheck className="w-4 h-4 text-emerald-500" />,
  retorno: <FileSearch className="w-4 h-4 text-amber-500" />,
  exame: <FileSearch className="w-4 h-4 text-purple-500" />,
};

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single();

  const nome = profile?.nome_completo || 'Usuário';
  const primeiroNome = nome.split(' ')[0];
  const camada = profile?.camada || 'gratuita';

  // Fetch triagens
  const { data: triagens } = await supabase
    .from('triagens')
    .select('id, sintoma_principal, nivel_urgencia, recomendacao, created_at')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(5);

  // Fetch active reminders
  const today = new Date().toISOString().split('T')[0];
  const { data: lembretes } = await supabase
    .from('lembretes')
    .select('*')
    .eq('user_id', user!.id)
    .neq('status', 'concluido')
    .gte('data_agendada', today)
    .order('data_agendada', { ascending: true })
    .limit(5);

  // Use mock reminders if no real ones exist
  const lembretesExibidos = lembretes && lembretes.length > 0
    ? lembretes
    : [
        {
          id: 'mock-1',
          tipo: 'vacina',
          descricao: 'Vacina da gripe — Campanha 2026',
          data_agendada: '2026-10-15',
          status: 'pendente',
        },
        {
          id: 'mock-2',
          tipo: 'consulta',
          descricao: 'Check-up anual recomendado',
          data_agendada: '2026-11-01',
          status: 'pendente',
        },
      ];

  const camadaInfo: Record<string, { label: string; desc: string; color: string }> = {
    gratuita: {
      label: 'Plano Gratuito',
      desc: 'Triagens ilimitadas + histórico básico',
      color: 'from-slate-50 to-slate-100 border-slate-200',
    },
    intermediaria: {
      label: 'Plano Intermediário',
      desc: 'Teleconsultas avulsas disponíveis',
      color: 'from-blue-50 to-blue-100/50 border-blue-200',
    },
    premium: {
      label: 'Plano Premium',
      desc: 'Consultas ilimitadas + vínculo clínica',
      color: 'from-amber-50 to-amber-100/50 border-amber-200',
    },
  };

  const plano = camadaInfo[camada] || camadaInfo.gratuita;

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Olá, {primeiroNome}! 👋
        </h1>
        <p className="mt-1 text-slate-500">
          Aqui está um resumo da sua saúde.
        </p>
      </div>

      {/* Quick Action: Start Triage */}
      <Link
        href="/triagem"
        className="group flex items-center gap-4 p-6 bg-[#091426] rounded-2xl text-white shadow-[0_8px_24px_-8px_rgba(9,20,38,0.5)] hover:shadow-[0_12px_32px_-8px_rgba(9,20,38,0.6)] transition-all duration-300 hover:-translate-y-0.5"
      >
        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
          <Stethoscope className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold">Iniciar Nova Triagem</h2>
          <p className="text-sm text-white/60 mt-0.5">
            Descreva seus sintomas e receba orientação inteligente
          </p>
        </div>
        <ArrowUpRight className="w-5 h-5 text-white/40 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Triage History — spans 2 columns */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" />
              <h3 className="font-semibold text-slate-900">Histórico de Triagens</h3>
            </div>
            {triagens && triagens.length > 0 && (
              <span className="text-xs font-medium text-slate-400">
                {triagens.length} recente{triagens.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {!triagens || triagens.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                <Stethoscope className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">Nenhuma triagem realizada</p>
              <p className="text-sm text-slate-400 mt-1">
                Inicie sua primeira triagem para receber orientações de saúde.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {triagens.map((triagem: any) => {
                const urgencia = triagem.nivel_urgencia || 'verde';
                const config = urgenciaConfig[urgencia] || urgenciaConfig.verde;
                const recomendacao = triagem.recomendacao || 'esperar';

                return (
                  <Link
                    key={triagem.id}
                    href={`/triagem/resultado/${triagem.id}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors group"
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${config.dot} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {triagem.sintoma_principal}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatDate(triagem.created_at)} — {recomendacaoLabel[recomendacao] || recomendacao}
                      </p>
                    </div>
                    <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                      {config.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Reminders */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
              <Bell className="w-5 h-5 text-slate-400" />
              <h3 className="font-semibold text-slate-900">Lembretes</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {lembretesExibidos.map((lembrete: any) => (
                <div key={lembrete.id} className="flex items-start gap-3 px-5 py-3.5">
                  <div className="mt-0.5 shrink-0">
                    {tipoLembreteIcon[lembrete.tipo] || <Bell className="w-4 h-4 text-slate-400" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 leading-snug">
                      {lembrete.descricao}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatDate(lembrete.data_agendada || lembrete.data_lembrete || lembrete.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Plan Badge */}
          <div className={`rounded-2xl border bg-gradient-to-br ${plano.color} p-5`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{plano.label}</p>
                <p className="text-xs text-slate-500 mt-1">{plano.desc}</p>
              </div>
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            {camada === 'gratuita' && (
              <Link
                href="/planos"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#2b85ff] hover:underline"
              >
                Fazer upgrade
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
