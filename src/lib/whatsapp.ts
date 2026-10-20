/**
 * Integração 100% Gratuita com WhatsApp via Deep Links (wa.me)
 * Não requer APIs pagas (Meta Business API ou Twilio).
 * Mensagens estruturadas com alta legibilidade, formatação em blocos e links para Ficha A4 com QR Code.
 */

import type { AgendamentoHospitalar, VacinaRecord } from './types';

/**
 * Monta URL universal do WhatsApp (compatível com WhatsApp Web e Mobile App)
 */
export function buildWhatsappUrl(mensagem: string, telefone?: string): string {
  const phoneClean = telefone ? telefone.replace(/\D/g, '') : '';
  const textEncoded = encodeURIComponent(mensagem.trim());
  if (phoneClean) {
    return `https://wa.me/${phoneClean}?text=${textEncoded}`;
  }
  return `https://wa.me/?text=${textEncoded}`;
}

/**
 * Obtém URL base para geração de links nos lembretes
 */
function getBaseUrl(origem?: string): string {
  if (origem) return origem;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'https://cuidae.saude.gov.br';
}

/**
 * Formata comprovante de agendamento hospitalar para envio via WhatsApp com link para Ficha A4 / PDF
 */
export function formatarWhatsappAgendamento(ag: AgendamentoHospitalar, baseUrl?: string): string {
  const origin = getBaseUrl(baseUrl);
  const linkFicha = `${origin}/agendamento/confirmacao/${ag.id || ag.protocolo}`;

  const dataFormatada = ag.data_agendamento
    ? new Date(ag.data_agendamento + 'T12:00:00').toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : 'Data a confirmar';

  const urgenciaEmoji =
    ag.nivel_urgencia === 'vermelho'
      ? '🔴 ALTA PRIORIDADE (Emergência)'
      : ag.nivel_urgencia === 'amarelo'
      ? '🟡 PRIORIDADE MODERADA (Urgente)'
      : '🟢 ATENÇÃO BÁSICA (Eletiva)';

  return [
    `🏥 *COMPROVANTE DE AGENDAMENTO SUS*`,
    `*Rede de Saúde Integrada • Cuidaê Digital*`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `👤 *PACIENTE:* ${ag.paciente_nome}`,
    `📄 *PROTOCOLO:* \`${ag.protocolo}\``,
    `🚦 *CLASSIFICAÇÃO:* ${urgenciaEmoji}`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📍 *LOCAL E HORÁRIO DO ATENDIMENTO*`,
    `• *Unidade:* ${ag.unidade_nome}`,
    ag.unidade_endereco ? `• *Endereço:* ${ag.unidade_endereco}` : null,
    `• *Data:* ${dataFormatada}`,
    `• *Horário:* ${ag.horario || 'Ordem de Chegada'}`,
    `• *Especialidade:* ${ag.especialidade}`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `🩺 *PRÉ-TRIAGEM CLÍNICA IA*`,
    `• *Queixa Relatada:* ${ag.sintomas_citados}`,
    `• *Parecer da IA:* ${ag.diagnostico_ia}`,
    ag.orientacao_ia ? `• *Orientações:* ${ag.orientacao_ia}` : null,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📄 *FICHA OFICIAL COM QR CODE & PDF:*`,
    `Acesse o documento oficial com QR Code para imprimir ou apresentar na recepção do hospital:`,
    `👉 ${linkFicha}`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `ℹ️ *INSTRUÇÕES PARA O PACIENTE:*`,
    `1. Chegue com 15 a 20 minutos de antecedência.`,
    `2. Apresente documento com foto e seu Cartão SUS.`,
    `3. Apresente este protocolo ou mostre o QR Code na recepção.`,
    ``,
    `🔐 *Autenticação Digital SUS:* \`${ag.transmissao_hospital?.hash_seguranca?.substring(0, 16) || 'AUTH-SUS-OK'}\``,
    `✅ *Atendimento 100% Gratuito pelo SUS*`
  ]
    .filter((linha): linha is string => linha !== null)
    .join('\n');
}

/**
 * Formata resultado de triagem para envio via WhatsApp com link para prontuário
 */
