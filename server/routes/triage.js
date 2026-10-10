import { Router } from 'express';
import upload from '../middleware/upload.js';
import {
  analisarSintomas,
  analisarImagem,
  getMensagemBoasVindas
} from '../services/triageService.js';
import { extrairSintomas, extrairSintomasDeImagem, humanizarDiagnostico } from '../services/geminiService.js';
import { fluxoCompleto as infermedicaFluxo } from '../services/infermedicaService.js';
import { getLocal, gerarLinkMaps } from '../services/locationService.js';

const router = Router();

// Verifica quais serviços estão ativos
const GEMINI_ATIVO = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'SUA_CHAVE_AQUI';
const INFERMEDICA_ATIVA = process.env.INFERMEDICA_APP_ID && process.env.INFERMEDICA_APP_ID !== 'SEU_APP_ID_AQUI';
const IA_COMPLETA = GEMINI_ATIVO && INFERMEDICA_ATIVA;

console.log(`[Config] Gemini: ${GEMINI_ATIVO ? '✅' : '❌'} | Infermedica: ${INFERMEDICA_ATIVA ? '✅' : '❌'} | Fluxo IA completo: ${IA_COMPLETA ? '✅' : '❌ (usando fallback local)'}`);

/**
 * GET /api/triage/welcome
 */
router.get('/welcome', (_req, res) => {
  const mensagem = getMensagemBoasVindas();
  res.json(mensagem);
});

/**
 * POST /api/triage/symptoms
 * 
 * Fluxo completo com IA:
 *   1. Gemini escuta o paciente → extrai sintomas → JSON
 *   2. JSON vai para Infermedica → diagnóstico clínico real
 *   3. Gemini lê o resultado da Infermedica → fala pro paciente
 * 
 * Body: { sintoma, camada, lat?, lng? }
 */
