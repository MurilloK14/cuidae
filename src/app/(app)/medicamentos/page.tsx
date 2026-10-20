'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Pill,
  Search,
  MapPin,
  Clock,
  Phone,
  FileText,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Share2,
  Navigation,
  Sparkles,
  Building2,
  X,
  Info,
  ShieldCheck,
  ChevronRight,
  Filter,
  Check
} from 'lucide-react';
import type { MedicamentoItem, CategoriaMedicamento, ProgramaDispensacao } from '@/lib/types';

const CATEGORIAS: Array<{ label: string; valor: CategoriaMedicamento | 'Todos'; icon: string }> = [
  { label: 'Todos os Remédios', valor: 'Todos', icon: '💊' },
  { label: 'Pressão Alta', valor: 'Hipertensão', icon: '❤️' },
  { label: 'Diabetes', valor: 'Diabetes', icon: '🩸' },
  { label: 'Dor e Febre', valor: 'Dor e Febre', icon: '🌡️' },
  { label: 'Antibióticos', valor: 'Antibióticos', icon: '🦠' },
  { label: 'Asma e Respiração', valor: 'Asma e Respiratório', icon: '🫁' },
  { label: 'Saúde Mental', valor: 'Saúde Mental', icon: '🧠' },
  { label: 'Estômago e Azia', valor: 'Gástrico', icon: '🥣' },
  { label: 'Colesterol', valor: 'Colesterol', icon: '🫀' },
  { label: 'Anti-inflamatórios', valor: 'Anti-inflamatórios', icon: '🩹' },
  { label: 'Outros', valor: 'Outros', icon: '📦' }
];

