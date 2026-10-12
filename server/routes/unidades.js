import express from 'express';
import unidadesService from '../services/unidadesService.js';

const router = express.Router();

/**
 * GET /api/unidades/recomendar
 * Recomenda unidades de saúde com base em sintomas, especialidade e proximidade
 * Nota: Declarado antes de /:id para evitar conflito de rota
 */
router.get('/recomendar', async (req, res) => {
  try {
    const { diagnostico, especialidade, tipoUnidade, lat, lng } = req.query;
    const recomendacoes = await unidadesService.getRecomendacao(
      diagnostico,
      especialidade,
      tipoUnidade,
      lat,
      lng
    );

    res.json({
      success: true,
      total: recomendacoes.length,
      unidades: recomendacoes
    });
  } catch (error) {
    console.error('Erro ao calcular recomendações:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno ao processar recomendações de unidades'
    });
  }
});

/**
 * GET /api/unidades
 * Lista todas as unidades de saúde com suporte a filtros por categoria e busca textual (?q=)
 */
router.get('/', async (req, res) => {
  try {
    const { categoria, q, especialidade } = req.query;

    let unidades;
    if (q) {
      unidades = await unidadesService.searchUnidades(q);
      if (categoria) {
        unidades = unidades.filter(
          (u) => u.categoria && u.categoria.toLowerCase() === categoria.toLowerCase()
        );
      }
    } else if (categoria) {
      unidades = await unidadesService.getUnidadesByCategoria(categoria);
    } else if (especialidade) {
      unidades = await unidadesService.getUnidadesByEspecialidade(especialidade);
    } else {
      unidades = await unidadesService.getAllUnidades();
    }

    res.json({
      success: true,
      total: unidades.length,
      unidades
    });
  } catch (error) {
    console.error('Erro ao listar unidades:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno ao listar unidades de saúde'
    });
  }
});

/**
 * GET /api/unidades/:id
 * Retorna dados detalhados de uma unidade de saúde acompanhada de suas avaliações
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const unidade = await unidadesService.getUnidadeById(id);

    if (!unidade) {
      return res.status(404).json({
        success: false,
        error: 'Unidade de saúde não encontrada'
      });
    }

    const avaliacoes = await unidadesService.getAvaliacoesByUnidade(id);

    res.json({
      success: true,
      unidade: {
        ...unidade,
        avaliacoes
      }
    });
  } catch (error) {
    console.error('Erro ao buscar unidade:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno ao carregar detalhes da unidade'
    });
  }
});

/**
 * GET /api/unidades/:id/avaliacoes
 * Retorna as avaliações de usuários para uma unidade
 */
router.get('/:id/avaliacoes', async (req, res) => {
  try {
    const { id } = req.params;
    const unidade = await unidadesService.getUnidadeById(id);

    if (!unidade) {
      return res.status(404).json({
        success: false,
        error: 'Unidade de saúde não encontrada'
      });
    }

    const avaliacoes = await unidadesService.getAvaliacoesByUnidade(id);

    res.json({
      success: true,
      total: avaliacoes.length,
      avaliacoes
    });
  } catch (error) {
    console.error('Erro ao buscar avaliações da unidade:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno ao buscar avaliações'
    });
  }
});

/**
 * POST /api/unidades/:id/avaliacoes
 * Envia uma nova avaliação para uma unidade
 */
router.post('/:id/avaliacoes', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, nome, nota, comentario } = req.body;

    const unidade = await unidadesService.getUnidadeById(id);
    if (!unidade) {
      return res.status(404).json({
        success: false,
        error: 'Unidade de saúde não encontrada'
      });
    }

    if (nota === undefined || nota === null || isNaN(nota) || Number(nota) < 1 || Number(nota) > 5) {
      return res.status(400).json({
        success: false,
        error: 'A nota da avaliação deve ser um número entre 1 e 5'
      });
    }

    const novaAvaliacao = await unidadesService.saveAvaliacao(id, {
      user_id,
      nome,
      nota: Number(nota),
      comentario
    });

    res.status(201).json({
      success: true,
      message: 'Avaliação registrada com sucesso',
      avaliacao: novaAvaliacao
    });
  } catch (error) {
    console.error('Erro ao cadastrar avaliação:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno ao registrar avaliação'
    });
  }
});

export default router;