router.post('/symptoms', async (req, res) => {
  const { sintoma, camada, lat, lng } = req.body;

  if (!sintoma || !sintoma.trim()) {
    return res.status(400).json({ error: 'O campo "sintoma" é obrigatório.' });
  }

  const camadaValida = ['Gratuito', 'Intermediário', 'Premium'].includes(camada)
    ? camada
    : 'Gratuito';

  try {
    if (IA_COMPLETA) {
      // ═══════════════════════════════════════════════
      // FLUXO COMPLETO: Gemini → Infermedica → Gemini
      // ═══════════════════════════════════════════════

      // PASSO 1: Gemini escuta e extrai sintomas
      console.log('[Passo 1] Gemini extraindo sintomas...');
      const extracao = await extrairSintomas(sintoma);
      console.log('[Passo 1] Sintomas extraídos:', extracao.sintomasTexto);

      // PASSO 2: Enviar para Infermedica (diagnóstico real)
      console.log('[Passo 2] Enviando para Infermedica...');
      const resultadoMedico = await infermedicaFluxo(extracao.sintomasTexto, {
        idade: extracao.idade,
        sexo: extracao.sexo
      });
      console.log('[Passo 2] Infermedica respondeu:', resultadoMedico.sintomasEncontrados ? 'OK' : 'Sem sintomas');

      // PASSO 3: Gemini humaniza a resposta
      console.log('[Passo 3] Gemini humanizando resposta...');
      const respostaFinal = await humanizarDiagnostico(sintoma, resultadoMedico, camadaValida);
      console.log('[Passo 3] Resposta pronta!');

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
        fonteIA: 'Gemini + Infermedica',
        timestamp: new Date().toISOString()
      });

    } else {
      // ═══════════════════════════════════
      // FALLBACK: Lógica local (sem APIs)
      // ═══════════════════════════════════
      const resultado = analisarSintomas(sintoma, camadaValida);
      const linkMaps = gerarLinkMaps(lat, lng, resultado.prioridade === 'Urgente' ? 'UPA' : 'UBS');

      return res.json({
        remetente: 'bot',
        texto: resultado.mensagem,
        triagem: {
          recomendacao: resultado.recomendacao,
          especialidade: resultado.especialidade,
          local: resultado.local,
          prioridade: resultado.prioridade,
          orientacao: resultado.orientacao
        },
        mapa: linkMaps,
        fonteIA: 'fallback-local',
        timestamp: new Date().toISOString()
      });
    }
  } catch (err) {
    console.error('❌ Erro no fluxo de triagem:', err.message);

    // Fallback automático em caso de erro
    const resultado = analisarSintomas(sintoma, camadaValida);
    const linkMaps = gerarLinkMaps(lat, lng, 'UBS');

    return res.json({
      remetente: 'bot',
      texto: resultado.mensagem,
      triagem: {
        recomendacao: resultado.recomendacao,
        especialidade: resultado.especialidade,
        local: resultado.local,
        prioridade: resultado.prioridade,
        orientacao: resultado.orientacao
      },
      mapa: linkMaps,
      fonteIA: 'fallback-erro',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/triage/image
 * 
 * Fluxo:
 *   1. Gemini analisa a foto → descreve o que vê → JSON
 *   2. Descrição vai para Infermedica → diagnóstico
 *   3. Gemini humaniza o resultado
 * 
 * FormData: imagem (file), camada, lat?, lng?
 */
router.post('/image', upload.single('imagem'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhuma imagem foi enviada.' });
  }

  const camada = req.body.camada || 'Gratuito';
  const lat = req.body.lat ? parseFloat(req.body.lat) : null;
  const lng = req.body.lng ? parseFloat(req.body.lng) : null;
  const camadaValida = ['Gratuito', 'Intermediário', 'Premium'].includes(camada)
    ? camada
    : 'Gratuito';

  try {
    if (IA_COMPLETA) {
      // PASSO 1: Gemini analisa a imagem
      console.log('[Imagem Passo 1] Gemini analisando foto...');
      const extracao = await extrairSintomasDeImagem(req.file.path, req.file.mimetype);
      console.log('[Imagem Passo 1] Descrição visual:', extracao.sintomasTexto);

      // PASSO 2: Infermedica diagnostica
      console.log('[Imagem Passo 2] Enviando para Infermedica...');
      const resultadoMedico = await infermedicaFluxo(extracao.sintomasTexto, {
        idade: extracao.idade,
        sexo: extracao.sexo
      });

      // Adiciona a descrição visual do Gemini ao resultado
      resultadoMedico.descricaoVisual = extracao.descricaoVisual;

      // PASSO 3: Gemini humaniza
      console.log('[Imagem Passo 3] Gemini humanizando...');
      const sintomaCompleto = `Imagem enviada pelo paciente. Descrição visual: ${extracao.descricaoVisual}`;
      const respostaFinal = await humanizarDiagnostico(sintomaCompleto, resultadoMedico, camadaValida);

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
        fonteIA: 'Gemini + Infermedica',
        arquivoRecebido: req.file.originalname,
        timestamp: new Date().toISOString()
      });

    } else {
      // Fallback
      const resultado = analisarImagem(camadaValida, req.file.originalname);
      const linkMaps = gerarLinkMaps(lat, lng, 'UBS');

      return res.json({
        remetente: 'bot',
        texto: resultado.mensagem,
        triagem: {
          recomendacao: resultado.recomendacao,
          especialidade: resultado.especialidade,
          local: resultado.local,
          prioridade: resultado.prioridade,
          orientacao: resultado.orientacao
        },
        mapa: linkMaps,
        fonteIA: 'fallback-local',
        arquivoRecebido: req.file.originalname,
        timestamp: new Date().toISOString()
      });
    }
  } catch (err) {
    console.error('❌ Erro na análise de imagem:', err.message);

    const resultado = analisarImagem(camadaValida, req.file.originalname);
    const linkMaps = gerarLinkMaps(lat, lng, 'UBS');

    return res.json({
      remetente: 'bot',
      texto: resultado.mensagem,
      triagem: {
        recomendacao: resultado.recomendacao,
        especialidade: resultado.especialidade,
        local: resultado.local,
        prioridade: resultado.prioridade,
        orientacao: resultado.orientacao
      },
      mapa: linkMaps,
      fonteIA: 'fallback-erro',
      arquivoRecebido: req.file.originalname,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
