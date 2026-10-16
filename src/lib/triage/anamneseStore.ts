import fs from 'fs';
import path from 'path';

const ANAMNESES_DIR = path.resolve(process.cwd(), 'data/anamneses');

export interface AnamneseArquivoJson {
  id: string;
  timestamp: string;
  sintomaRelatado: string;
  historicoConversa: Array<{ remetente: string; texto: string }>;
  anamneseGemini: {
    relatorioClinico: string;
    resumoPT: string;
    sintomasExtraidosPT: string[];
    idade: number;
    sexo: string;
    urgenciaPercebida?: string;
  };
  infermedicaPayload: {
    text: string;
    age: { value: number };
    sex: string;
  };
  infermedicaResultado?: any;
}

/**
 * Garante que o diretório data/anamneses exista.
 */
function ensureAnamnesesDir() {
  if (!fs.existsSync(ANAMNESES_DIR)) {
    fs.mkdirSync(ANAMNESES_DIR, { recursive: true });
  }
}

/**
 * Salva o arquivo JSON gerado pela LLM do Gemini com os dados da conversa
 * antes e depois de enviar para a Infermedica.
 */
export async function salvarArquivoAnamneseJson(dados: AnamneseArquivoJson): Promise<string> {
  ensureAnamnesesDir();
  const filePath = path.join(ANAMNESES_DIR, `anamnese-${dados.id}.json`);
  
  try {
    fs.writeFileSync(filePath, JSON.stringify(dados, null, 2), 'utf-8');
    console.log(`[Anamnese JSON] Arquivo gerado com sucesso: ${filePath}`);
    return filePath;
  } catch (err: any) {
    console.error('[Anamnese JSON] Erro ao salvar arquivo JSON:', err?.message);
    return '';
  }
}
