import { describe, it } from 'node:test';
import assert from 'node:assert';
import unidadesService from '../../server/services/unidadesService.js';

describe('Unidades de Saúde Service (unidadesService.js)', () => {
  describe('calcularDistanciaKm (Fórmula de Haversine)', () => {
    it('retorna null se qualquer coordenada for nula ou indefinida', () => {
      assert.strictEqual(unidadesService.calcularDistanciaKm(null, -36.4966, -8.89, -36.50), null);
      assert.strictEqual(unidadesService.calcularDistanciaKm(-8.88, undefined, -8.89, -36.50), null);
    });

    it('retorna 0 para a mesma localização', () => {
      const dist = unidadesService.calcularDistanciaKm(-8.8826, -36.4966, -8.8826, -36.4966);
      assert.strictEqual(dist, 0);
    });

    it('calcula com precisão a distância entre dois pontos conhecidos (SP a RJ ~358km)', () => {
      // São Paulo: -23.5505, -46.6333 | Rio de Janeiro: -22.9068, -43.1729
      const dist = unidadesService.calcularDistanciaKm(-23.5505, -46.6333, -22.9068, -43.1729);
      assert.ok(dist >= 350 && dist <= 370, `Distância calculada foi ${dist}km, esperada entre 350 e 370km`);
    });
  });

  describe('getAllUnidades & getUnidadeById', () => {
    it('carrega a lista de unidades cadastradas', async () => {
      const unidades = await unidadesService.getAllUnidades();
      assert.ok(Array.isArray(unidades));
      assert.ok(unidades.length > 0, 'Deve conter unidades cadastradas no banco');
      assert.ok(unidades[0].nome, 'Unidade deve ter nome');
      assert.ok(unidades[0].id, 'Unidade deve ter id');
    });

    it('retorna uma unidade existente por seu ID único', async () => {
      const unidades = await unidadesService.getAllUnidades();
      const primeira = unidades[0];
      const encontrada = await unidadesService.getUnidadeById(primeira.id);

      assert.ok(encontrada);
      assert.strictEqual(encontrada.id, primeira.id);
      assert.strictEqual(encontrada.nome, primeira.nome);
    });

    it('retorna null para ID de unidade inexistente', async () => {
      const inexistente = await unidadesService.getUnidadeById('id-inexistente-xyz-99999');
      assert.strictEqual(inexistente, null);
    });
  });

  describe('Filtros: Categoria, Especialidade e Busca Textual', () => {
    it('filtra unidades por categoria (ex: hospital)', async () => {
      const hospitais = await unidadesService.getUnidadesByCategoria('hospital');
      assert.ok(Array.isArray(hospitais));
      assert.ok(hospitais.length > 0);
      for (const h of hospitais) {
        assert.strictEqual(h.categoria.toLowerCase(), 'hospital');
      }
    });

    it('filtra unidades por especialidade médica existente', async () => {
      const unidades = await unidadesService.getUnidadesByEspecialidade('pediatria');
      assert.ok(Array.isArray(unidades));
      for (const u of unidades) {
        const tem = u.especialidades.some(e => e.toLowerCase().includes('pediatria'));
        assert.ok(tem, `Unidade ${u.nome} deveria conter especialidade pediatria`);
      }
    });

    it('busca textual encontra unidades por nome, bairro ou especialidade', async () => {
      const resultados = await unidadesService.searchUnidades('Dom Moura');
      assert.ok(resultados.length > 0);
      assert.ok(resultados.some(u => u.nome.includes('Dom Moura')));
    });

    it('busca vazia retorna todas as unidades', async () => {
      const todas = await unidadesService.getAllUnidades();
      const buscaVazia = await unidadesService.searchUnidades('');
      assert.strictEqual(buscaVazia.length, todas.length);
    });
  });

  describe('getRecomendacao (Algoritmo de Priorização e Scoring)', () => {
    it('prioriza unidades com serviço de urgência 24h para diagnósticos de emergência', async () => {
      const recomendacoes = await unidadesService.getRecomendacao(
        'dor forte no peito e emergência',
        'cardiologia',
        'hospital',
        -8.8826,
        -36.4966
      );

      assert.ok(recomendacoes.length > 0);
      const top = recomendacoes[0];
      assert.ok(top.score > 50, `Score da melhor unidade deve ser alto: ${top.score}`);
      assert.ok(top.tem_urgencia, 'Unidade prioritária para emergência deve possuir urgência');
      assert.ok(top.motivoRecomendacao.length > 0);
    });

    it('calcula distância estimada quando lat e lng do usuário são passados', async () => {
      const recomendacoes = await unidadesService.getRecomendacao(
        'febre baixa e dor de garganta',
        'clínica geral',
        'ubs',
        -8.8826,
        -36.4966
      );

      assert.ok(recomendacoes.length > 0);
      const comDistancia = recomendacoes.find(r => r.distanciaKm !== null);
      assert.ok(comDistancia, 'Ao menos uma unidade deve ter distância calculada em km');
      assert.strictEqual(typeof comDistancia.distanciaKm, 'number');
    });
  });

  describe('Avaliações (saveAvaliacao & getAvaliacoesByUnidade)', () => {
    it('salva e recupera uma nova avaliação com sucesso', async () => {
      const unidades = await unidadesService.getAllUnidades();
      const unidadeId = unidades[0].id;

      const nova = await unidadesService.saveAvaliacao(unidadeId, {
        user_id: 'test_user_rev',
        nome: 'Maria Silva Teste',
        nota: 5,
        comentario: 'Atendimento humanizado e excelente estrutura SUS!'
      });

      assert.ok(nova.id);
      assert.strictEqual(nova.unidade_id, unidadeId);
      assert.strictEqual(nova.nota, 5);
      assert.strictEqual(nova.nome, 'Maria Silva Teste');

      const avaliacoes = await unidadesService.getAvaliacoesByUnidade(unidadeId);
      const encontrada = avaliacoes.find(a => a.id === nova.id);
      assert.ok(encontrada, 'A nova avaliação deve estar presente na lista da unidade');
    });
  });
});