export default function MedicamentosPage() {
  const [medicamentos, setMedicamentos] = useState<MedicamentoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState<string>('Todos');
  const [programa, setPrograma] = useState<string>('Todos');
  const [medicamentoSelecionado, setMedicamentoSelecionado] = useState<MedicamentoItem | null>(null);

  // Localização do usuário
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [copiado, setCopiado] = useState(false);

  // Carrega medicamentos da API
  useEffect(() => {
    async function carregarMedicamentos() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (busca) params.set('q', busca);
        if (categoria && categoria !== 'Todos') params.set('categoria', categoria);
        if (programa && programa !== 'Todos') params.set('programa', programa);
        if (userCoords) {
          params.set('lat', userCoords.lat.toString());
          params.set('lng', userCoords.lng.toString());
        }

        const res = await fetch(`/api/medicamentos?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setMedicamentos(data.medicamentos || []);
        }
      } catch (err) {
        console.error('Erro ao carregar medicamentos:', err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      carregarMedicamentos();
    }, 200);

    return () => clearTimeout(timer);
  }, [busca, categoria, programa, userCoords]);

  // Solicita geolocalização do navegador
  const obterLocalizacao = () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não é suportada pelo seu navegador.');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setGeoLoading(false);
      },
      (error) => {
        console.warn('Erro ao obter localização:', error.message);
        // Fallback para centro de Garanhuns
        setUserCoords({ lat: -8.8902, lng: -36.4925 });
        setGeoLoading(false);
      },
      { timeout: 8000 }
    );
  };

  // Compartilhar onde retirar via WhatsApp
  const compartilharWhatsApp = (item: MedicamentoItem) => {
    const primeiraUnidade = item.unidades_disponiveis[0];
    const texto = `💊 *Consulta de Medicamento SUS - Cuidaê*\n\n` +
      `*Medicamento:* ${item.nome} (${item.forma_farmaceutica})\n` +
      `*Programa:* ${item.programa}\n` +
      `*Tipo de Receita:* ${item.tipo_receita}\n\n` +
      `📍 *Onde Retirar em Garanhuns:*\n` +
      `${primeiraUnidade ? `• ${primeiraUnidade.nome} (${primeiraUnidade.bairro})\n  Endereço: ${primeiraUnidade.endereco}\n  Status: ${primeiraUnidade.status_estoque}` : 'Consulte a Farmácia Central do Município'}\n\n` +
      `⚠️ *Documentos necessários:* Receita médica válida, Cartão SUS e documento com foto.\n\n` +
      `_Acesse o Cuidaê para ver todas as unidades com estoque e rotas no mapa._`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  };

  const copiarTexto = (item: MedicamentoItem) => {
    const primeiraUnidade = item.unidades_disponiveis[0];
    const texto = `${item.nome} - Disponível em ${primeiraUnidade ? primeiraUnidade.nome : 'Farmácia Central'} (${primeiraUnidade ? primeiraUnidade.endereco : 'Garanhuns'}). Leve receita médica, Cartão SUS e RG.`;
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  // Contadores rápidos
  const contagemGratuitos = useMemo(() => {
    return medicamentos.filter(m => m.programa.includes('Farmácia Básica')).length;
  }, [medicamentos]);

  const contagemPopular = useMemo(() => {
    return medicamentos.filter(m => m.programa.includes('Farmácia Popular')).length;
  }, [medicamentos]);

  return (
    <div className="space-y-8 animate-fade-in-up pb-16">
      {/* Header com Badge e Título */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/70 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/70 text-[#2b85ff] dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 mb-2.5">
            <Pill className="w-3.5 h-3.5 text-[#2b85ff]" />
            <span>Farmácia Básica SUS & Farmácia Popular</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#091426] dark:text-white tracking-tight">
            Onde Encontrar Medicamentos
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
            Consulte a lista de remédios gratuitos da RENAME/SUS, descubra os postos de saúde de Garanhuns com estoque e saiba quais documentos levar para retirar.
          </p>
        </div>

        {/* Botão de Localização */}
        <button
          type="button"
          onClick={obterLocalizacao}
          disabled={geoLoading}
          className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-[#2b85ff] dark:hover:border-blue-500 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 shadow-xs hover:shadow-sm transition-all"
        >
          <Navigation className={`w-3.5 h-3.5 text-[#2b85ff] ${geoLoading ? 'animate-spin' : ''}`} />
          <span>{userCoords ? '📍 Distâncias Calculadas' : 'Usar Minha Localização'}</span>
        </button>
      </div>

      {/* Cards de Métricas / Destaque */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Total Cadastrado</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{medicamentos.length}</span>
            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">no catálogo</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">100% Gratuito SUS</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{contagemGratuitos}</span>
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">Farmácia Básica</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Farmácia Popular</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{contagemPopular}</span>
            <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300">Redes privadas</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Pontos em Garanhuns</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">10+</span>
            <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">UBSs e Farmácias</span>
          </div>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="space-y-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Input de Busca */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Digite o nome do remédio ou indicação (ex: Losartana, Dipirona, Asma, Diabetes)..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2b85ff] transition-all"
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filtro de Programa */}
          <select
            value={programa}
            onChange={(e) => setPrograma(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2b85ff]"
          >
            <option value="Todos">Todos os Programas</option>
            <option value="Farmácia Básica">Farmácia Básica SUS (100% Gratuito)</option>
            <option value="Farmácia Popular">Farmácia Popular</option>
          </select>
        </div>

        {/* Chips de Categoria com Scroll Horizontal */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {CATEGORIAS.map((cat) => {
            const isSelected = categoria === cat.valor;
            return (
              <button
                key={cat.valor}
                type="button"
                onClick={() => setCategoria(cat.valor)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                  isSelected
                    ? 'bg-[#2b85ff] text-white shadow-xs'
                    : 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid de Medicamentos */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="inline-block w-8 h-8 border-4 border-[#2b85ff] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Consultando estoque nas farmácias e UBSs...</p>
        </div>
      ) : medicamentos.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 text-center border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Nenhum medicamento encontrado</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Não encontramos resultados para &ldquo;{busca}&rdquo;. Tente pesquisar pelo princípio ativo ou selecione a categoria &ldquo;Todos os Remédios&rdquo;.
          </p>
          <button
            type="button"
            onClick={() => {
              setBusca('');
              setCategoria('Todos');
              setPrograma('Todos');
            }}
            className="px-4 py-2 bg-[#2b85ff] text-white text-xs font-bold rounded-xl hover:bg-blue-600 transition-colors"
          >
            Limpar Filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {medicamentos.map((item) => {
            const isFarmaciaPopular = item.programa.includes('Popular');
            const primeiraUnidade = item.unidades_disponiveis[0];

            return (
              <div
                key={item.id}
                className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs hover:shadow-md hover:border-[#2b85ff]/50 dark:hover:border-blue-500/50 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Badges de Categoria e Programa */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {item.categoria}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                        isFarmaciaPopular
                          ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                          : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {isFarmaciaPopular ? 'Farmácia Popular' : '100% Gratuito SUS'}
                    </span>
                  </div>

                  {/* Nome e Forma Farmacêutica */}
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base group-hover:text-[#2b85ff] dark:group-hover:text-blue-400 transition-colors">
                      {item.nome}
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      {item.principio_ativo} • {item.forma_farmaceutica}
                    </p>
                  </div>

                  {/* Indicação médica */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {item.indicacao}
                  </p>

                  {/* Tipo de Receita */}
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                    <FileText className="w-3.5 h-3.5 text-[#2b85ff] shrink-0" />
                    <span className="truncate">{item.tipo_receita}</span>
                  </div>

                  {/* Prévia da Unidade Mais Próxima */}
                  {primeiraUnidade && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate max-w-[180px]">{primeiraUnidade.nome}</span>
                        </span>
                        {primeiraUnidade.distancia_km != null && (
                          <span className="text-[11px] font-bold text-[#2b85ff] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                            ~{primeiraUnidade.distancia_km} km
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{primeiraUnidade.bairro} • {primeiraUnidade.horario}</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Botão de Ação */}
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMedicamentoSelecionado(item)}
                    className="flex-1 py-2.5 px-3 bg-[#2b85ff] hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <span>Ver Onde Retirar</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => compartilharWhatsApp(item)}
                    title="Compartilhar no WhatsApp"
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Guia Educativo: Como Retirar Remédios no SUS */}
      <div className="bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/50 dark:from-slate-900 dark:via-slate-900/90 dark:to-blue-950/40 rounded-2xl p-6 sm:p-7 border border-blue-100 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#2b85ff] dark:text-blue-400" />
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Guia Rápido: Como Retirar Medicamentos no SUS sem Complicações
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="bg-white/80 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200/70 dark:border-slate-700 space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-[#2b85ff] dark:text-blue-300 font-extrabold text-xs flex items-center justify-center">
              1
            </span>
            <h3 className="font-bold text-xs text-slate-900 dark:text-white">Receita Médica Válida</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              O SUS aceita receitas tanto de médicos do posto/hospital público quanto de médicos particulares ou convênios.
            </p>
          </div>

          <div className="bg-white/80 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200/70 dark:border-slate-700 space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 font-extrabold text-xs flex items-center justify-center">
              2
            </span>
            <h3 className="font-bold text-xs text-slate-900 dark:text-white">Documentos Obrigatórios</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Apresente sempre o <strong>Cartão Nacional do SUS (CNS)</strong>, um documento oficial com foto e comprovante de endereço.
            </p>
          </div>

          <div className="bg-white/80 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200/70 dark:border-slate-700 space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300 font-extrabold text-xs flex items-center justify-center">
              3
            </span>
            <h3 className="font-bold text-xs text-slate-900 dark:text-white">Fique Atento ao Prazo</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Remédios de uso contínuo (pressão, diabetes) têm receita válida por <strong>180 dias</strong>. Antibióticos valem por <strong>10 dias</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* MODAL DETALHADO DO MEDICAMENTO */}
      {medicamentoSelecionado && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 animate-scale-in">
            {/* Top Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950 text-[#2b85ff] dark:text-blue-300">
                  <Pill className="w-3.5 h-3.5" />
                  {medicamentoSelecionado.programa}
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {medicamentoSelecionado.nome}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMedicamentoSelecionado(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Informações Básicas */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 block font-medium">Princípio Ativo</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{medicamentoSelecionado.principio_ativo}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Forma</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{medicamentoSelecionado.forma_farmaceutica}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Receita Exigida</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{medicamentoSelecionado.tipo_receita}</span>
                </div>
              </div>

              {/* Indicação e Como Tomar */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Indicação Terapêutica
                </h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-blue-50/40 dark:bg-blue-950/30 p-3 rounded-xl border border-blue-100/60 dark:border-blue-900/40">
                  {medicamentoSelecionado.indicacao}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Orientações Clínicas e Posologia
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  {medicamentoSelecionado.orientacao_uso}
                </p>
              </div>

              {/* Documentos Obrigatórios */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Documentos Necessários para Retirar no Posto
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {medicamentoSelecionado.documentos_exigidos.map((doc, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 text-xs text-emerald-900 dark:text-emerald-300 font-medium">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{doc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Unidades Disponíveis em Garanhuns */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Unidades e Postos com Estoque em Garanhuns
                  </h4>
                  <span className="text-xs font-bold text-slate-500">
                    {medicamentoSelecionado.unidades_disponiveis.length} locais
                  </span>
                </div>

                <div className="space-y-3">
                  {medicamentoSelecionado.unidades_disponiveis.map((unidade) => (
                    <div
                      key={unidade.id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {unidade.nome}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              unidade.status_estoque === 'Disponível'
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                            }`}
                          >
                            {unidade.status_estoque}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{unidade.endereco}</span>
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {unidade.horario}
                          </span>
                          {unidade.telefone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {unidade.telefone}
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                        {unidade.distancia_km != null && (
                          <span className="text-xs font-bold text-[#2b85ff] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-xl">
                            ~{unidade.distancia_km} km
                          </span>
                        )}
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${unidade.nome} ${unidade.endereco}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-white rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-600 transition-colors shadow-2xs"
                        >
                          <Navigation className="w-3.5 h-3.5 text-[#2b85ff]" />
                          <span>Ver Rota</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-50/80 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => compartilharWhatsApp(medicamentoSelecionado)}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Enviar no WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => copiarTexto(medicamentoSelecionado)}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 text-xs font-semibold transition-colors"
                >
                  {copiado ? 'Copiado!' : 'Copiar Resumo'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setMedicamentoSelecionado(null)}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white text-xs font-bold rounded-xl transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
