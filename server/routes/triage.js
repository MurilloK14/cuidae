import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import upload from '../middleware/upload.js';
import { aiStatus } from '../config/aiConfig.js';
import {
  conduzirAnamneseOuDiagnostico,
  gerarRelatorioFormal,
  gerarRelatorioImagem,
  humanizarResultadoFinal,
  gerarPerguntaInvestigativa,
  interpretarRespostaPaciente,
  avaliarSintomas,
  avaliarImagem
} from '../services/geminiService.js';
import {
  parseSintomas,
  executarPassoDiagnostico,
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

console.log(`[Config] Gemini: ${aiStatus.isGeminiActive ? '✅' : '❌'} | Infermedica: ${aiStatus.isInfermedicaActive ? '✅' : '❌'}`);
console.log(`[Config] Modo integrado (Gemini -> Infermedica -> Gemini): ${aiStatus.isIntegratedMode ? '✅ ATIVO' : '⚠️ Parcial'}`);

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
    texto: "Olá! Sou a Cuidaê, sua assistente virtual de triagem médica do SUS. 😊\n\nMe conte com suas palavras o que você está sentindo — quanto mais detalhes, melhor consigo te orientar. Você também pode enviar uma foto de qualquer alteração física (pele, lesão, machucado).\n\nComo posso te ajudar hoje?"
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
 * FLUXO INTEGRADO:
 * 1. O paciente envia o relato.
 * 2. Anamnese conversacional ou extração clínica de sintomas.
 * 3. A Infermedica avalia as condições iniciais e define se necessita de afunilamento.
 */
router.post('/symptoms', async (req, res) => {
  const { sintoma, camada, lat, lng, user_id, historico = [] } = req.body;

  if (!sintoma || !sintoma.trim()) {
    return res.status(400).json({ error: 'O campo "sintoma" é obrigatório.' });
  }

  const camadaValida = ['Gratuito', 'Intermediário', 'Premium'].includes(camada) ? camada : 'Gratuito';

  try {
    console.log('\n--- [INÍCIO DE TRIAGEM - SINTOMAS INICIAIS] ---');
    console.log('1. Mensagem do paciente:', sintoma);

    // ETAPA 1: Condução da anamnese ou geração de relatório formal
    let relatorioGemini = null;
    try {
      relatorioGemini = await gerarRelatorioFormal(sintoma);
    } catch {
      relatorioGemini = {
        relatorioClinico: sintoma,
        resumoPT: sintoma,
        sintomasExtraidosPT: [sintoma],
        idade: 30,
        sexo: 'male'
      };
    }

    const relatorioClinico = relatorioGemini.relatorioClinico || sintoma;
    const idade = relatorioGemini.idade || 30;
    const sexo = relatorioGemini.sexo || 'male';

    // ETAPA 2: Infermedica extrai menções estruturadas de sintomas
    let evidenciasIniciais = [];
    if (aiStatus.isInfermedicaActive) {
      try {
        evidenciasIniciais = await parseSintomas(relatorioClinico, idade, sexo);
      } catch (errParse) {
        console.warn('⚠️ [Infermedica] Falha no parse:', errParse.message);
      }
    }

    if (evidenciasIniciais.length === 0) {
      // Se não encontrou menções estruturadas na Infermedica, usa avaliação direta
      const direto = await avaliarSintomas(sintoma, historico);
      const tipoUnidade = direto.tipoUnidade || 'UBS';
      const local = getLocal(camadaValida, direto.prioridade, tipoUnidade);
      const linkMaps = gerarLinkMaps(lat, lng, tipoUnidade);
      const mapeamento = mapearUrgencia(direto.prioridade);

      const salvaNoBanco = saveTriagem({
        user_id: user_id || 'anonimo',
        sintoma_principal: sintoma,
        duracao: req.body.duracao || 'Não informada',
        intensidade: req.body.intensidade || 5,
        respostas: [{ pergunta: 'sintoma_principal', resposta: sintoma }],
        nivel_urgencia: mapeamento.nivel_urgencia,
        recomendacao: mapeamento.recomendacao,
        especialidade: direto.especialidade,
        explicacao: direto.mensagem,
        orientacao: direto.orientacao,
        tipoUnidade,
        mapa: linkMaps,
        fonteIA: direto.fonteIA || 'Google Gemini Flash',
        cidade_snapshot: req.body.cidade || 'São Paulo',
        uf_snapshot: req.body.uf || 'SP'
      });

      return res.json({
        id: salvaNoBanco.id,
        remetente: 'bot',
        finalizado: true,
        prontoParaDiagnostico: true,
        texto: direto.mensagem,
        triagem: {
          id: salvaNoBanco.id,
          recomendacao: direto.recomendacao,
          especialidade: direto.especialidade,
          local,
          prioridade: direto.prioridade,
          orientacao: direto.orientacao,
          tipoUnidade,
          nivel_urgencia: mapeamento.nivel_urgencia
        },
        mapa: linkMaps,
        fonteIA: direto.fonteIA || 'Google Gemini Flash',
        timestamp: salvaNoBanco.created_at
      });
    }

    const evidenciasComSource = evidenciasIniciais.map(e => ({
      ...e,
      source: 'initial'
    }));

    // ETAPA 3: Infermedica executa a 1ª rodada do diagnóstico
    console.log('3. [Infermedica] Executando rodada de diagnóstico...');
    const passo = await executarPassoDiagnostico(evidenciasComSource, { idade, sexo });

    // Se o diagnóstico já estiver afunilado
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
      } catch {
        formatado = formatarResultadoInfermedica({
          evidencias: passo.evidencias,
          diagnostico: passo.diagnostico,
          triagem: passo.triagem
        });
      }

      const tipoUnidade = formatado.tipoUnidade || 'UBS';
      const local = getLocal(camadaValida, formatado.prioridade, tipoUnidade);
      const linkMaps = gerarLinkMaps(lat, lng, tipoUnidade);
      const mapeamento = mapearUrgencia(formatado.prioridade);

      const salvaNoBanco = saveTriagem({
        user_id: user_id || 'anonimo',
        sintoma_principal: sintoma,
        duracao: req.body.duracao || 'Não informada',
        intensidade: req.body.intensidade || 5,
        respostas: [{ pergunta: 'sintoma_principal', resposta: sintoma }],
        nivel_urgencia: mapeamento.nivel_urgencia,
        recomendacao: mapeamento.recomendacao,
        especialidade: formatado.especialidade,
        explicacao: formatado.mensagem,
        orientacao: formatado.orientacao,
        tipoUnidade,
        mapa: linkMaps,
        fonteIA: 'Gemini 3.5 Flash + Infermedica v3',
        cidade_snapshot: req.body.cidade || 'São Paulo',
        uf_snapshot: req.body.uf || 'SP'
      });

      return res.json({
        id: salvaNoBanco.id,
        remetente: 'bot',
        finalizado: true,
        prontoParaDiagnostico: true,
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
        fonteIA: 'Gemini 3.5 Flash + Infermedica v3',
        timestamp: salvaNoBanco.created_at
      });
    }

    // Se precisa de mais informações: Gemini formula a pergunta investigativa
    console.log('4. [Gemini] Formulando pergunta investigativa a partir da Infermedica...');
    const perguntaGemini = await gerarPerguntaInvestigativa(
      sintoma,
      passo.condicoes,
      passo.question.text
    );

    return res.json({
      remetente: 'bot',
      finalizado: false,
      prontoParaDiagnostico: false,
      texto: perguntaGemini.perguntaHumanizada,
      explicacao: perguntaGemini.explicacaoBreve,
      opcoes: perguntaGemini.opcoesRapidas || ['Sim', 'Não', 'Não tenho certeza'],
      sessao: {
        evidencias: passo.evidencias,
        perguntaAtual: passo.question,
        relatoOriginal: sintoma,
        relatorioClinico,
        idade,
        sexo,
        condicoes: passo.condicoes
      },
      fonteIA: 'Gemini 3.5 Flash + Infermedica v3 (Entrevista Dinâmica)',
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
 * 2. O Gemini interpreta a resposta e mapeia para escolhas clínicas.
 * 3. As novas evidências são incorporadas e a Infermedica recalcula.
 * 4. Ao afunilar, salva no banco de dados e retorna o laudo final.
 */
router.post('/reply', async (req, res) => {
  const { resposta, sessao, camada, lat, lng, user_id } = req.body;

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

    const novasEvidencias = escolhas.map(e => ({
      id: e.id,
      choice_id: e.choice_id
    }));

    const idsNovos = new Set(novasEvidencias.map(n => n.id));
    const evidenciasFiltradas = sessao.evidencias.filter(e => !idsNovos.has(e.id));
    const evidenciasAtualizadas = [...evidenciasFiltradas, ...novasEvidencias];

    // ETAPA 2: Infermedica reavalia com as novas evidências
    console.log('4. [Infermedica] Recalculando probabilidades com novas evidências...');
    const passo = await executarPassoDiagnostico(evidenciasAtualizadas, {
      idade: sessao.idade,
      sexo: sessao.sexo
    });

    // Se o diagnóstico afunilou
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
      const mapeamento = mapearUrgencia(formatado.prioridade);

      const triageId = crypto.randomUUID();

      salvarJsonAnamneseLocal({
        id: triageId,
        timestamp: new Date().toISOString(),
        sintomaRelatado: sessao.relatoOriginal,
        anamneseGemini: {
          relatorioClinico: sessao.relatorioClinico,
          idade: sessao.idade,
          sexo: sessao.sexo
        },
        diagnosticoFinal: passo.condicoes
      });

      const salvaNoBanco = saveTriagem({
        id: triageId,
        user_id: user_id || 'anonimo',
        sintoma_principal: sessao.relatoOriginal,
        duracao: 'Informada na anamnese',
        intensidade: 5,
        respostas: [{ pergunta: 'entrevista_diagnostica', resposta }],
        nivel_urgencia: mapeamento.nivel_urgencia,
        recomendacao: mapeamento.recomendacao,
        especialidade: formatado.especialidade,
        explicacao: formatado.mensagem,
        orientacao: formatado.orientacao,
        tipoUnidade,
        mapa: linkMaps,
        fonteIA: 'Gemini 3.5 Flash + Infermedica v3 (Diagnóstico Refinado)',
        cidade_snapshot: req.body.cidade || 'São Paulo',
        uf_snapshot: req.body.uf || 'SP'
      });

      return res.json({
        id: salvaNoBanco.id,
        remetente: 'bot',
        finalizado: true,
        prontoParaDiagnostico: true,
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
        fonteIA: 'Gemini 3.5 Flash + Infermedica v3 (Diagnóstico Refinado)',
        timestamp: salvaNoBanco.created_at
      });
    }

    // Se ainda restam dúvidas: próxima pergunta
    console.log('5. [Gemini] Formulando próxima pergunta de afunilamento...');
    const perguntaGemini = await gerarPerguntaInvestigativa(
      sessao.relatoOriginal,
      passo.condicoes,
      passo.question.text
    );

    return res.json({
      remetente: 'bot',
      finalizado: false,
      prontoParaDiagnostico: false,
      texto: perguntaGemini.perguntaHumanizada,
      explicacao: perguntaGemini.explicacaoBreve,
      opcoes: perguntaGemini.opcoesRapidas || ['Sim', 'Não', 'Não tenho certeza'],
      sessao: {
        ...sessao,
        evidencias: passo.evidencias,
        perguntaAtual: passo.question,
        condicoes: passo.condicoes
      },
      fonteIA: 'Gemini 3.5 Flash + Infermedica v3 (Entrevista Dinâmica)',
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
    let formatado = null;
    let fonteIA = 'Gemini (Visão) + Infermedica v3';

    if (aiStatus.isIntegratedMode) {
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
      finalizado: true,
        prontoParaDiagnostico: true,
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