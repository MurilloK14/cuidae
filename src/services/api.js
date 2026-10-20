const API_BASE = '/api';

/**
 * Busca a mensagem de boas-vindas do chatbot.
 */
export async function fetchBoasVindas() {
  const res = await fetch(`${API_BASE}/triage/welcome`);
  if (!res.ok) throw new Error('Falha ao carregar mensagem de boas-vindas');
  return res.json();
}

/**
 * Envia sintomas em texto para triagem.
 */
export async function enviarSintomas(sintoma, camada, localizacao, historico = []) {
  const body = { sintoma, camada, historico };
  if (localizacao) {
    body.lat = localizacao.lat;
    body.lng = localizacao.lng;
  }

  const res = await fetch(`${API_BASE}/triage/symptoms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.texto || 'Erro ao processar sintomas');
  }
  return res.json();
}

/**
 * Envia uma imagem para análise de triagem.
 */
export async function enviarImagem(arquivo, camada, localizacao) {
  const formData = new FormData();
  formData.append('imagem', arquivo);
  formData.append('camada', camada);
  if (localizacao) {
    formData.append('lat', localizacao.lat.toString());
    formData.append('lng', localizacao.lng.toString());
  }

  const res = await fetch(`${API_BASE}/triage/image`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.texto || 'Erro ao processar imagem');
  }
  return res.json();
}

/**
 * Busca histórico de triagens realizadas pelo paciente.
 */
export async function fetchHistoricoTriagens() {
  const res = await fetch(`${API_BASE}/triage/history`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao carregar histórico');
  }
  return res.json();
}
