import { describe, it } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const jiti = require('jiti')(process.cwd(), {
  alias: { '@': path.resolve('./src') }
});

const medicamentosRoute = jiti('./src/app/api/medicamentos/route.ts');

describe('GET /api/medicamentos Integration Tests', () => {
  it('retorna lista completa de medicamentos e estatísticas com status 200', async () => {
    const req = new Request('http://localhost:3000/api/medicamentos');
    const res = await medicamentosRoute.GET(req);
    assert.strictEqual(res.status, 200);

    const data = await res.json();
    assert.ok(Array.isArray(data.medicamentos));
    assert.ok(data.total >= 10);
    assert.ok(data.estatisticas);
    assert.ok(data.estatisticas.total >= 10);
  });

  it('filtra medicamentos por termo de busca via ?q=insulina', async () => {
    const req = new Request('http://localhost:3000/api/medicamentos?q=insulina');
    const res = await medicamentosRoute.GET(req);
    assert.strictEqual(res.status, 200);

    const data = await res.json();
    assert.ok(data.medicamentos.length > 0);
    assert.ok(data.medicamentos.every(m => m.nome.toLowerCase().includes('insulina') || m.principio_ativo.toLowerCase().includes('insulina')));
  });

  it('retorna um único medicamento quando o parâmetro ?id=med-001 for fornecido', async () => {
    const req = new Request('http://localhost:3000/api/medicamentos?id=med-001');
    const res = await medicamentosRoute.GET(req);
    assert.strictEqual(res.status, 200);

    const data = await res.json();
    assert.ok(data.medicamento);
    assert.strictEqual(data.medicamento.id, 'med-001');
    assert.match(data.medicamento.nome, /Losartana/i);
  });

  it('retorna 404 quando o parâmetro ?id for inexistente', async () => {
    const req = new Request('http://localhost:3000/api/medicamentos?id=med-falso-999');
    const res = await medicamentosRoute.GET(req);
    assert.strictEqual(res.status, 404);

    const data = await res.json();
    assert.match(data.error, /não encontrado/i);
  });
});
