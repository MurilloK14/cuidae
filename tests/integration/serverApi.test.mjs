import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';

// Configura NODE_ENV como 'test' para que server/index.js não execute listen automaticamente na porta 3001
process.env.NODE_ENV = 'test';

const { app } = await import('../../server/index.js');

describe('Server API Integration Tests (Express Backend)', () => {
  let server;
  let baseUrl;

  before(async () => {
    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  describe('GET /api/health', () => {
    it('retorna status 200 com status "ok" e timestamp ISO', async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      assert.strictEqual(res.status, 200);

      const data = await res.json();
      assert.strictEqual(data.status, 'ok');
      assert.ok(data.timestamp);
      assert.ok(new Date(data.timestamp).getTime() > 0);
    });
  });

  describe('GET /api/triage/welcome', () => {
    it('retorna mensagem inicial de acolhimento ao paciente', async () => {
      const res = await fetch(`${baseUrl}/api/triage/welcome`);
      assert.strictEqual(res.status, 200);

      const data = await res.json();
      assert.ok(data.texto);
      assert.match(data.texto, /assistente.*triagem/i);
    });
  });

  describe('GET /api/unidades', () => {
    it('lista todas as unidades de saúde cadastradas', async () => {
      const res = await fetch(`${baseUrl}/api/unidades`);
      assert.strictEqual(res.status, 200);

      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(Array.isArray(data.unidades));
      assert.strictEqual(data.total, data.unidades.length);
      assert.ok(data.total > 0);
    });

    it('filtra unidades por categoria via query param ?categoria=hospital', async () => {
      const res = await fetch(`${baseUrl}/api/unidades?categoria=hospital`);
      assert.strictEqual(res.status, 200);

      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.unidades.length > 0);
      for (const u of data.unidades) {
        assert.strictEqual(u.categoria.toLowerCase(), 'hospital');
      }
    });

    it('busca unidades por termo textual via ?q=Garanhuns', async () => {
      const res = await fetch(`${baseUrl}/api/unidades?q=Garanhuns`);
      assert.strictEqual(res.status, 200);

      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.unidades.length > 0);
    });
  });

  describe('GET /api/unidades/recomendar', () => {
    it('recomenda unidades considerando sintomas, especialidade e geolocalização', async () => {
      const res = await fetch(
        `${baseUrl}/api/unidades/recomendar?diagnostico=dor+forte+no+peito&especialidade=cardiologia&tipoUnidade=hospital&lat=-8.8826&lng=-36.4966`
      );
      assert.strictEqual(res.status, 200);

      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.unidades.length > 0);

      const top = data.unidades[0];
      assert.ok(top.score !== undefined);
      assert.ok(top.motivoRecomendacao);
    });
  });

  describe('GET /api/unidades/:id', () => {
    it('retorna os detalhes de uma unidade existente com suas avaliações', async () => {
      // Pega uma unidade existente primeiro
      const listRes = await fetch(`${baseUrl}/api/unidades`);
      const { unidades } = await listRes.json();
      const id = unidades[0].id;

      const res = await fetch(`${baseUrl}/api/unidades/${id}`);
      assert.strictEqual(res.status, 200);

      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.unidade.id, id);
      assert.ok(Array.isArray(data.unidade.avaliacoes));
    });

    it('retorna 404 para ID de unidade inexistente', async () => {
      const res = await fetch(`${baseUrl}/api/unidades/id-inexistente-404`);
      assert.strictEqual(res.status, 404);

      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.match(data.error, /não encontrada/i);
    });
  });

  describe('POST /api/unidades/:id/avaliacoes', () => {
    it('rejeita avaliação com nota inválida (< 1 ou > 5)', async () => {
      const listRes = await fetch(`${baseUrl}/api/unidades`);
      const { unidades } = await listRes.json();
      const id = unidades[0].id;

      const res = await fetch(`${baseUrl}/api/unidades/${id}/avaliacoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: 'Testador',
          nota: 10, // Inválido
          comentario: 'Muito bom'
        })
      });

      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.match(data.error, /entre 1 e 5/i);
    });

    it('cadastra nova avaliação com sucesso', async () => {
      const listRes = await fetch(`${baseUrl}/api/unidades`);
      const { unidades } = await listRes.json();
      const id = unidades[0].id;

      const res = await fetch(`${baseUrl}/api/unidades/${id}/avaliacoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: 'Paciente Teste Integração',
          nota: 5,
          comentario: 'Excelente acolhimento e agilidade no atendimento!'
        })
      });

      assert.strictEqual(res.status, 201);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.avaliacao.id);
      assert.strictEqual(data.avaliacao.nota, 5);
    });
  });

  describe('POST /api/triage/symptoms', () => {
    it('retorna 400 quando o campo sintoma for omitido ou vazio', async () => {
      const res = await fetch(`${baseUrl}/api/triage/symptoms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sintoma: '   ' })
      });

      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.match(data.error, /obrigatório/i);
    });

    it('processa sintomas do paciente e responde com mensagem humanizada e direcionamento clínico', async () => {
      const res = await fetch(`${baseUrl}/api/triage/symptoms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sintoma: 'Estou com muita febre alta e dores pelo corpo há 2 dias',
          camada: 'Gratuito',
          lat: -8.8826,
          lng: -36.4966
        })
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.remetente, 'bot');
      assert.ok(data.texto);
      assert.ok(data.timestamp);

      // Ou é pergunta de anamnese conversacional ou triagem finalizada
      if (data.prontoParaDiagnostico) {
        assert.ok(data.triagem);
        assert.ok(data.triagem.recomendacao);
        assert.ok(data.triagem.nivel_urgencia);
        assert.ok(data.mapa);
      } else {
        assert.strictEqual(data.prontoParaDiagnostico, false);
      }
    });
  });
});
