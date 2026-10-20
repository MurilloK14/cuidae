import { Router } from 'express';
import upload from '../middleware/upload.js';
import { aiStatus } from '../config/aiConfig.js';
import {
  gerarRelatorioFormal,
  gerarRelatorioImagem,
  humanizarResultadoFinal,
  gerarPerguntaInvestigativa,
  interpretarRespostaPaciente
} from '../services/geminiService.js';
import {
  parseSintomas,
  executarPassoDiagnostico,
  fluxoCompleto,
  formatarResultadoInfermedica
} from '../services/infermedicaService.js';
import { getLocal, gerarLinkMaps } from '../services/locationService.js';

const router = Router();

console.log(`[Config] Gemini: ${aiStatus.isGeminiActive ? '✅' : '❌'} | Infermedica: ${aiStatus.isInfermedicaActive ? '✅' : '❌'}`);
console.log(`[Config] Modo integrado (Gemini -> Infermedica -> Gemini): ${aiStatus.isIntegratedMode ? '✅ ATIVO' : '⚠️ Parcial'}`);

/**
 * GET /api/triage/welcome
 */
router.get('/welcome', (_req, res) => {
  res.json({
    texto: "Olá! Sou o assistente de triagem médica do SaúdePraTodos. Descreva com suas palavras o que você está sentindo ou envie uma foto. Nosso sistema médico inteligente fará perguntas específicas para identificar seu caso com precisão!"
  });
});

/**
 * POST /api/triage/symptoms
 * 
 * INÍCIO DO CICLO DIAGNÓSTICO:
 * 1. O paciente envia o relato inicial em linguagem natural.
 * 2. O Gemini extrai relatório formal e termos em inglês médico.
 * 3. A Infermedica detecta as menções de sintomas (/parse).
 * 4. A Infermedica avalia as condições iniciais (/diagnosis).
 * 5. Se já houver certeza clínica, finaliza.
 *    Senão, o Gemini formula a primeira pergunta investigativa para afunilar as hipóteses.
 */
