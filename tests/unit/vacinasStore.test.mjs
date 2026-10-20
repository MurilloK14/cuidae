import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const jiti = require('jiti')(process.cwd());

const {
  getAllVacinas,
  getVacinasByUser,
  saveVacina,
  saveMultiplasVacinas,
  deleteVacina,
  calcularEstatisticasVacinais,
} = jiti('./src/lib/db/vacinasStore.ts');

describe('Vacinas Database Store (vacinasStore.ts)', () => {
  it('carrega a lista inicial de vacinas cadastradas', async () => {
    const vacinas = await getAllVacinas();
    assert.ok(Array.isArray(vacinas));
    assert.ok(vacinas.length > 0, 'Deve conter vacinas no banco de dados');
    assert.ok(vacinas[0].nome_vacina);
    assert.ok(vacinas[0].dose);
  });

  it('salva uma nova vacina individual com lote, fabricante e autenticação SUS', async () => {
    const testUserId = `user_vac_test_${Date.now()}`;
    const nova = await saveVacina(testUserId, {
      nome_vacina: 'Meningocócica ACWY (Conjugada)',
      dose: 'Reforço',
      data_aplicacao: '2024-06-15',
      lote: 'MNG8841',
      fabricante: 'GSK / GlaxoSmithKline',
      local_aplicacao: 'UBS Centro - Garanhuns/PE',
      origem_dado: 'meu_sus_digital',
      autenticado_sus: true,
    });

    assert.ok(nova.id);
    assert.strictEqual(nova.user_id, testUserId);
    assert.strictEqual(nova.nome_vacina, 'Meningocócica ACWY (Conjugada)');
    assert.strictEqual(nova.autenticado_sus, true);
    assert.strictEqual(nova.origem_dado, 'meu_sus_digital');

    // Recupera vacinas do usuário
    const listaUsuario = await getVacinasByUser(testUserId);
    assert.ok(listaUsuario.some((v) => v.id === nova.id));
  });

  it('salva múltiplas vacinas extraídas pela IA em lote (batch)', async () => {
    const testUserId = `user_batch_${Date.now()}`;
    const loteVacinas = [
      {
        nome_vacina: 'Pneumocócica 10-valente',
        dose: '1ª Dose',
        data_aplicacao: '2023-08-20',
        lote: 'PN1029',
        fabricante: 'Pfizer',
      },
      {
        nome_vacina: 'Tríplice Viral (Sarampo, Caxumba, Rubéola)',
        dose: '2ª Dose',
        data_aplicacao: '2023-11-10',
        lote: 'TV9932',
        fabricante: 'Fiocruz / Bio-Manguinhos',
      },
    ];

    const salvas = await saveMultiplasVacinas(testUserId, loteVacinas, 'caderneta_papel', true);
    assert.strictEqual(salvas.length, 2);
    assert.strictEqual(salvas[0].origem_dado, 'caderneta_papel');
    assert.strictEqual(salvas[1].nome_vacina, 'Tríplice Viral (Sarampo, Caxumba, Rubéola)');
  });

  it('calcula estatísticas vacinais e gera alertas preventivos de reforço do PNI', () => {
    const mockVacinas = [
      {
        id: 'v1',
        user_id: 'test',
        nome_vacina: 'Hepatite B',
        dose: '3ª Dose',
        data_aplicacao: '2020-01-01',
        origem_dado: 'caderneta_papel',
        autenticado_sus: false,
        created_at: new Date().toISOString(),
      },
      {
        id: 'v2',
        user_id: 'test',
        nome_vacina: 'COVID-19 Bivalente',
        dose: 'Reforço',
        data_aplicacao: '2024-02-01',
        origem_dado: 'meu_sus_digital',
        autenticado_sus: true,
        created_at: new Date().toISOString(),
      },
    ];

    const stats = calcularEstatisticasVacinais(mockVacinas);
    assert.strictEqual(stats.totalDoses, 2);
    assert.strictEqual(stats.verificadasSus, 1);
    assert.strictEqual(stats.cadernetaFisica, 1);
    assert.ok(Array.isArray(stats.alertasReforco));
    // Como mock não tem gripe, deve alertar campanha da gripe
    assert.ok(stats.alertasReforco.some((a) => a.vacina.includes('Influenza')));
  });

  it('exclui registro de vacina pelo ID com sucesso', async () => {
    const temp = await saveVacina('user_del', {
      nome_vacina: 'Vacina Temporária para Excluir',
      dose: '1ª Dose',
    });

    const deletado = await deleteVacina(temp.id, 'user_del');
    assert.strictEqual(deletado, true);

    const todas = await getAllVacinas();
    assert.ok(!todas.some((v) => v.id === temp.id));
  });
});
