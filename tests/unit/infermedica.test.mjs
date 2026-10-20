import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  isInfermedicaConfigured,
  traduzirParaInglesClinico,
  traduzirNomeCondicao,
  traduzirNomeSintoma,
  formatarResultadoInfermedica
} from '../../src/lib/triage/infermedica.ts';

describe('Infermedica Clinical Engine (infermedica.ts)', () => {
  describe('Configuração e detecção de chaves', () => {
    it('verifica se o serviço está configurado com credenciais válidas', () => {
      const configurado = isInfermedicaConfigured();
      assert.strictEqual(typeof configurado, 'boolean');
      if (process.env.INFERMEDICA_APP_ID && process.env.INFERMEDICA_APP_KEY) {
        assert.strictEqual(configurado, true);
      }
    });
  });

  describe('Dicionário e Tradução PT-BR -> EN Clínico (traduzirParaInglesClinico)', () => {
    it('traduz termos de pele e erupções cutâneas', () => {
      assert.strictEqual(traduzirParaInglesClinico('manchas na pele e coceira'), 'skin rash e itching');
      assert.strictEqual(traduzirParaInglesClinico('manchas vermelhas'), 'red spots on skin');
    });

    it('traduz sintomas graves e dores agudas', () => {
      assert.strictEqual(traduzirParaInglesClinico('dor no peito e falta de ar'), 'chest pain e shortness of breath');
      assert.strictEqual(traduzirParaInglesClinico('dor de cabeça forte'), 'severe headache');
      assert.strictEqual(traduzirParaInglesClinico('dores no corpo e dor nas articulações'), 'generalized body aches e joint pain');
    });

    it('traduz febre, tosse e sintomas respiratórios', () => {
      assert.strictEqual(traduzirParaInglesClinico('febre alta e tosse seca'), 'high fever e dry cough');
      assert.strictEqual(traduzirParaInglesClinico('dor de garganta e nariz entupido'), 'sore throat e nasal congestion');
    });
  });

  describe('Tradução de Hipóteses Diagnósticas e Sintomas para PT-BR', () => {
    it('traduz nomes de doenças e condições clínicas para o paciente', () => {
      assert.strictEqual(traduzirNomeCondicao('Heart attack'), 'Infarto Agudo do Miocárdio');
      assert.strictEqual(traduzirNomeCondicao('Common cold'), 'Resfriado Comum');
      assert.strictEqual(traduzirNomeCondicao('Migraine'), 'Enxaqueca');
      assert.strictEqual(traduzirNomeCondicao('Dengue'), 'Dengue');
      assert.strictEqual(traduzirNomeCondicao('COVID-19'), 'COVID-19');
      // Termo não listado deve ser mantido
      assert.strictEqual(traduzirNomeCondicao('CondicaoRaraDesconhecida'), 'CondicaoRaraDesconhecida');
    });

    it('traduz nomes de sintomas clínicos para exibição clara ao paciente', () => {
      assert.strictEqual(traduzirNomeSintoma('Fever'), 'Febre');
      assert.strictEqual(traduzirNomeSintoma('Chest pain'), 'Dor no peito');
      assert.strictEqual(traduzirNomeSintoma('Shortness of breath'), 'Falta de ar');
      assert.strictEqual(traduzirNomeSintoma('Severe headache'), 'Dor de cabeça forte');
    });
  });

  describe('formatarResultadoInfermedica (Classificação de Risco e Encaminhamento)', () => {
    it('classifica emergência com SAMU quando triage_level for emergency_ambulance', () => {
      const mockResult = {
        evidencias: [{ name: 'Chest pain' }],
        diagnostico: {
          conditions: [
            { name: 'Heart attack', common_name: 'Heart attack', probability: 0.88 }
          ]
        },
        triagem: { triage_level: 'emergency_ambulance' }
      };

      const formatado = formatarResultadoInfermedica(mockResult);
      assert.strictEqual(formatado.prioridade, 'Urgente');
      assert.strictEqual(formatado.tipoUnidade, 'SAMU');
      assert.match(formatado.mensagem, /ALERTA DE URGÊNCIA/i);
      assert.match(formatado.mensagem, /Infarto Agudo do Miocárdio \(88%\)/);
      assert.match(formatado.orientacao, /dirija-se imediatamente/i);
    });

    it('classifica caso agudo (consultation_24) como Alta prioridade e UPA', () => {
      const mockResult = {
        evidencias: [{ name: 'High fever' }, { name: 'Joint pain' }],
        diagnostico: {
          conditions: [
            { name: 'Dengue', common_name: 'Dengue', probability: 0.72 }
          ]
        },
        triagem: { triage_level: 'consultation_24' }
      };

      const formatado = formatarResultadoInfermedica(mockResult);
      assert.strictEqual(formatado.prioridade, 'Alta');
      assert.strictEqual(formatado.tipoUnidade, 'UPA');
      assert.match(formatado.mensagem, /24 horas/i);
      assert.match(formatado.recomendacao, /Dengue \(72%\)/);
    });

    it('classifica caso leve (self_care) como Normal e UBS', () => {
      const mockResult = {
        evidencias: [{ name: 'Runny nose' }],
        diagnostico: {
          conditions: [
            { name: 'Common cold', common_name: 'Common cold', probability: 0.65 }
          ]
        },
        triagem: { triage_level: 'self_care' }
      };

      const formatado = formatarResultadoInfermedica(mockResult);
      assert.strictEqual(formatado.prioridade, 'Normal');
      assert.strictEqual(formatado.tipoUnidade, 'UBS');
      assert.match(formatado.mensagem, /baixa gravidade/i);
      assert.match(formatado.recomendacao, /Resfriado Comum \(65%\)/);
    });
  });
});
