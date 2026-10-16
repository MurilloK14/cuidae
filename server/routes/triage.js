import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import upload from '../middleware/upload.js';
import {
  conduzirAnamneseOuDiagnostico,
  gerarRelatorioImagem,
  humanizarResultadoFinal,
  avaliarSintomas,
  avaliarImagem
} from '../services/geminiService.js';
import {
  fluxoCompleto,
  formatarResultadoInfermedica,
  traduzirNomeCondicao,
  traduzirNomeSintoma
} from '../services/infermedicaService.js';
import { getLocal, gerarLinkMaps } from '../services/locationService.js';
import { saveTriagem, getTriagemById, getAllTriagens } from '../services/dbService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ANAMNESES_DIR = path.resolve(__dirname, '../../data/anamneses');

function salvarJsonAnamneseLocal(dados) {
  try {
    if (!fs.existsSync(ANAMNESES_DIR)) {
      fs.mkdirSync(ANAMNESES_DIR, { recursive: true });
    }
    const filePath = path.join(ANAMNESES_DIR, `anamnese-${dados.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(dados, null, 2), 'utf-8');
    console.log(`[Express Anamnese JSON] Arquivo gerado: ${filePath}`);
  } catch (err) {
    console.error('[Express Anamnese JSON] Falha ao salvar arquivo:', err.message);
  }
}

const router = Router();

const GEMINI_ATIVO = Boolean(
  process.env.GEMINI_API_KEY &&
  process.env.GEMINI_API_KEY !== 'SUA_CHAVE_AQUI' &&
  process.env.GEMINI_API_KEY !== 'sua_chave_gemini_aqui'
);

const INFERMEDICA_ATIVA = Boolean(
  process.env.INFERMEDICA_APP_ID &&
  process.env.INFERMEDICA_APP_ID !== 'SEU_APP_ID_AQUI' &&
  process.env.INFERMEDICA_APP_ID !== 'seu_app_id_aqui' &&
  process.env.INFERMEDICA_APP_KEY &&
  process.env.INFERMEDICA_APP_KEY !== 'SUA_APP_KEY_AQUI' &&
  process.env.INFERMEDICA_APP_KEY !== 'sua_app_key_aqui'
);

console.log(`[Config Express] Gemini: ${GEMINI_ATIVO ? '✅' : '❌'} | Infermedica: ${INFERMEDICA_ATIVA ? '✅' : '❌'}`);
console.log(`[Config Express] Modo integrado (Gemini -> Infermedica -> Gemini): ${GEMINI_ATIVO && INFERMEDICA_ATIVA ? '✅ ATIVO' : '⚠️ Parcial'}`);

// Mapeia prioridade para nível de urgência do SUS/Manchester
function mapearUrgencia(prioridade) {
  switch (prioridade) {
    case 'Urgente':
      return { nivel_urgencia: 'vermelho', recomendacao: 'upa' };
    case 'Alta':
    case 'Média':
      return { nivel_urgencia: 'amarelo', recomendacao: 'ubs' };
    case 'Normal':
    default:
      return { nivel_urgencia: 'verde', recomendacao: 'teleconsulta' };
  }
}

/**
 * GET /api/triage/welcome
 */
router.get('/welcome', (_req, res) => {
  res.json({
    texto: "Olá! Sou o assistente de triagem médica do SaúdePraTodos. Descreva com suas palavras o que você está sentindo ou envie uma foto, e nosso sistema médico (Gemini + Infermedica) fará sua triagem completa!"
  });
});

/**
 * GET /api/triage/history
 */
router.get('/history', (_req, res) => {
  try {
    const list = getAllTriagens();
    res.json({ triagens: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/triage/resultado/:id
 */
router.get('/resultado/:id', (req, res) => {
  try {
    const triagem = getTriagemById(req.params.id);
    if (!triagem) {
      return res.status(404).json({ error: 'Triagem não encontrada' });
    }
    res.json(triagem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/triage/symptoms
 * 
 * FLUXO INTEGRADO COM ECONOMIA DE CHAMADAS DA INFERMEDICA:
 * 1. O paciente envia o relato.
 * 2. O Gemini conduz a anamnese conversacional.
 * 3. Se ainda faltam dados, responde com perguntas sem acionar a Infermedica (ECONOMIA DE API).
 * 4. Quando pronto para o diagnóstico, gera o arquivo JSON com os achados clínicos.
 * 5. Envia o JSON clínico para a Infermedica e humaniza com o Gemini.
 */
router.post('/symptoms', async (req, res) => {
  const { sintoma, camada, lat, lng, user_id, historico = [] } = req.body;

  if (!sintoma || !sintoma.trim()) {
    return res.status(400).json({ error: 'O campo "sintoma" é obrigatório.' });
  }

  const camadaValida = ['Gratuito', 'Intermediário', 'Premium'].includes(camada) ? camada : 'Gratuito';

  try {
    console.log('\n--- [NOVO ATENDIMENTO DE SINTOMAS - EXPRESS] ---');
    console.log('1. Mensagem do paciente:', sintoma);

    let anamnese = null;

    if (GEMINI_ATIVO) {
      try {
        anamnese = await conduzirAnamneseOuDiagnostico(sintoma, historico);
        console.log(`[Express Anamnese] Pronto para diagnóstico? ${anamnese.prontoParaDiagnostico ? 'SIM' : 'NÃO (Continuar conversa)'}`);
      } catch (errAnamnese) {
        console.warn('[Express Anamnese] Erro:', errAnamnese.message);
      }
    }

    // FASE CONVERSACIONAL (Economia de chamadas Infermedica)
    if (anamnese && !anamnese.prontoParaDiagnostico) {
      return res.json({
        remetente: 'bot',
        texto: anamnese.mensagem,
        triagem: null,
        prontoParaDiagnostico: false,
        timestamp: new Date().toISOString()
      });
    }

    // FASE DE DIAGNÓSTICO
    const triageId = crypto.randomUUID();

    // Consolida todas as falas do paciente para não perder a queixa inicial em respostas curtas (ex: "4", "sim")
    const falasHistorico = (historico || [])
      .filter((m) => m && m.remetente === 'usuario' && m.texto)
      .map((m) => m.texto);
    if (!falasHistorico.includes(sintoma)) {
      falasHistorico.push(sintoma);
    }
    const queixaCompleta = falasHistorico.join('. ');

    const relatorioValido = anamnese?.relatorioClinico &&
      anamnese.relatorioClinico.trim().length > 4 &&
      !/^\d+$/.test(anamnese.relatorioClinico.trim());

    const relatorioClinico = relatorioValido
      ? anamnese.relatorioClinico
      : queixaCompleta;

    const idade = anamnese?.idade || 30;
    const sexo = anamnese?.sexo || 'male';

    // Salva o arquivo JSON com o relato e os termos médicos compilados
    salvarJsonAnamneseLocal({
      id: triageId,
      timestamp: new Date().toISOString(),
      sintomaRelatado: falasHistorico[0] || sintoma,
      detalhesAdicionais: sintoma,
      historicoConversa: historico,
      anamneseGemini: {
        relatorioClinico,
        resumoPT: anamnese?.resumoPT || queixaCompleta,
        sintomasExtraidosPT: anamnese?.sintomasExtraidosPT || falasHistorico,
        idade,
        sexo,
        urgenciaPercebida: anamnese?.urgenciaPercebida || 'Normal'
      },
      infermedicaPayload: {
        text: relatorioClinico,
        age: { value: idade },
        sexo
      }
    });

    let formatado = null;
    let fonteIA = 'Gemini 3.5 Flash + Infermedica v3';

    if (INFERMEDICA_ATIVA) {
      try {
        console.log('2. [Infermedica] Consultando motor clínico com os dados JSON...');
        const resultadoInfermedica = await fluxoCompleto(relatorioClinico, { idade, sexo });

        try {
          console.log('3. [Gemini] Humanizando diagnóstico final para o paciente...');
          formatado = await humanizarResultadoFinal(sintoma, relatorioClinico, resultadoInfermedica, camadaValida);
        } catch (errHumanizacao) {
          console.warn('⚠️ Fallback na humanização (usando formatador interno):', errHumanizacao.message);
          formatado = formatarResultadoInfermedica(resultadoInfermedica);
        }
      } catch (pipelineErr) {
        console.warn('⚠️ Falha no pipeline Infermedica:', pipelineErr.message);
      }
    }

    if (!formatado) {
      console.log('ℹ️ Usando avaliação de sintomas direta');
      const direto = await avaliarSintomas(sintoma, historico);
      formatado = direto;
      fonteIA = direto.fonteIA || 'Google Gemini Flash';
    }

    const tipoUnidade = formatado.tipoUnidade || 'UBS';
    const local = getLocal(camadaValida, formatado.prioridade, tipoUnidade);
    const linkMaps = gerarLinkMaps(lat, lng, tipoUnidade);
    const mapeamento = mapearUrgencia(formatado.prioridade);

    const salvaNoBanco = saveTriagem({
      id: triageId,
      user_id: user_id || 'anonimo',
      sintoma_principal: falasHistorico[0] || sintoma,
      duracao: req.body.duracao || 'Não informada',
      intensidade: req.body.intensidade || 5,
      respostas: req.body.respostas || [{ pergunta: 'sintoma_principal', resposta: sintoma }],
      nivel_urgencia: mapeamento.nivel_urgencia,
      recomendacao: mapeamento.recomendacao,
      especialidade: formatado.especialidade,
      explicacao: formatado.mensagem,
      orientacao: formatado.orientacao,
      tipoUnidade,
      mapa: linkMaps,
      fonteIA,
      cidade_snapshot: req.body.cidade || 'São Paulo',
      uf_snapshot: req.body.uf || 'SP'
    });

    const hipotesesDiagnosticas = resultadoInfermedica?.diagnostico?.conditions
      ? resultadoInfermedica.diagnostico.conditions.slice(0, 3).map((c) => ({
          nome: traduzirNomeCondicao(c.common_name || c.name),
          probabilidade: Math.round(c.probability * 100)
        }))
      : [];

    const sintomasInfermedica = resultadoInfermedica?.evidencias
      ? resultadoInfermedica.evidencias.map((e) => traduzirNomeSintoma(e.name))
      : [];

    return res.json({
      id: salvaNoBanco.id,
      remetente: 'bot',
      texto: formatado.mensagem,
      triagem: {
        id: salvaNoBanco.id,
        recomendacao: formatado.recomendacao,
        especialidade: formatado.especialidade,
        local,
        prioridade: formatado.prioridade,
        orientacao: formatado.orientacao,
        tipoUnidade,
        nivel_urgencia: mapeamento.nivel_urgencia,
        hipotesesDiagnosticas,
        sintomasInfermedica
      },
      mapa: linkMaps,
      fonteIA,
      prontoParaDiagnostico: true,
      relatorioFormal: relatorioClinico,
      timestamp: salvaNoBanco.created_at
    });

  } catch (err) {
    console.error('❌ Erro no fluxo integrado:', err.message);
    return res.status(500).json({
      remetente: 'bot',
      texto: `🚨 Erro no processamento de triagem: ${err.message}`,
      triagem: null,
      fonteIA: 'erro-api',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/triage/image
 */
router.post('/image', upload.single('imagem'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhuma imagem foi enviada.' });
  }

  const camada = req.body.camada || 'Gratuito';
  const lat = req.body.lat ? parseFloat(req.body.lat) : null;
  const lng = req.body.lng ? parseFloat(req.body.lng) : null;
  const camadaValida = ['Gratuito', 'Intermediário', 'Premium'].includes(camada) ? camada : 'Gratuito';

  try {
    console.log('\n--- [NOVO ATENDIMENTO DE IMAGEM - EXPRESS] ---');
    let formatado = null;
    let fonteIA = 'Gemini (Visão) + Infermedica v3';

    if (GEMINI_ATIVO && INFERMEDICA_ATIVA) {
      try {
        console.log('1. [Gemini] Analisando imagem e criando laudo visual formal...');
        const relatorioImagem = await gerarRelatorioImagem(req.file.path, req.file.mimetype);
        console.log('   Laudo gerado:', relatorioImagem.relatorioClinico);

        console.log('2. [Infermedica] Consultando motor clínico...');
        const resultadoInfermedica = await fluxoCompleto(relatorioImagem.relatorioClinico, {
          idade: relatorioImagem.idade,
          sexo: relatorioImagem.sexo
        });

        try {
          console.log('3. [Gemini] Humanizando resposta da imagem...');
          formatado = await humanizarResultadoFinal('Imagem dermatológica enviada pelo paciente', relatorioImagem, resultadoInfermedica, camadaValida);
        } catch {
          formatado = formatarResultadoInfermedica(resultadoInfermedica);
        }
      } catch (pipelineErr) {
        console.warn('⚠️ Falha no pipeline de imagem Gemini + Infermedica:', pipelineErr.message);
      }
    }

    if (!formatado) {
      console.log('ℹ️ Usando avaliação de imagem direta');
      const direto = await avaliarImagem(req.file.path, req.file.mimetype);
      formatado = direto;
      fonteIA = direto.fonteIA || 'Google Gemini Vision';
    }

    const tipoUnidade = formatado.tipoUnidade || 'UBS';
    const local = getLocal(camadaValida, formatado.prioridade, tipoUnidade);
    const linkMaps = gerarLinkMaps(lat, lng, tipoUnidade);
    const mapeamento = mapearUrgencia(formatado.prioridade);

    const salvaNoBanco = saveTriagem({
      user_id: req.body.user_id || 'anonimo',
      sintoma_principal: req.body.sintoma || 'Lesão cutânea / foto enviada para análise dermatológica',
      duracao: req.body.duracao || 'Não informada',
      intensidade: req.body.intensidade || 5,
      respostas: [{ pergunta: 'foto', resposta: req.file.originalname }],
      nivel_urgencia: mapeamento.nivel_urgencia,
      recomendacao: mapeamento.recomendacao,
      especialidade: formatado.especialidade || 'Dermatologia',
      explicacao: formatado.mensagem,
      orientacao: formatado.orientacao,
      tipoUnidade,
      mapa: linkMaps,
      foto_storage_path: req.file.path,
      fonteIA,
      cidade_snapshot: req.body.cidade || 'São Paulo',
      uf_snapshot: req.body.uf || 'SP'
    });

    return res.json({
      id: salvaNoBanco.id,
      remetente: 'bot',
      texto: formatado.mensagem,
      triagem: {
        id: salvaNoBanco.id,
        recomendacao: formatado.recomendacao,
        especialidade: formatado.especialidade,
        local,
        prioridade: formatado.prioridade,
        orientacao: formatado.orientacao,
        tipoUnidade,
        nivel_urgencia: mapeamento.nivel_urgencia
      },
      mapa: linkMaps,
      fonteIA,
      arquivoRecebido: req.file.originalname,
      timestamp: salvaNoBanco.created_at
    });

  } catch (err) {
    console.error('❌ Erro no fluxo de imagem:', err.message);
    return res.status(500).json({
      remetente: 'bot',
      texto: `🚨 Erro na análise médica da imagem: ${err.message}`,
      triagem: null,
      fonteIA: 'erro-api',
      arquivoRecebido: req.file.originalname,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
