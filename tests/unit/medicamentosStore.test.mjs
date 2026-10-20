import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  getAllMedicamentos,
  getMedicamentoById,
  searchMedicamentos,
  calcularDistanciaKm,
  getEstatisticasMedicamentos
} from '../../src/lib/db/medicamentosStore.ts';

describe('Medicamentos SUS Store (medicamentosStore.ts)', () => {
  it('carrega a lista inicial de medicamentos essenciais', async () => {
    const lista = await getAllMedicamentos();
    assert.ok(Array.isArray(lista));
    assert.ok(lista.length >= 10);
    const dipirona = lista.find(m => m.nome.toLowerCase().includes('dipirona'));
    assert.ok(dipirona);
    assert.strictEqual(dipirona.categoria, 'Dor e Febre');
    assert.ok(dipirona.unidades_disponiveis.length > 0);
  });

  it('retorna um medicamento existente pelo ID único', async () => {
    const item = await getMedicamentoById('med-001');
    assert.ok(item);
    assert.strictEqual(item.id, 'med-001');
    assert.match(item.nome, /Losartana/i);
    assert.strictEqual(item.categoria, 'Hipertensão');
    assert.ok(item.documentos_exigidos.length > 0);
  });

  it('retorna null para ID inexistente', async () => {
    const item = await getMedicamentoById('med-inexistente-999');
    assert.strictEqual(item, null);
  });

  it('filtra medicamentos por categoria', async () => {
    const diabetes = await searchMedicamentos({ categoria: 'Diabetes' });
    assert.ok(diabetes.length > 0);
    assert.ok(diabetes.every(m => m.categoria === 'Diabetes'));
  });

  it('busca textual encontra medicamentos por princípio ativo e indicação', async () => {
    const buscaPrincipio = await searchMedicamentos({ query: 'amoxicilina' });
    assert.ok(buscaPrincipio.length > 0);
    assert.match(buscaPrincipio[0].principio_ativo, /Amoxicilina/i);

    const buscaIndicacao = await searchMedicamentos({ query: 'pressão alta' });
    assert.ok(buscaIndicacao.length > 0);
    assert.ok(buscaIndicacao.some(m => m.indicacao.toLowerCase().includes('pressão alta')));
  });

  it('calcula distância com precisão quando lat e lng do usuário são informados', async () => {
    // Coordenadas próximas ao Centro de Garanhuns
    const latUsuario = -8.8900;
    const lngUsuario = -36.4920;

    const resultados = await searchMedicamentos({ query: 'losartana', lat: latUsuario, lng: lngUsuario });
    assert.ok(resultados.length > 0);
    const primeiraUnidade = resultados[0].unidades_disponiveis[0];
    assert.ok(typeof primeiraUnidade.distancia_km === 'number');
    assert.ok(primeiraUnidade.distancia_km < 5.0);
  });

  it('calcula fórmula de Haversine corretamente', () => {
    const dist = calcularDistanciaKm(-8.8900, -36.4920, -8.8835, -36.4715);
    assert.ok(typeof dist === 'number');
    assert.ok(dist > 0 && dist < 10);
    assert.strictEqual(calcularDistanciaKm(null, null, -8.8, -36.4), null);
  });

  it('calcula estatísticas agrupadas por categoria e programa', async () => {
    const stats = await getEstatisticasMedicamentos();
    assert.ok(stats.total >= 10);
    assert.ok(stats.porCategoria['Hipertensão'] > 0);
    assert.ok(stats.porCategoria['Diabetes'] > 0);
  });
});
