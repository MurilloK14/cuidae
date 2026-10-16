export function mapearUrgencia(prioridade: string) {
  switch (prioridade) {
    case 'Urgente':
      return { nivel_urgencia: 'vermelho' as const, recomendacao: 'upa' as const };
    case 'Alta':
    case 'Média':
      return { nivel_urgencia: 'amarelo' as const, recomendacao: 'ubs' as const };
    case 'Normal':
    default:
      return { nivel_urgencia: 'verde' as const, recomendacao: 'teleconsulta' as const };
  }
}

export function getLocal(camada: string, prioridade: string, tipoUnidade: string): string {
  if (prioridade === 'Urgente') {
    return 'UPA / Pronto-Socorro mais próximo — SAMU 192';
  }

  switch (camada) {
    case 'Premium':
      return 'Teleconsulta Imediata com Especialista';
    case 'Intermediário':
      return 'Teleconsulta com Especialista (Atendimento em até 24h)';
    case 'Gratuito':
    default:
      if (tipoUnidade === 'CAPS') return 'CAPS mais próximo';
      if (tipoUnidade === 'UPA') return 'UPA mais próxima';
      return 'UBS Mais Próxima (Atendimento Presencial)';
  }
}

export function gerarLinkMaps(lat: number | null, lng: number | null, tipoUnidade: string) {
  const TERMOS_BUSCA: Record<string, string | null> = {
    UBS: 'UBS Unidade Básica de Saúde',
    UPA: 'UPA Unidade de Pronto Atendimento',
    Hospital: 'Hospital pronto socorro',
    CAPS: 'CAPS Centro de Atenção Psicossocial',
    SAMU: null
  };

  const termo = TERMOS_BUSCA[tipoUnidade] || TERMOS_BUSCA['UBS'];
  if (!termo) {
    return {
      label: '🚑 Ligue SAMU: 192',
      url: 'tel:192',
      tipo: 'telefone'
    };
  }

  const termoEncoded = encodeURIComponent(termo);
  const url = lat && lng
    ? `https://www.google.com/maps/search/${termoEncoded}/@${lat},${lng},14z`
    : `https://www.google.com/maps/search/${termoEncoded}`;

  return {
    label: `📍 Ver ${tipoUnidade} mais próxima no Google Maps`,
    url,
    tipo: 'mapa'
  };
}
