import { Router } from 'express';
import upload from '../middleware/upload.js';
import { avaliarSintomas, avaliarImagem } from '../services/geminiService.js';
import { getLocal, gerarLinkMaps } from '../services/locationService.js';

const router = Router();

// Verifica se a chave foi inserida
const GEMINI_ATIVO = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'SUA_CHAVE_AQUI';

console.log(`[Config] Gemini Pro: ${GEMINI_ATIVO ? '✅' : '❌'}`);

/**
 * GET /api/triage/welcome
 */
router.get('/welcome', (_req, res) => {
  res.json({
    texto: "Olá! Sou o assistente de triagem de saúde. Me diga o que está sentindo ou envie uma foto, e eu te orientarei para o atendimento correto."
  });
});

/**
 * POST /api/triage/symptoms
 */
router.post('/symptoms', async (req, res) => {
  const { sintoma, camada, lat, lng } = req.body;

  if (!sintoma || !sintoma.trim()) {
    return res.status(400).json({ error: 'O campo "sintoma" é obrigatório.' });
  }

  const camadaValida = ['Gratuito', 'Intermediário', 'Premium'].includes(camada) ? camada : 'Gratuito';

  try {
    console.log('[Gemini] Avaliando sintomas:', sintoma);
    const respostaFinal = await avaliarSintomas(sintoma);
    
    const tipoUnidade = respostaFinal.tipoUnidade || 'UBS';
    const local = getLocal(camadaValida, respostaFinal.prioridade, tipoUnidade);
    const linkMaps = gerarLinkMaps(lat, lng, tipoUnidade);

    return res.json({
      remetente: 'bot',
      texto: respostaFinal.mensagem,
      triagem: {
        recomendacao: respostaFinal.recomendacao,
        especialidade: respostaFinal.especialidade,
        local,
        prioridade: respostaFinal.prioridade,
        orientacao: respostaFinal.orientacao
      },
      mapa: linkMaps,
      fonteIA: 'Gemini Pro',
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('❌ Erro no Gemini:', err.message);
    return res.status(500).json({
      remetente: 'bot',
      texto: `🚨 Erro na API do Gemini: ${err.message}. Verifique a chave no .env!`,
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
    console.log('[Gemini] Avaliando imagem...');
    const respostaFinal = await avaliarImagem(req.file.path, req.file.mimetype);

    const tipoUnidade = respostaFinal.tipoUnidade || 'UBS';
    const local = getLocal(camadaValida, respostaFinal.prioridade, tipoUnidade);
    const linkMaps = gerarLinkMaps(lat, lng, tipoUnidade);

    return res.json({
      remetente: 'bot',
      texto: respostaFinal.mensagem,
      triagem: {
        recomendacao: respostaFinal.recomendacao,
        especialidade: respostaFinal.especialidade,
        local,
        prioridade: respostaFinal.prioridade,
        orientacao: respostaFinal.orientacao
      },
      mapa: linkMaps,
      fonteIA: 'Gemini Pro',
      arquivoRecebido: req.file.originalname,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('❌ Erro na análise de imagem do Gemini:', err.message);
    return res.status(500).json({
      remetente: 'bot',
      texto: `🚨 Erro na API do Gemini: ${err.message}. Verifique a chave no .env!`,
      triagem: null,
      fonteIA: 'erro-api',
      arquivoRecebido: req.file.originalname,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
