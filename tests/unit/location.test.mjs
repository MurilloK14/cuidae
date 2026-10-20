import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  mapearUrgencia,
  getLocal as getLocalFrontend,
  gerarLinkMaps as gerarLinkMapsFrontend
} from '../../src/lib/triage/location.ts';
import {
  getLocal as getLocalBackend,
  gerarLinkMaps as gerarLinkMapsBackend
} from '../../server/services/locationService.js';

describe('Location & Maps Routing (location.ts & locationService.js)', () => {
  describe('mapearUrgencia (Protocolo de Manchester / Triagem)', () => {
    it('mapeia prioridade Urgente para nível vermelho e recomendação upa', () => {
      const res = mapearUrgencia('Urgente');
      assert.deepStrictEqual(res, { nivel_urgencia: 'vermelho', recomendacao: 'upa' });
    });

    it('mapeia prioridade Alta e Média para nível amarelo e recomendação ubs', () => {
      assert.deepStrictEqual(mapearUrgencia('Alta'), { nivel_urgencia: 'amarelo', recomendacao: 'ubs' });
      assert.deepStrictEqual(mapearUrgencia('Média'), { nivel_urgencia: 'amarelo', recomendacao: 'ubs' });
    });

    it('mapeia prioridade Normal e desconhecidas para nível verde e teleconsulta', () => {
      assert.deepStrictEqual(mapearUrgencia('Normal'), { nivel_urgencia: 'verde', recomendacao: 'teleconsulta' });
      assert.deepStrictEqual(mapearUrgencia('Outro'), { nivel_urgencia: 'verde', recomendacao: 'teleconsulta' });
    });
  });

  describe('getLocal (Roteamento de Camadas e Urgências)', () => {
    const services = [
      { nome: 'Frontend (location.ts)', getLocal: getLocalFrontend },
      { nome: 'Backend (locationService.js)', getLocal: getLocalBackend }
    ];

    for (const { nome, getLocal } of services) {
      it(`[${nome}] Prioridade Urgente sempre encaminha para UPA / Pronto-Socorro / SAMU 192 independente da camada`, () => {
        const res = getLocal('Premium', 'Urgente', 'UBS');
        assert.match(res, /UPA \/ Pronto-Socorro mais próximo — SAMU 192/i);
      });

      it(`[${nome}] Camada Premium direciona para Teleconsulta Imediata com Especialista`, () => {
        const res = getLocal('Premium', 'Normal', 'UBS');
        assert.strictEqual(res, 'Teleconsulta Imediata com Especialista');
      });

      it(`[${nome}] Camada Intermediário direciona para Teleconsulta com Especialista (em até 24h)`, () => {
        const res = getLocal('Intermediário', 'Normal', 'UBS');
        assert.strictEqual(res, 'Teleconsulta com Especialista (Atendimento em até 24h)');
      });

      it(`[${nome}] Camada Gratuita direciona para a unidade SUS correspondente (UBS, UPA, CAPS)`, () => {
        assert.strictEqual(getLocal('Gratuito', 'Normal', 'UBS'), 'UBS Mais Próxima (Atendimento Presencial)');
        assert.strictEqual(getLocal('Gratuito', 'Normal', 'UPA'), 'UPA mais próxima');
        assert.strictEqual(getLocal('Gratuito', 'Normal', 'CAPS'), 'CAPS mais próximo');
      });
    }
  });

  describe('gerarLinkMaps (Geração de rotas no Google Maps e SAMU)', () => {
    const services = [
      { nome: 'Frontend', fn: gerarLinkMapsFrontend },
      { nome: 'Backend', fn: gerarLinkMapsBackend }
    ];

    for (const { nome, fn } of services) {
      it(`[${nome}] Retorna telefone 192 quando tipo da unidade for SAMU`, () => {
        const link = fn(-8.8826, -36.4966, 'SAMU');
        assert.strictEqual(link.tipo, 'telefone');
        assert.strictEqual(link.url, 'tel:192');
        assert.match(link.label, /192/);
      });

      it(`[${nome}] Gera link georreferenciado do Google Maps com coordenadas lat/lng`, () => {
        const link = fn(-8.8826, -36.4966, 'UBS');
        assert.strictEqual(link.tipo, 'mapa');
        assert.match(link.url, /google\.com\/maps\/search/);
        assert.match(link.url, /@-8\.8826,-36\.4966,14z/);
        assert.match(link.label, /UBS mais próxima no Google Maps/i);
      });

      it(`[${nome}] Gera link de busca sem coordenadas se localização do usuário não for fornecida`, () => {
        const link = fn(null, null, 'UPA');
        assert.strictEqual(link.tipo, 'mapa');
        assert.match(link.url, /google\.com\/maps\/search\/UPA%20Unidade%20de%20Pronto%20Atendimento/);
        assert.doesNotMatch(link.url, /@/);
      });
    }
  });
});
