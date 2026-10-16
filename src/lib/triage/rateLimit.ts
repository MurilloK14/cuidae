/**
 * Sistema de Limitação de Requisições e Tokens por Usuário / IP.
 * Protege a cota e orçamento da API do Google Gemini e Infermedica.
 */

interface UserUsage {
  totalTokensEstimados: number;
  totalMensagens: number;
  totalTriagens: number;
  primeiroAcessoHora: number;
  primeiroAcessoDia: number;
}

// Armazenamento em memória dos limites por identificador (IP ou user_id)
const usageMap = new Map<string, UserUsage>();

// CONFIGURAÇÃO DE LIMITES POR USUÁRIO:
export const LIMITES_USUARIO = {
  // Máximo de mensagens/perguntas permitidas por hora (evita flood)
  MAX_MENSAGENS_POR_HORA: 15,
  // Máximo de triagens completadas por dia por usuário
  MAX_TRIAGENS_POR_DIA: 6,
  // Orçamento máximo estimado de tokens por usuário a cada 24 horas
  MAX_TOKENS_POR_DIA: 4000,
  // Máximo de turnos conversacionais permitidos em uma mesma triagem
  MAX_TURNOS_POR_TRIAGEM: 4,
};

function getOrCreateUser(userId: string): UserUsage {
  const agora = Date.now();
  const usuario = usageMap.get(userId);

  if (!usuario) {
    const novo: UserUsage = {
      totalTokensEstimados: 0,
      totalMensagens: 0,
      totalTriagens: 0,
      primeiroAcessoHora: agora,
      primeiroAcessoDia: agora,
    };
    usageMap.set(userId, novo);
    return novo;
  }

  // Reseta janela de 1 hora
  if (agora - usuario.primeiroAcessoHora > 60 * 60 * 1000) {
    usuario.totalMensagens = 0;
    usuario.primeiroAcessoHora = agora;
  }

  // Reseta janela de 24 horas
  if (agora - usuario.primeiroAcessoDia > 24 * 60 * 60 * 1000) {
    usuario.totalTokensEstimados = 0;
    usuario.totalTriagens = 0;
    usuario.primeiroAcessoDia = agora;
  }

  return usuario;
}

export interface ChecagemLimiteResultado {
  permitido: boolean;
  motivo?: string;
  mensagensRestantes?: number;
  tokensRestantes?: number;
}

/**
 * Verifica se o usuário ainda possui cota disponível antes de chamar o Gemini.
 */
export function checarLimiteUsuario(
  identifier: string,
  custoEstimadoTokens = 300
): ChecagemLimiteResultado {
  const usuario = getOrCreateUser(identifier);

  if (usuario.totalMensagens >= LIMITES_USUARIO.MAX_MENSAGENS_POR_HORA) {
    return {
      permitido: false,
      motivo: 'Limite de mensagens por hora atingido. Aguarde alguns instantes antes de enviar nova mensagem.',
    };
  }

  if (usuario.totalTriagens >= LIMITES_USUARIO.MAX_TRIAGENS_POR_DIA) {
    return {
      permitido: false,
      motivo: 'Limite diário de atendimentos de triagem atingido para este usuário.',
    };
  }

  if (usuario.totalTokensEstimados + custoEstimadoTokens > LIMITES_USUARIO.MAX_TOKENS_POR_DIA) {
    return {
      permitido: false,
      motivo: 'Cota diária de processamento por IA atingida para hoje.',
    };
  }

  return {
    permitido: true,
    mensagensRestantes: LIMITES_USUARIO.MAX_MENSAGENS_POR_HORA - usuario.totalMensagens,
    tokensRestantes: LIMITES_USUARIO.MAX_TOKENS_POR_DIA - usuario.totalTokensEstimados,
  };
}

/**
 * Registra o consumo de mensagens e tokens após uma chamada ao Gemini.
 */
export function registrarConsumoUsuario(
  identifier: string,
  tokensConsumidos = 350,
  foiTriagemFinalizada = false
): void {
  const usuario = getOrCreateUser(identifier);
  usuario.totalMensagens += 1;
  usuario.totalTokensEstimados += tokensConsumidos;
  if (foiTriagemFinalizada) {
    usuario.totalTriagens += 1;
  }
}

/**
 * Extrai o identificador único do usuário (user_id ou IP).
 */
export function extrairIdentificadorUsuario(request: Request, bodyUserId?: string): string {
  if (bodyUserId && bodyUserId !== 'anonimo' && bodyUserId.trim().length > 3) {
    return `user_${bodyUserId.trim()}`;
  }

  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const ip = forwardedFor.split(',')[0].trim();
    if (ip) return `ip_${ip}`;
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return `ip_${realIp.trim()}`;

  return 'sessao_padrao';
}
