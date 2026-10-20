import { describe, it } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const jiti = require('jiti')(process.cwd(), {
  alias: { '@': path.resolve('./src') }
});

const vacinasRoute = jiti('./src/app/api/vacinas/route.ts');
const vacinasScanRoute = jiti('./src/app/api/vacinas/scan/route.ts');

describe('/api/vacinas and /api/vacinas/scan Integration Tests', () => {
  describe('GET /api/vacinas', () => {
    it('retorna lista de vacinas e estatísticas com status 200', async () => {
      const req = new Request('http://localhost:3000/api/vacinas');
      const res = await vacinasRoute.GET(req);
      assert.strictEqual(res.status, 200);

      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(typeof data.total, 'number');
      assert.ok(data.estatisticas);
      assert.ok(Array.isArray(data.vacinas));
    });
  });

  describe('POST /api/vacinas', () => {
    it('retorna 400 quando o nome da vacina for omitido', async () => {
      const req = new Request('http://localhost:3000/api/vacinas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dose: '1ª Dose' })
      });

      const res = await vacinasRoute.POST(req);
      assert.strictEqual(res.status, 400);

      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.match(data.error, /nome da vacina é obrigatório/i);
    });

    it('cadastra uma vacina manualmente com sucesso', async () => {
      const payload = {
        nome_vacina: 'Varicela (Catapora)',
        dose: '1ª Dose',
        data_aplicacao: '2023-05-12',
        fabricante: 'GSK',
        lote: 'VAR9901',
        local_aplicacao: 'UBS Centro',
        origem_dado: 'caderneta_papel'
      };

      const req = new Request('http://localhost:3000/api/vacinas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const res = await vacinasRoute.POST(req);
      assert.strictEqual(res.status, 200);

      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.vacina);
      assert.strictEqual(data.vacina.nome_vacina, 'Varicela (Catapora)');
    });
  });

  describe('DELETE /api/vacinas', () => {
    it('retorna 400 quando o parâmetro id for omitido', async () => {
      const req = new Request('http://localhost:3000/api/vacinas');
      const res = await vacinasRoute.DELETE(req);
      assert.strictEqual(res.status, 400);
    });

    it('exclui a vacina informada por ID', async () => {
      // Cria uma vacina primeiro para excluir
      const createReq = new Request('http://localhost:3000/api/vacinas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome_vacina: 'Vacina para deletar teste' })
      });
      const createRes = await vacinasRoute.POST(createReq);
      const { vacina } = await createRes.json();

      const delReq = new Request(`http://localhost:3000/api/vacinas?id=${vacina.id}`);
      const delRes = await vacinasRoute.DELETE(delReq);
      assert.strictEqual(delRes.status, 200);

      const delData = await delRes.json();
      assert.strictEqual(delData.success, true);
    });
  });

  describe('POST /api/vacinas/scan (IA Vision)', () => {
    it('rejeita requisição quando a imagem em base64 for vazia', async () => {
      const req = new Request('http://localhost:3000/api/vacinas/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const res = await vacinasScanRoute.POST(req);
      assert.strictEqual(res.status, 400);

      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.match(data.error, /imagem.*obrigatória/i);
    });

    it('processa e extrai registros de imunização de imagem da carteira de vacinas', async () => {
      // 1x1 pixel JPEG transparente em base64
      const sampleBase64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

      const req = new Request('http://localhost:3000/api/vacinas/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imagemBase64: sampleBase64,
          mimeType: 'image/jpeg',
          autoSalvar: true
        })
      });

      const res = await vacinasScanRoute.POST(req);
      assert.strictEqual(res.status, 200);

      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.analise);
      assert.ok(data.analise.tipo_documento_detectado);
      assert.ok(Array.isArray(data.analise.vacinas_extraidas));
      assert.ok(Array.isArray(data.vacinasSalvas));
    });
  });
});
