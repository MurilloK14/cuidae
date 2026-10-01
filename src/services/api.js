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
export async function enviarSintomas(sintoma, camada) {
  const res = await fetch(`${API_BASE}/triage/symptoms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sintoma, camada })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao processar sintomas');
  }
  return res.json();
}

/**
 * Envia uma imagem para análise de triagem.
 */
export async function enviarImagem(arquivo, camada) {
  const formData = new FormData();
  formData.append('imagem', arquivo);
  formData.append('camada', camada);

  const res = await fetch(`${API_BASE}/triage/image`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao processar imagem');
  }
  return res.json();
}
