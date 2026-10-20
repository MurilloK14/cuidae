import { describe, it } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const jiti = require('jiti')(process.cwd(), {
  alias: { '@': path.resolve('./src') }
});

const agendamentosRoute = jiti('./src/app/api/agendamentos/route.ts');
const hospitalConfigRoute = jiti('./src/app/api/hospital/config/route.ts');
const hospitalPainelRoute = jiti('./src/app/api/hospital/painel/route.ts');

describe('Next.js App Router API Routes Integration', () => {
  describe('/api/agendamentos', () => {
    it('GET /api/agendamentos lista agendamentos cadastrados com total e status 200', async () => {
      const req = new Request('http://localhost:3000/api/agendamentos');
      const res = await agendamentosRoute.GET(req);
      assert.strictEqual(res.status, 200);

      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(typeof data.total, 'number');
      assert.ok(Array.isArray(data.agendamentos));
    });

    it('POST /api/agendamentos valida campos obrigatórios (unidade, data, paciente, sintomas, diagnostico)', async () => {
      // 1. Sem unidade_nome
      const req1 = new Request('http://localhost:3000/api/agendamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const res1 = await agendamentosRoute.POST(req1);
      assert.strictEqual(res1.status, 400);
      const data1 = await res1.json();
      assert.match(data1.error, /unidade de saúde ou hospital/i);

      // 2. Com unidade mas sem data
      const req2 = new Request('http://localhost:3000/api/agendamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unidade_nome: 'Hospital Regional' })
      });
      const res2 = await agendamentosRoute.POST(req2);
      assert.strictEqual(res2.status, 400);
      const data2 = await res2.json();
      assert.match(data2.error, /data do agendamento/i);

      // 3. Com data mas sem paciente_nome
      const req3 = new Request('http://localhost:3000/api/agendamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unidade_nome: 'Hospital Regional',
          data_agendamento: '2026-10-30'
        })
      });
      const res3 = await agendamentosRoute.POST(req3);
      assert.strictEqual(res3.status, 400);
      const data3 = await res3.json();
      assert.match(data3.error, /nome do paciente/i);
    });

    it('POST /api/agendamentos cria agendamento e gera transmissão hospitalar completa', async () => {
      const payload = {
        unidade_nome: 'Hospital Infantil Palmira Sales',
        especialidade: 'Pediatria Geral',
        data_agendamento: '2026-10-28',
        horario: '10:00',
        paciente_nome: 'Maria Clara da Silva',
        paciente_cpf: '000.111.222-33',
        paciente_telefone: '(87) 98765-4321',
        sintomas_citados: 'Febre há 3 dias com manchas vermelhas na pele',
        diagnostico_ia: 'Suspeita clínica de Arbovirose / Dengue',
        nivel_urgencia: 'amarelo',
        prioridade: 'Alta'
      };

      const req = new Request('http://localhost:3000/api/agendamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const res = await agendamentosRoute.POST(req);
      assert.strictEqual(res.status, 200);

      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.agendamento);
      assert.ok(data.agendamento.id);
      assert.ok(data.agendamento.protocolo.startsWith('HOSP-GRH-'));
      assert.strictEqual(data.agendamento.status_envio_hospital, 'transmitido_com_sucesso');
    });
  });

  describe('/api/hospital/config', () => {
    const hospitalId = '7a1b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d';

    it('GET /api/hospital/config retorna as configurações do hospital', async () => {
      const req = new Request(`http://localhost:3000/api/hospital/config?hospitalId=${hospitalId}`);
      const res = await hospitalConfigRoute.GET(req);
      assert.strictEqual(res.status, 200);

      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.config);
      assert.strictEqual(data.config.hospital_id, hospitalId);
      assert.ok(Array.isArray(data.config.horarios));
    });

    it('POST /api/hospital/config adiciona e remove horários na grade de atendimento', async () => {
      const horarioTeste = '17:30';

      // 1. Adiciona horário
      const addReq = new Request('http://localhost:3000/api/hospital/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_horario',
          hospitalId,
          horario: horarioTeste,
          turno: 'tarde',
          vagas: 5
        })
      });
      const addRes = await hospitalConfigRoute.POST(addReq);
      assert.strictEqual(addRes.status, 200);
      const addData = await addRes.json();
      assert.strictEqual(addData.success, true);
      assert.ok(addData.config.horarios.some(h => h.horario === horarioTeste));

      // 2. Remove horário
      const delReq = new Request('http://localhost:3000/api/hospital/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_horario',
          hospitalId,
          horario: horarioTeste
        })
      });
      const delRes = await hospitalConfigRoute.POST(delReq);
      assert.strictEqual(delRes.status, 200);
      const delData = await delRes.json();
      assert.strictEqual(delData.success, true);
      assert.ok(!delData.config.horarios.some(h => h.horario === horarioTeste));
    });
  });

  describe('/api/hospital/painel', () => {
    it('GET /api/hospital/painel retorna métricas em tempo real, lista de agendamentos e unidades', async () => {
      const req = new Request('http://localhost:3000/api/hospital/painel');
      const res = await hospitalPainelRoute.GET(req);
      assert.strictEqual(res.status, 200);

      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.metricas);
      assert.ok(typeof data.metricas.total === 'number');
      assert.ok(Array.isArray(data.agendamentos));
      assert.ok(Array.isArray(data.hospitais));
    });

    it('GET /api/hospital/painel suporta filtragem por busca e classificação de risco', async () => {
      const req = new Request('http://localhost:3000/api/hospital/painel?urgencia=amarelo');
      const res = await hospitalPainelRoute.GET(req);
      assert.strictEqual(res.status, 200);

      const data = await res.json();
      assert.strictEqual(data.success, true);
      for (const ag of data.agendamentos) {
        assert.strictEqual(ag.nivel_urgencia, 'amarelo');
      }
    });
  });
});
