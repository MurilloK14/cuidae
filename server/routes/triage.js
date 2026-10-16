import { Router } from 'express';
import upload from '../middleware/upload.js';
import { gerarRelatorioFormal, gerarRelatorioImagem, humanizarResultadoFinal } from '../services/geminiService.js';
import { fluxoCompleto, formatarResultadoInfermedica } from '../services/infermedicaService.js';
import { getLocal, gerarLinkMaps } from '../services/locationService.js';

const router = Router();

const GEMINI_ATIVO = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'SUA_CHAVE_AQUI');
const INFERMEDICA_ATIVA = Boolean(
  process.env.INFERMEDICA_APP_ID &&
  process.env.INFERMEDICA_APP_ID !== 'SEU_APP_ID_AQUI' &&
  process.env.INFERMEDICA_APP_KEY &&
  process.env.INFERMEDICA_APP_KEY !== 'SUA_APP_KEY_AQUI'
);

console.log(`[Config] Gemini: ${GEMINI_ATIVO ? '✅' : '❌'} | Infermedica: ${INFERMEDICA_ATIVA ? '✅' : '❌'}`);
console.log(`[Config] Modo integrado (Gemini -> Infermedica -> Gemini): ${GEMINI_ATIVO && INFERMEDICA_ATIVA ? '✅ ATIVO' : '⚠️ Parcial'}`);

/**
 * GET /api/triage/welcome
 */
router.get('/welcome', (_req, res) => {
  res.json({
    texto: "Olá! Sou o assistente de triagem médica do SaúdePraTodos. Descreva com suas palavras o que você está sentindo ou envie uma foto, e nosso sistema médico (Gemini + Infermedica) fará sua triagem completa!"
  });
});

/**
 * POST /api/triage/symptoms
 * 
 * FLUXO INTEGRADO:
 * 1. O paciente envia o relato (em linguagem natural/informal em PT).
 * 2. O Gemini processa o relato e constrói um RELATÓRIO FORMAL MÉDICO em inglês clínico.
 * 3. O relatório formal alimenta o motor de diagnóstico da Infermedica v3 (/parse -> /diagnosis -> /triage).
 * 4. O Gemini recebe o resultado da Infermedica e responde de forma empática e humanizada com o encaminhamento e mapa.
 */
router.post('/symptoms', async (req, res) => {
  const { sintoma, camada, lat, lng } = req.body;

  if (!sintoma || !sintoma.trim()) {
    return res.status(400).json({ error: 'O campo "sintoma" é obrigatório.' });
  }

  const camadaValida = ['Gratuito', 'Intermediário', 'Premium'].includes(camada) ? camada : 'Gratuito';

  try {
    console.log('\n--- [NOVO ATENDIMENTO DE SINTOMAS] ---');
    console.log('1. Mensagem do paciente:', sintoma);

    // ETAPA 1: Gemini elabora o relatório médico formal
    console.log('2. [Gemini] Criando relatório formal em inglês clínico...');
    const relatorioGemini = await gerarRelatorioFormal(sintoma);
    console.log('   Relatório gerado:', relatorioGemini.relatorioClinico);
    console.log('   Sintomas identificados:', relatorioGemini.sintomasExtraidosPT.join(', '));

    // ETAPA 2: Infermedica processa o relatório formal
    console.log('3. [Infermedica] Consultando motor clínico de diagnóstico e triagem...');
    const resultadoInfermedica = await fluxoCompleto(relatorioGemini.relatorioClinico, {
      idade: relatorioGemini.idade,
      sexo: relatorioGemini.sexo
    });

    let formatado;
    // ETAPA 3: Humanização da resposta final (tenta Gemini humanizando; se falhar, usa formatador direto)
    try {
      console.log('4. [Gemini] Humanizando diagnóstico final para o paciente...');
      formatado = await humanizarResultadoFinal(sintoma, relatorioGemini, resultadoInfermedica, camadaValida);
    } catch (errHumanizacao) {
      console.warn('⚠️ Fallback na humanização (usando formatador interno):', errHumanizacao.message);
      formatado = formatarResultadoInfermedica(resultadoInfermedica);
    }

    const tipoUnidade = formatado.tipoUnidade || 'UBS';
    const local = getLocal(camadaValida, formatado.prioridade, tipoUnidade);
    const linkMaps = gerarLinkMaps(lat, lng, tipoUnidade);

    console.log('5. ✅ Triagem concluída com sucesso!');

    return res.json({
      remetente: 'bot',
      texto: formatado.mensagem,
      triagem: {
        recomendacao: formatado.recomendacao,
        especialidade: formatado.especialidade,
        local,
        prioridade: formatado.prioridade,
        orientacao: formatado.orientacao
      },
      mapa: linkMaps,
      fonteIA: 'Gemini 3.5 Flash + Infermedica v3',
      relatorioFormal: relatorioGemini.relatorioClinico,
      timestamp: new Date().toISOString()
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
 * 
 * 1. Gemini analisa a foto e gera o relatório dermatológico formal.
 * 2. O relatório alimenta a Infermedica.
 * 3. Humanização e encaminhamento geolocalizado.
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
    console.log('\n--- [NOVO ATENDIMENTO DE IMAGEM] ---');
    console.log('1. [Gemini] Analisando imagem e criando laudo visual formal...');
    const relatorioImagem = await gerarRelatorioImagem(req.file.path, req.file.mimetype);
    console.log('   Laudo gerado:', relatorioImagem.relatorioClinico);

    console.log('2. [Infermedica] Consultando motor clínico...');
    const resultadoInfermedica = await fluxoCompleto(relatorioImagem.relatorioClinico, {
      idade: relatorioImagem.idade,
      sexo: relatorioImagem.sexo
    });

    let formatado;
    try {
      console.log('3. [Gemini] Humanizando resposta da imagem...');
      formatado = await humanizarResultadoFinal('Imagem dermatológica enviada pelo paciente', relatorioImagem, resultadoInfermedica, camadaValida);
    } catch {
      formatado = formatarResultadoInfermedica(resultadoInfermedica);
    }

    const tipoUnidade = formatado.tipoUnidade || 'UBS';
    const local = getLocal(camadaValida, formatado.prioridade, tipoUnidade);
    const linkMaps = gerarLinkMaps(lat, lng, tipoUnidade);

    return res.json({
      remetente: 'bot',
      texto: formatado.mensagem,
      triagem: {
        recomendacao: formatado.recomendacao,
        especialidade: formatado.especialidade,
        local,
        prioridade: formatado.prioridade,
        orientacao: formatado.orientacao
      },
      mapa: linkMaps,
      fonteIA: 'Gemini (Visão) + Infermedica v3',
      arquivoRecebido: req.file.originalname,
      timestamp: new Date().toISOString()
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