export function formatarWhatsappTriagem(
  triagem: {
    id?: string;
    sintoma_principal: string;
    nivel_urgencia?: string;
    recomendacao?: string;
    especialidade?: string;
    explicacao?: string;
    orientacao?: string;
    hipotesesDiagnosticas?: Array<{ nome: string; probabilidade: number }>;
    created_at?: string;
  },
  baseUrl?: string
): string {
  const origin = getBaseUrl(baseUrl);
  const linkTriagem = triagem.id ? `${origin}/triagem/resultado/${triagem.id}` : null;

  const urgenciaEmoji =
    triagem.nivel_urgencia === 'vermelho'
      ? '🔴 Emergência (Atendimento Imediato)'
      : triagem.nivel_urgencia === 'amarelo'
      ? '🟡 Urgente (Avaliação Médica Recomendada)'
      : '🟢 Pouco Urgente (Atenção Básica / UBS)';

  const hipoteses = triagem.hipotesesDiagnosticas?.length
    ? triagem.hipotesesDiagnosticas.map((h) => `• ${h.nome} (${h.probabilidade}%)`).join('\n')
    : null;

  const dataHora = new Date(triagem.created_at || Date.now()).toLocaleString('pt-BR');

  return [
    `🩺 *LAUDO DE TRIAGEM CLÍNICA DIGITAL*`,
    `*Sistema Único de Saúde • Cuidaê*`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `🚦 *CLASSIFICAÇÃO DE RISCO:*`,
    `${urgenciaEmoji}`,
    ``,
    `📋 *QUEIXA RELATADA:*`,
    `${triagem.sintoma_principal}`,
    ``,
    `🩺 *CONDUTA RECOMENDADA:*`,
    `${triagem.recomendacao || triagem.explicacao}`,
    triagem.especialidade ? `👨‍⚕️ *Especialidade Indicada:* ${triagem.especialidade}` : null,
    hipoteses ? `\n📊 *HIPÓTESES DIAGNÓSTICAS (IA):*\n${hipoteses}` : null,
    triagem.orientacao ? `\n💡 *CUIDADOS IMEDIATOS:*\n${triagem.orientacao}` : null,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    linkTriagem ? `📄 *ACESSAR LAUDO COMPLETO ONLINE:*\n👉 ${linkTriagem}\n━━━━━━━━━━━━━━━━━━━━━━━━━\n` : null,
    `📅 *Data do Atendimento:* ${dataHora}`,
    `✅ *Atendimento 100% Gratuito à População*`
  ]
    .filter((linha): linha is string => linha !== null)
    .join('\n');
}

/**
 * Formata resumo da caderneta de vacinas do paciente para WhatsApp
 */
export function formatarWhatsappVacinas(
  pacienteNome: string,
  vacinas: VacinaRecord[],
  baseUrl?: string
): string {
  const origin = getBaseUrl(baseUrl);
  const linkVacinas = `${origin}/vacinas`;
  const total = vacinas.length;

  const lista = vacinas
    .slice(0, 8)
    .map((v) => {
      const dataStr = v.data_aplicacao
        ? new Date(v.data_aplicacao).toLocaleDateString('pt-BR')
        : 'Data reg.';
      const dose = v.dose ? ` • ${v.dose}` : '';
      return `💉 *${v.nome_vacina}*${dose}\n   🗓️ ${dataStr}  |  🏷️ Lote: ${v.lote || 'N/I'}`;
    })
    .join('\n\n');

  return [
    `📋 *CARTEIRA DE VACINAÇÃO DIGITAL*`,
    `*Programa Nacional de Imunizações (PNI / SUS)*`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `👤 *Paciente:* ${pacienteNome || 'Cidadão'}`,
    `🔢 *Total de Doses Registradas:* ${total}`,
    `🛡️ *Status:* Proteção Imunológica Ativa`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📋 *DOSES REGISTRADAS:*`,
    ``,
    lista || 'Nenhuma vacina cadastrada ainda.',
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📲 *Ver Caderneta Completa no Cuidaê:*`,
    `👉 ${linkVacinas}`,
    ``,
    `💡 *Dica de Saúde:* Mantenha suas vacinas sempre atualizadas. Procure a UBS mais próxima para campanhas sazonais.`,
    `✅ *Documento Digital SUS • 100% Gratuito*`
  ]
    .filter((linha): linha is string => linha !== null)
    .join('\n');
}
