/**
 * Utilitário para sintetizar voz natural, humanizada e fluida em Português (Brasil).
 * Seleciona as vozes neurais / naturais do navegador (Google, Microsoft, Apple)
 * e higieniza marcações, emojis e formatações médicas.
 */

export function obterMelhorVozPTBR(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  const vozes = window.speechSynthesis.getVoices();
  if (!vozes || vozes.length === 0) return null;

  // Prioridade 1: Vozes online neurais ou naturais de alta qualidade em pt-BR
  const preferenciaPrioritaria = [
    'Microsoft Francisca Online (Natural) - Portuguese (Brazil)',
    'Microsoft Antonio Online (Natural) - Portuguese (Brazil)',
    'Google português do Brasil',
    'Luciana',
    'Felipe',
    'Francisca',
    'Antonio',
    'Maria',
    'Heloisa',
    'pt-BR-Wavenet',
    'pt-BR-Neural2'
  ];

  for (const nomePref of preferenciaPrioritaria) {
    const voz = vozes.find(
      (v) =>
        (v.lang || '').toLowerCase().replace('_', '-').startsWith('pt-br') &&
        v.name.toLowerCase().includes(nomePref.toLowerCase())
    );
    if (voz) return voz;
  }

  // Prioridade 2: Qualquer voz explicitamente pt-BR
  const vozPtBr = vozes.find((v) => (v.lang || '').toLowerCase().replace('_', '-').startsWith('pt-br'));
  if (vozPtBr) return vozPtBr;

  // Prioridade 3: Qualquer voz em Português
  return vozes.find((v) => (v.lang || '').toLowerCase().startsWith('pt')) || null;
}

export function limparTextoParaFala(texto: string): string {
  if (!texto) return '';

  return texto
    // Remove links
    .replace(/https?:\/\/\S+/g, '')
    // Remove caracteres especiais de emojis usando regex compatível com ES5/ES6
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')
    .replace(/[\u2600-\u27BF]/g, '')
    // Remove marcadores de markdown e pontuações estranhas
    .replace(/[*#_~`>\[\]\(\)]/g, ' ')
    .replace(/[•\-\–\—]/g, ' ')
    // Normaliza siglas médicas para pronúncia correta pausada
    .replace(/\bUPA\b/g, 'U-P-A')
    .replace(/\bUBS\b/g, 'U-B-S')
    .replace(/\bSAMU\b/g, 'Samu')
    .replace(/\bSUS\b/g, 'Sus')
    .replace(/\bCOVID\b/gi, 'Cóvid')
    // Remove espaços repetidos
    .replace(/\s+/g, ' ')
    .trim();
}

export function falarTexto(
  texto: string,
  opcoes?: {
    rate?: number;
    pitch?: number;
    onEnd?: () => void;
    onError?: () => void;
  }
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  const synth = window.speechSynthesis;
  // Cancela qualquer fala pendente para evitar sobreposição ou filas congeladas
  synth.cancel();

  const textoLimpo = limparTextoParaFala(texto);
  if (!textoLimpo) return;

  const executarFala = () => {
    const utterance = new SpeechSynthesisUtterance(textoLimpo);
    utterance.lang = 'pt-BR';
    utterance.rate = opcoes?.rate || 1.05; // Cadência humana suave ligeiramente acelerada
    utterance.pitch = opcoes?.pitch || 1.0;

    const melhorVoz = obterMelhorVozPTBR();
    if (melhorVoz) {
      utterance.voice = melhorVoz;
    }

    if (opcoes?.onEnd) utterance.onend = opcoes.onEnd;
    if (opcoes?.onError) utterance.onerror = opcoes.onError;

    synth.speak(utterance);
  };

  // No Chrome e Edge, getVoices() pode ser carregado assincronamente
  if (synth.getVoices().length === 0) {
    synth.onvoiceschanged = () => {
      synth.onvoiceschanged = null;
      executarFala();
    };
  } else {
    executarFala();
  }
}
