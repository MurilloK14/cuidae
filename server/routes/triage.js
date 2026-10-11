import { Router } from 'express';
import upload from '../middleware/upload.js';
import { avaliarSintomas, avaliarImagem } from '../services/geminiService.js';
import { getLocal, gerarLinkMaps } from '../services/locationService.js';
import { saveTriagem, getTriagemById, getAllTriagens } from '../services/dbService.js';

const router = Router();

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
    texto: "Olá! Sou o assistente de triagem de saúde do Cuidaê. Me diga o que está sentindo ou envie uma foto de uma alteração na pele, e eu te orientarei para o atendimento correto."
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
 */
router.post('/symptoms', async (req, res) => {
  const { sintoma, camada, lat, lng, user_id } = req.body;

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
    const mapeamento = mapearUrgencia(respostaFinal.prioridade);

    // Salva no Banco de Dados
    const salvaNoBanco = saveTriagem({
      user_id: user_id || 'anonimo',
      sintoma_principal: sintoma,
      duracao: req.body.duracao || 'Não informada',
      intensidade: req.body.intensidade || 5,
      respostas: req.body.respostas || [{ pergunta: 'sintoma_principal', resposta: sintoma }],
      nivel_urgencia: mapeamento.nivel_urgencia,
      recomendacao: mapeamento.recomendacao,
      especialidade: respostaFinal.especialidade,
      explicacao: respostaFinal.mensagem,
      orientacao: respostaFinal.orientacao,
      tipoUnidade,
      mapa: linkMaps,
      fonteIA: respostaFinal.fonteIA || 'Google Gemini Flash',
      cidade_snapshot: req.body.cidade || 'São Paulo',
      uf_snapshot: req.body.uf || 'SP'
    });

    return res.json({
      id: salvaNoBanco.id,
      remetente: 'bot',
      texto: respostaFinal.mensagem,
      triagem: {
        id: salvaNoBanco.id,
        recomendacao: respostaFinal.recomendacao,
        especialidade: respostaFinal.especialidade,
        local,
        prioridade: respostaFinal.prioridade,
        orientacao: respostaFinal.orientacao,
        tipoUnidade,
        nivel_urgencia: mapeamento.nivel_urgencia
      },
      mapa: linkMaps,
      fonteIA: respostaFinal.fonteIA,
      timestamp: salvaNoBanco.created_at
    });

  } catch (err) {
    console.error('❌ Erro no Gemini:', err.message);
    return res.status(500).json({
      remetente: 'bot',
      texto: `🚨 Erro na avaliação de sintomas: ${err.message}`,
      triagem: null,
      fonteIA: 'erro',
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
    const mapeamento = mapearUrgencia(respostaFinal.prioridade);

    // Salva no Banco de Dados
    const salvaNoBanco = saveTriagem({
      user_id: req.body.user_id || 'anonimo',
      sintoma_principal: req.body.sintoma || 'Lesão cutânea / foto enviada para análise dermatológica',
      duracao: req.body.duracao || 'Não informada',
      intensidade: req.body.intensidade || 5,
      respostas: [{ pergunta: 'foto', resposta: req.file.originalname }],
      nivel_urgencia: mapeamento.nivel_urgencia,
      recomendacao: mapeamento.recomendacao,
      especialidade: respostaFinal.especialidade || 'Dermatologia',
      explicacao: respostaFinal.mensagem,
      orientacao: respostaFinal.orientacao,
      tipoUnidade,
      mapa: linkMaps,
      foto_storage_path: req.file.path,
      fonteIA: respostaFinal.fonteIA || 'Google Gemini Vision',
      cidade_snapshot: req.body.cidade || 'São Paulo',
      uf_snapshot: req.body.uf || 'SP'
    });

    return res.json({
      id: salvaNoBanco.id,
      remetente: 'bot',
      texto: respostaFinal.mensagem,
      triagem: {
        id: salvaNoBanco.id,
        recomendacao: respostaFinal.recomendacao,
        especialidade: respostaFinal.especialidade,
        local,
        prioridade: respostaFinal.prioridade,
        orientacao: respostaFinal.orientacao,
        tipoUnidade,
        nivel_urgencia: mapeamento.nivel_urgencia
      },
      mapa: linkMaps,
      fonteIA: respostaFinal.fonteIA,
      arquivoRecebido: req.file.originalname,
      timestamp: salvaNoBanco.created_at
    });

  } catch (err) {
    console.error('❌ Erro na análise de imagem do Gemini:', err.message);
    return res.status(500).json({
      remetente: 'bot',
      texto: `🚨 Erro na análise de imagem: ${err.message}`,
      triagem: null,
      fonteIA: 'erro',
      arquivoRecebido: req.file.originalname,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
