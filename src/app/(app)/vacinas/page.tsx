"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Syringe,
  ShieldCheck,
  Upload,
  Camera,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  Plus,
  Trash2,
  MapPin,
  Calendar,
  Building2,
  RefreshCw,
  QrCode,
  ArrowRight,
  Info,
  X,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import type { VacinaRecord, ResultadoScanVacinas } from "@/lib/types";
import { buildWhatsappUrl, formatarWhatsappVacinas } from "@/lib/whatsapp";

export default function VacinasPage() {
  const [vacinas, setVacinas] = useState<VacinaRecord[]>([]);
  const [estatisticas, setEstatisticas] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ResultadoScanVacinas | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"todas" | "sus" | "caderneta">("todas");
  const [searchTerm, setSearchTerm] = useState("");
  const [showManualModal, setShowManualModal] = useState(false);
  const [savingManual, setSavingManual] = useState(false);

  // Formulário manual
  const [manualForm, setManualForm] = useState({
    nome_vacina: "",
    dose: "1ª Dose",
    data_aplicacao: new Date().toISOString().split("T")[0],
    lote: "",
    fabricante: "",
    local_aplicacao: "",
    origem_dado: "manual" as "manual" | "meu_sus_digital" | "caderneta_papel",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carrega lista de vacinas
  const carregarVacinas = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/vacinas");
      const data = await res.json();
      if (data.success) {
        setVacinas(data.vacinas || []);
        setEstatisticas(data.estatisticas || null);
      }
    } catch (err) {
      console.error("Erro ao carregar vacinas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarVacinas();
  }, []);

  // Processamento do upload / foto
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setPreviewImage(base64);
      setScanning(true);
      setScanResult(null);

      try {
        const res = await fetch("/api/vacinas/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imagemBase64: base64,
            mimeType: file.type || "image/jpeg",
            autoSalvar: true,
          }),
        });

        const data = await res.json();
        if (data.success) {
          setScanResult(data.analise);
          await carregarVacinas();
        } else {
          alert(`Erro ao processar imagem: ${data.error}`);
        }
      } catch (err: any) {
        alert("Falha na comunicação com o assistente de visão.");
      } finally {
        setScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Salvar vacina manual
  const handleSaveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.nome_vacina.trim()) return;

    try {
      setSavingManual(true);
      const res = await fetch("/api/vacinas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manualForm),
      });

      const data = await res.json();
      if (data.success) {
        setShowManualModal(false);
        setManualForm({
          nome_vacina: "",
          dose: "1ª Dose",
          data_aplicacao: new Date().toISOString().split("T")[0],
          lote: "",
          fabricante: "",
          local_aplicacao: "",
          origem_dado: "manual",
        });
        await carregarVacinas();
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert("Erro ao salvar vacina.");
    } finally {
      setSavingManual(false);
    }
  };

  // Excluir vacina
  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Deseja remover o registro de "${nome}"?`)) return;

    try {
      const res = await fetch(`/api/vacinas?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setVacinas((prev) => prev.filter((v) => v.id !== id));
        await carregarVacinas();
      }
    } catch (err) {
      alert("Erro ao excluir vacina.");
    }
  };

  // Filtros
  const vacinasFiltradas = vacinas.filter((v) => {
    const matchesSearch =
      v.nome_vacina.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.fabricante || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.lote || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.local_aplicacao || "").toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === "sus") {
      return v.origem_dado === "meu_sus_digital" || v.autenticado_sus;
    }
    if (activeTab === "caderneta") {
      return v.origem_dado === "caderneta_papel";
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-fade-in-up pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/80 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center text-[#2b85ff] dark:text-blue-400">
              <Syringe className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#091426] dark:text-white tracking-tight">
                Carteira de Vacinação Digital
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Sincronizada com o <strong>Meu SUS Digital</strong> e leitura inteligente de cadernetas físicas via IA.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {vacinas.length > 0 && (
            <a
              href={buildWhatsappUrl(formatarWhatsappVacinas('Cidadão', vacinas as any))}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 transition shadow-xs"
              title="Compartilhar resumo de vacinas no WhatsApp gratuitamente"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Salvar no</span> WhatsApp
            </a>
          )}

          <button
            onClick={() => setShowManualModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-xs"
          >
            <Plus className="w-4 h-4 text-slate-500" />
            Adicionar Manual
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2b85ff] hover:bg-blue-600 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
          >
            <Camera className="w-4 h-4" />
            Escanear Carteira / Comprovante
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,application/pdf"
            className="hidden"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Total de Doses
          </p>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            {estatisticas?.totalDoses || vacinas.length}
          </p>
          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Registradas no histórico
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Oficiais do SUS
          </p>
          <p className="text-2xl sm:text-3xl font-black text-[#2b85ff] dark:text-blue-400 mt-1">
            {estatisticas?.verificadasSus || 0}
          </p>
          <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Meu SUS Digital / RNDS
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Cadernetas de Papel
          </p>
          <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {estatisticas?.cadernetaFisica || 0}
          </p>
          <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1">
            <FileText className="w-3.5 h-3.5" /> Digitalizadas por foto
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Alertas PNI
          </p>
          <p className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 mt-1">
            {estatisticas?.alertasReforco?.length || 0}
          </p>
          <span className="text-[11px] font-medium text-purple-600 dark:text-purple-400 flex items-center gap-1 mt-1">
            <Sparkles className="w-3.5 h-3.5" /> Doses recomendadas
          </span>
        </div>
      </div>

      {/* Banner de Digitalização Inteligente / Upload */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#091426] via-[#0f2142] to-[#1a386d] text-white shadow-xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
          <QrCode className="w-72 h-72 text-white" />
        </div>

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Reconhecimento Visual Multimodal com Google Gemini Flash
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
            Tire uma foto do seu comprovante ou da sua caderneta de papel
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed">
            O Cuidaê identifica automaticamente o layout do <strong>Meu SUS Digital</strong> (com validação de QR Code) ou as anotações manuscritas e carimbos de <strong>cadernetas físicas de vacinação</strong>, estruturando todas as doses no seu histórico.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={scanning}
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-[#2b85ff] hover:bg-blue-600 text-white font-bold text-sm transition-all shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
            >
              {scanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analisando com Inteligência Artificial...</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  <span>Fotografar ou Enviar Imagem</span>
                </>
              )}
            </button>

            <span className="text-xs text-slate-400">
              Formatos aceitos: JPG, PNG, WEBP ou PDF
            </span>
          </div>
        </div>
      </div>

      {/* Modal / Feedback de Escaneamento Concluído */}
      {scanResult && (
        <div className="p-6 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 animate-in fade-in space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                  {scanResult.tipo_documento_detectado === "meu_sus_digital"
                    ? "Carteira do Meu SUS Digital Identificada"
                    : "Caderneta Física de Vacinação Processada"}
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  {scanResult.resumo_clinico} (Confiança de leitura: {scanResult.confianca_leitura}%)
                </p>
              </div>
            </div>
            <button
              onClick={() => setScanResult(null)}
              className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {scanResult.vacinas_extraidas.map((vac, idx) => (
              <div
                key={idx}
                className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-100 dark:border-emerald-900/60 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">{vac.nome_vacina}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 font-semibold text-[10px]">
                    {vac.dose}
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Aplicada em: {vac.data_aplicacao} • Lote: {vac.lote || "Não especificado"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alertas Preventivos do Calendário PNI */}
      {estatisticas?.alertasReforco && estatisticas.alertasReforco.length > 0 && (
        <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-sm">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Orientações de Imunização Recomendadas pelo SUS</span>
            </div>
            <Link
              href="/unidades?categoria=ubs"
              className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-300 hover:underline"
            >
              Ver UBS mais próxima com sala de vacina <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {estatisticas.alertasReforco.map((alerta: any, i: number) => (
              <div
                key={i}
                className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-amber-200/60 dark:border-amber-900/40 text-xs space-y-1"
              >
                <span className="font-bold text-slate-900 dark:text-slate-100">{alerta.vacina}</span>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  {alerta.motivo}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("todas")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "todas"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
            }`}
          >
            Todas ({vacinas.length})
          </button>
          <button
            onClick={() => setActiveTab("sus")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "sus"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
            }`}
          >
            Meu SUS Digital ({vacinas.filter((v) => v.origem_dado === "meu_sus_digital" || v.autenticado_sus).length})
          </button>
          <button
            onClick={() => setActiveTab("caderneta")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "caderneta"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
            }`}
          >
            Caderneta Física ({vacinas.filter((v) => v.origem_dado === "caderneta_papel").length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por vacina, lote ou posto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#2b85ff]"
          />
        </div>
      </div>

      {/* Lista de Vacinas */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#2b85ff]" />
          <p className="text-sm font-medium">Carregando carteira de vacinas...</p>
        </div>
      ) : vacinasFiltradas.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#2b85ff] flex items-center justify-center mx-auto">
            <Syringe className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Nenhuma vacina encontrada nesta categoria
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Envie uma foto do aplicativo Meu SUS Digital ou da sua caderneta de papel para digitalizar seu histórico.
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2b85ff] text-white text-xs font-bold hover:bg-blue-600 transition"
          >
            <Camera className="w-4 h-4" /> Escanear Carteira Agora
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vacinasFiltradas.map((vac) => {
            const isOficialSus = vac.origem_dado === "meu_sus_digital" || vac.autenticado_sus;

            return (
              <div
                key={vac.id}
                className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-400/50 dark:hover:border-blue-500/40 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                          {vac.nome_vacina}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/80 text-[#2b85ff] dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                          {vac.dose}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {vac.fabricante || "Fabricante oficial SUS"}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDelete(vac.id, vac.nome_vacina)}
                      className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 p-1.5 rounded-lg transition"
                      title="Excluir vacina"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{vac.data_aplicacao}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                        Lote: {vac.lote || "S/L"}
                      </span>
                    </div>
                  </div>

                  {vac.local_aplicacao && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{vac.local_aplicacao}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isOficialSus
                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60"
                        : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60"
                    }`}
                  >
                    {isOficialSus ? (
                      <>
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        Validado no Meu SUS Digital
                      </>
                    ) : (
                      <>
                        <FileText className="w-3 h-3 text-amber-600" />
                        Caderneta Física de Papel
                      </>
                    )}
                  </span>

                  {vac.data_proxima_dose && (
                    <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                      Próxima dose: {vac.data_proxima_dose}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Manual */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Adicionar Registro de Vacina
              </h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManual} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nome da Vacina *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Febre Amarela, COVID-19, Hepatite B"
                  value={manualForm.nome_vacina}
                  onChange={(e) => setManualForm({ ...manualForm, nome_vacina: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-[#2b85ff]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Dose
                  </label>
                  <select
                    value={manualForm.dose}
                    onChange={(e) => setManualForm({ ...manualForm, dose: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-[#2b85ff]"
                  >
                    <option value="1ª Dose">1ª Dose</option>
                    <option value="2ª Dose">2ª Dose</option>
                    <option value="3ª Dose">3ª Dose</option>
                    <option value="Reforço">Reforço</option>
                    <option value="Dose Única">Dose Única</option>
                    <option value="Dose Anual">Dose Anual</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Data da Aplicação
                  </label>
                  <input
                    type="date"
                    required
                    value={manualForm.data_aplicacao}
                    onChange={(e) => setManualForm({ ...manualForm, data_aplicacao: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-[#2b85ff]"
                  >
                  </input>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Fabricante / Laboratório
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Fiocruz, Butantan, Pfizer"
                    value={manualForm.fabricante}
                    onChange={(e) => setManualForm({ ...manualForm, fabricante: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-[#2b85ff]"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Lote
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 240INF01"
                    value={manualForm.lote}
                    onChange={(e) => setManualForm({ ...manualForm, lote: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-[#2b85ff]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Local / Unidade de Saúde (UBS)
                </label>
                <input
                  type="text"
                  placeholder="Ex: UBS Severiano Moraes Filho - Garanhuns"
                  value={manualForm.local_aplicacao}
                  onChange={(e) => setManualForm({ ...manualForm, local_aplicacao: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-[#2b85ff]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Origem do Registro
                </label>
                <select
                  value={manualForm.origem_dado}
                  onChange={(e) => setManualForm({ ...manualForm, origem_dado: e.target.value as any })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-[#2b85ff]"
                >
                  <option value="caderneta_papel">Caderneta de Papel (Infância / Adulto)</option>
                  <option value="meu_sus_digital">Meu SUS Digital / Conecte SUS</option>
                  <option value="manual">Registro Manual Avulso</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingManual}
                  className="px-5 py-2.5 rounded-xl bg-[#2b85ff] hover:bg-blue-600 text-white font-bold transition shadow-sm disabled:opacity-50"
                >
                  {savingManual ? "Salvando..." : "Salvar Vacina"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
