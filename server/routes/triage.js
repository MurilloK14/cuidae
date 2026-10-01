import { Router } from 'express';
import upload from '../middleware/upload.js';
import {
  analisarSintomas,
  analisarImagem,
  getMensagemBoasVindas
} from '../services/triageService.js';

const router = Router();

/**
 * GET /api/triage/welcome
 * Retorna a mensagem de boas-vindas do chatbot.
 */
router.get('/welcome', (_req, res) => {
  const mensagem = getMensagemBoasVindas();
  res.json(mensagem);
});

/**
 * POST /api/triage/symptoms
 * Recebe sintomas em texto e retorna o encaminhamento.
 *
 * Body: { sintoma: string, camada: string }
 */
router.post('/symptoms', (req, res) => {
  const { sintoma, camada } = req.body;

  if (!sintoma || !sintoma.trim()) {
    return res.status(400).json({ error: 'O campo "sintoma" é obrigatório.' });
  }

  const camadaValida = ['Gratuito', 'Intermediário', 'Premium'].includes(camada)
    ? camada
    : 'Gratuito';

  const resultado = analisarSintomas(sintoma, camadaValida);

  res.json({
    remetente: 'bot',
    texto: resultado.mensagem,
    triagem: {
      recomendacao: resultado.recomendacao,
      especialidade: resultado.especialidade,
      local: resultado.local,
      prioridade: resultado.prioridade,
      orientacao: resultado.orientacao
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/triage/image
 * Recebe uma imagem para análise e retorna o encaminhamento.
 *
 * FormData: imagem (file), camada (string)
 */
router.post('/image', upload.single('imagem'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhuma imagem foi enviada.' });
  }

  const camada = req.body.camada || 'Gratuito';
  const camadaValida = ['Gratuito', 'Intermediário', 'Premium'].includes(camada)
    ? camada
    : 'Gratuito';

  const resultado = analisarImagem(camadaValida, req.file.originalname);

  res.json({
    remetente: 'bot',
    texto: resultado.mensagem,
    triagem: {
      recomendacao: resultado.recomendacao,
      especialidade: resultado.especialidade,
      local: resultado.local,
      prioridade: resultado.prioridade,
      orientacao: resultado.orientacao
    },
    arquivoRecebido: resultado.arquivoRecebido,
    timestamp: new Date().toISOString()
  });
});

export default router;