router.post('/symptoms', async (req, res) => {
  const { sintoma, camada, lat, lng } = req.body;

  if (!sintoma || !sintoma.trim()) {
    return res.status(400).json({ error: 'O campo "sintoma" é obrigatório.' });
  }

  const camadaValida = ['Gratuito', 'Intermediário', 'Premium'].includes(camada) ? camada : 'Gratuito';

  try {
    console.log('\n--- [INÍCIO DE TRIAGEM - SINTOMAS INICIAIS] ---');
    console.log('1. Mensagem do paciente:', sintoma);

    // ETAPA 1: Gemini elabora o relatório médico formal
    console.log('2. [Gemini] Criando relatório formal em inglês clínico...');
    const relatorioGemini = await gerarRelatorioFormal(sintoma);
    console.log('   Relatório gerado:', relatorioGemini.relatorioClinico);
    console.log('   Sintomas identificados:', relatorioGemini.sintomasExtraidosPT.join(', '));

    // ETAPA 2: Infermedica extrai menções estruturadas
    const evidenciasIniciais = await parseSintomas(
      relatorioGemini.relatorioClinico,
      relatorioGemini.idade,
      relatorioGemini.sexo
    );

    if (evidenciasIniciais.length === 0) {
      return res.json({
        remetente: 'bot',
        finalizado: true,
        texto: 'Não consegui identificar sintomas médicos específicos na sua descrição. Você poderia detalhar um pouco mais o que está sentindo (por exemplo: onde dói, se tem febre, enjoo ou manchas)?',
        triagem: null,
        fonteIA: 'Gemini + Infermedica',
        timestamp: new Date().toISOString()
      });
    }

    const evidenciasComSource = evidenciasIniciais.map(e => ({
      ...e,
      source: 'initial'
    }));

    // ETAPA 3: Infermedica roda o 1º passo do diagnóstico
    console.log('3. [Infermedica] Executando rodada de diagnóstico...');
    const passo = await executarPassoDiagnostico(evidenciasComSource, {
      idade: relatorioGemini.idade,
      sexo: relatorioGemini.sexo
    });

    // Caso já tenha chegado a uma certeza suficiente logo de início
    if (passo.finalizado) {
      console.log('4. [Infermedica] Diagnóstico afunilado imediatamente!');
      let formatado;
      try {
        formatado = await humanizarResultadoFinal(
          sintoma,
          relatorioGemini,
          { diagnostico: passo.diagnostico, triagem: passo.triagem },
          camadaValida
        );
      } catch (errHumanizacao) {
        formatado = formatarResultadoInfermedica({
          evidencias: passo.evidencias,
          diagnostico: passo.diagnostico,
          triagem: passo.triagem
        });
      }

      const tipoUnidade = formatado.tipoUnidade || 'UBS';
      const local = getLocal(camadaValida, formatado.prioridade, tipoUnidade);
      const linkMaps = gerarLinkMaps(lat, lng, tipoUnidade);

      return res.json({
        remetente: 'bot',
        finalizado: true,
        texto: formatado.mensagem,
        triagem: {
          recomendacao: formatado.recomendacao,
          especialidade: formatado.especialidade,
          local,
          prioridade: formatado.prioridade,
          orientacao: formatado.orientacao
        },
        mapa: linkMaps,
        fonteIA: 'Gemini 1.5 Flash + Infermedica v3',
        timestamp: new Date().toISOString()
      });
    }

    // Se o motor precisa de mais dados para desempatar:
    console.log('4. [Gemini] Formulando pergunta investigativa a partir da Infermedica...');
    const perguntaGemini = await gerarPerguntaInvestigativa(
      sintoma,
      passo.condicoes,
      passo.question.text
    );

    return res.json({
      remetente: 'bot',
      finalizado: false,
      texto: perguntaGemini.perguntaHumanizada,
      explicacao: perguntaGemini.explicacaoBreve,
      opcoes: perguntaGemini.opcoesRapidas || ['Sim', 'Não', 'Não tenho certeza'],
      sessao: {
        evidencias: passo.evidencias,
        perguntaAtual: passo.question,
        relatoOriginal: sintoma,
        relatorioClinico: relatorioGemini.relatorioClinico,
        idade: relatorioGemini.idade,
        sexo: relatorioGemini.sexo,
        condicoes: passo.condicoes
      },
      fonteIA: 'Gemini 1.5 Flash + Infermedica v3 (Entrevista Dinâmica)',
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('❌ Erro no fluxo de sintomas:', err.message);
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
 * POST /api/triage/reply
 * 
 * CONTINUAÇÃO DA ENTREVISTA DIAGNÓSTICA (LOOP):
 * 1. O paciente responde à pergunta investigativa (via texto ou botão).
 * 2. O Gemini interpreta a resposta e mapeia para escolhas clínicas (present/absent/unknown).
 * 3. As novas evidências são incorporadas ao prontuário da sessão.
 * 4. A Infermedica recalcula as probabilidades de cada doença.
 * 5. Se o diagnóstico estiver afunilado (ou atingir critério de parada):
 *      -> Gera resultado final com conduta e UBS/UPA geolocalizada.
 *    Senão:
 *      -> Gemini formula a próxima pergunta investigativa da Infermedica.
 */
router.post('/reply', async (req, res) => {
  const { resposta, sessao, camada, lat, lng } = req.body;

  if (!resposta || !sessao || !sessao.evidencias) {
    return res.status(400).json({ error: 'Resposta e sessão válida são obrigatórias.' });
  }

  const camadaValida = ['Gratuito', 'Intermediário', 'Premium'].includes(camada) ? camada : 'Gratuito';

  try {
    console.log('\n--- [AVANÇO DA ENTREVISTA DIAGNÓSTICA] ---');
    console.log('1. Resposta do paciente:', resposta);
    console.log('2. Pergunta clínica de referência:', sessao.perguntaAtual?.text);

    // ETAPA 1: Interpretar a resposta com Gemini
    const escolhas = await interpretarRespostaPaciente(
      resposta,
      sessao.perguntaAtual?.items || []
    );
    console.log('3. Escolhas mapeadas para a Infermedica:', JSON.stringify(escolhas));

    // Adiciona as novas respostas como evidências da entrevista
    const novasEvidencias = escolhas.map(e => ({
      id: e.id,
      choice_id: e.choice_id
    }));

    const idsNovos = new Set(novasEvidencias.map(n => n.id));
    const evidenciasFiltradas = sessao.evidencias.filter(e => !idsNovos.has(e.id));
    const evidenciasAtualizadas = [...evidenciasFiltradas, ...novasEvidencias];

    // ETAPA 2: Infermedica reavalia o diagnóstico com as novas evidências
    console.log('4. [Infermedica] Recalculando probabilidades com novas evidências...');
    const passo = await executarPassoDiagnostico(evidenciasAtualizadas, {
      idade: sessao.idade,
      sexo: sessao.sexo
    });

    // Se o diagnóstico afunilou ou encerrou o limite de perguntas
    if (passo.finalizado) {
      console.log('5. ✅ Diagnóstico final afunilado e consolidado!');
      let formatado;
      try {
        formatado = await humanizarResultadoFinal(
          sessao.relatoOriginal,
          { relatorioClinico: sessao.relatorioClinico },
          { diagnostico: passo.diagnostico, triagem: passo.triagem },
          camadaValida
        );
      } catch (errHumanizacao) {
        formatado = formatarResultadoInfermedica({
          evidencias: passo.evidencias,
          diagnostico: passo.diagnostico,
          triagem: passo.triagem
        });
      }

      const tipoUnidade = formatado.tipoUnidade || 'UBS';
      const local = getLocal(camadaValida, formatado.prioridade, tipoUnidade);
      const linkMaps = gerarLinkMaps(lat, lng, tipoUnidade);

      return res.json({
        remetente: 'bot',
        finalizado: true,
        texto: formatado.mensagem,
        triagem: {
          recomendacao: formatado.recomendacao,
          especialidade: formatado.especialidade,
          local,
          prioridade: formatado.prioridade,
          orientacao: formatado.orientacao
        },
        mapa: linkMaps,
        fonteIA: 'Gemini 1.5 Flash + Infermedica v3 (Diagnóstico Refinado)',
        timestamp: new Date().toISOString()
      });
    }

    // Se ainda restam dúvidas: Gemini formula a próxima pergunta investigativa
    console.log('5. [Gemini] Formulando próxima pergunta de afunilamento...');
    const perguntaGemini = await gerarPerguntaInvestigativa(
      sessao.relatoOriginal,
      passo.condicoes,
      passo.question.text
    );

    return res.json({
      remetente: 'bot',
      finalizado: false,
      texto: perguntaGemini.perguntaHumanizada,
      explicacao: perguntaGemini.explicacaoBreve,
      opcoes: perguntaGemini.opcoesRapidas || ['Sim', 'Não', 'Não tenho certeza'],
      sessao: {
        ...sessao,
        evidencias: passo.evidencias,
        perguntaAtual: passo.question,
        condicoes: passo.condicoes
      },
      fonteIA: 'Gemini 1.5 Flash + Infermedica v3 (Entrevista Dinâmica)',
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('❌ Erro no avanço da entrevista:', err.message);
    return res.status(500).json({
      remetente: 'bot',
      texto: `🚨 Erro ao processar resposta: ${err.message}`,
      triagem: null,
      fonteIA: 'erro-api',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/triage/image
 * Análise de foto dermatológica
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
      finalizado: true,
      texto: formatado.mensagem,
      triagem: {
        recomendacao: formatado.recomendacao,
        especialidade: formatado.especialidade,
        local,
        prioridade: formatado.prioridade,
        orientacao: formatado.orientacao
      },
      mapa: linkMaps,
      fonteIA: 'Gemini 1.5 Flash (Visão) + Infermedica v3',
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