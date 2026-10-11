/**
 * Serviço de localização.
 * 
 * Determina o tipo de unidade de saúde e gera o link
 * do Google Maps para a unidade mais próxima do paciente.
 */

// Mapeamento de tipo de unidade → termo de busca no Google Maps
const TERMOS_BUSCA = {
  'UBS': 'UBS Unidade Básica de Saúde',
  'UPA': 'UPA Unidade de Pronto Atendimento',
  'Hospital': 'Hospital pronto socorro',
  'CAPS': 'CAPS Centro de Atenção Psicossocial',
  'SAMU': null // SAMU é ligação telefônica, não busca no mapa
};

/**
 * Determina o local de atendimento com base na camada, prioridade e tipo de unidade.
 */
export function getLocal(camada, prioridade, tipoUnidade) {
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

/**
 * Gera o link do Google Maps para buscar a unidade de saúde mais próxima
 * da localização do paciente.
 * 
 * @param {number} lat - Latitude do paciente
 * @param {number} lng - Longitude do paciente
 * @param {string} tipoUnidade - Tipo: UBS, UPA, Hospital, CAPS, SAMU
 * @returns {object} - { url, label } ou null se não aplicável
 */
export function gerarLinkMaps(lat, lng, tipoUnidade) {
  const termo = TERMOS_BUSCA[tipoUnidade] || TERMOS_BUSCA['UBS'];
  
  // Se for SAMU, não tem link de mapa
  if (!termo) {
    return {
      label: '🚑 Ligue SAMU: 192',
      url: 'tel:192',
      tipo: 'telefone'
    };
  }

  const termoEncoded = encodeURIComponent(termo);
  const url = (lat && lng)
    ? `https://www.google.com/maps/search/${termoEncoded}/@${lat},${lng},14z`
    : `https://www.google.com/maps/search/${termoEncoded}`;

  return {
    label: `📍 Ver ${tipoUnidade} mais próxima no Google Maps`,
    url,
    tipo: 'mapa'
  };
}
