"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  X,
  Send,
  Bot,
  User,
  Building2,
  Calendar,
  Bed,
  CheckCircle2,
  Sparkles,
  MapPin,
  Clock,
} from "lucide-react";

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  options?: { label: string; action: string }[];
  hospitals?: { name: string; distance: string; status: string; beds?: string }[];
  timestamp: string;
}

export const ConsultationModal: React.FC<ConsultationModalProps> = ({
  isOpen,
  onClose,
  initialPrompt,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Reset conversation on open with customized greeting
    const firstBotMessage: Message = {
      id: "1",
      sender: "bot",
      text: "Olá! Sou a assistente de saúde do Cuidaê. Como posso te ajudar hoje?",
      options: [
        { label: "Agendar consulta", action: "consulta" },
        { label: "Verificar leitos de UTI e enfermaria", action: "leitos" },
        { label: "Consultar exames", action: "exames" },
        { label: "Localizar pronto atendimento mais próximo", action: "hospitais" },
      ],
      timestamp: "Agora",
    };

    if (initialPrompt) {
      setMessages([
        firstBotMessage,
        {
          id: "2",
          sender: "user",
          text: initialPrompt,
          timestamp: "Agora",
        },
      ]);
      triggerBotResponse(initialPrompt);
    } else {
      setMessages([firstBotMessage]);
    }
  }, [isOpen, initialPrompt]);

  const triggerBotResponse = (prompt: string) => {
    setIsTyping(true);
    setTimeout(() => {
      let botResponse: Message;

      if (prompt.toLowerCase().includes("leito") || prompt.toLowerCase().includes("uti")) {
        botResponse = {
          id: Date.now().toString(),
          sender: "bot",
          text: "Consultei a rede municipal agora em tempo real. Temos 3 hospitais com leitos liberados próximos à sua localização:",
          hospitals: [
            {
              name: "Hospital Vida",
              distance: "1,1 km",
              status: "Pronto para receber",
              beds: "8 leitos UTI / 16 Enfermaria",
            },
            {
              name: "Hospital Municipal Central",
              distance: "2,3 km",
              status: "Fluxo moderado",
              beds: "11 leitos UTI / 28 Enfermaria",
            },
            {
              name: "Hospital São Lucas",
              distance: "4,7 km",
              status: "Alta disponibilidade",
              beds: "5 leitos UTI / 14 Enfermaria",
            },
          ],
          options: [
            { label: "Reservar encaminhamento emergencial", action: "reservar" },
            { label: "Falar com médico de plantão", action: "plantao" },
          ],
          timestamp: "Agora",
        };
      } else if (prompt.toLowerCase().includes("consulta") || prompt.toLowerCase().includes("agendar")) {
        botResponse = {
          id: Date.now().toString(),
          sender: "bot",
          text: "Encontrei horários para consultas médicas nesta semana nos hospitais credenciados. Qual especialidade você precisa?",
          options: [
            { label: "Clínica Geral (Hoje às 16:30)", action: "clinica" },
            { label: "Cardiologia (Amanhã às 09:15)", action: "cardio" },
            { label: "Ortopedia (Quinta às 11:00)", action: "orto" },
            { label: "Pediatria (Hoje às 17:00)", action: "pedia" },
          ],
          timestamp: "Agora",
        };
      } else {
        botResponse = {
          id: Date.now().toString(),
          sender: "bot",
          text: "Entendido! O Cuidaê está conectado às unidades de saúde da cidade. Nosso assistente pode fazer sua triagem rápida, consultar disponibilidade ou orientar exames.",
          options: [
            { label: "Fazer triagem rápida", action: "triagem" },
            { label: "Verificar leitos disponíveis", action: "leitos" },
            { label: "Falar com atendente humano", action: "humano" },
          ],
          timestamp: "Agora",
        };
      }

      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 700);
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    const text = inputValue.trim();
    setInputValue("");

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: "user",
        text,
        timestamp: "Agora",
      },
    ]);

    triggerBotResponse(text);
  };

  const handleOptionClick = (option: { label: string; action: string }) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: "user",
        text: option.label,
        timestamp: "Agora",
      },
    ]);
    triggerBotResponse(option.label);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col h-[600px] max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#0d1f36] text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#1672eb] flex items-center justify-center text-white">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm">Assistente Cuidaê</h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[11px] text-slate-300">Integração hospitalar em tempo real</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
          {messages.map((msg) => {
            const isBot = msg.sender === "bot";
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isBot ? "items-start" : "items-end"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                    isBot
                      ? "bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs"
                      : "bg-[#0d1f36] text-white rounded-tr-xs"
                  }`}
                >
                  <p>{msg.text}</p>

                  {/* Hospitals cards if available */}
                  {msg.hospitals && (
                    <div className="mt-3 space-y-2">
                      {msg.hospitals.map((h, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-[#1672eb]" />
                              <span>{h.name}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {h.distance} • {h.status}
                            </div>
                            {h.beds && (
                              <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                                {h.beds}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quick Action Pills inside Bot bubble */}
                  {msg.options && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {msg.options.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => handleOptionClick(opt)}
                          className="px-2.5 py-1 rounded-full bg-[#e8f1fc] hover:bg-[#d5e7fc] text-[#1672eb] text-[11px] font-medium border border-[#cbe0fb] transition-all hover:scale-102 active:scale-98 text-left"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400 px-2">
              <Bot className="w-3.5 h-3.5 text-[#1672eb] animate-spin" />
              <span>Cuidaê está digitando...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Digite sua dúvida ou necessidade..."
              className="flex-1 py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-full text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1672eb] focus:bg-white transition-colors"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="w-9 h-9 rounded-full bg-[#1672eb] hover:bg-[#0f60c9] disabled:opacity-40 text-white flex items-center justify-center transition-all flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
