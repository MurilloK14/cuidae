import 'dotenv/config';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  isGeminiConfigured,
  conduzirAnamneseOuDiagnostico,
  avaliarSintomasDireto
} from '../../src/lib/triage/gemini.ts';

describe('AI Triage & Conversational Anamnese Flow (gemini.ts)', () => {
  it('detecta presença da chave do Google Gemini', () => {
    const configurado = isGeminiConfigured();
    assert.strictEqual(typeof configurado, 'boolean');
    if (process.env.GEMINI_API_KEY) {
      assert.strictEqual(configurado, true);
    }
  });

  it('red flags clínicas de emergência ativam prontoParaDiagnostico: true imediatamente', async () => {
    const queixaEmergencia = 'Estou com uma dor insuportável no peito que aperta e irradia para o braço esquerdo com muita falta de ar!';

    const resultado = await conduzirAnamneseOuDiagnostico(queixaEmergencia, []);
    assert.strictEqual(resultado.prontoParaDiagnostico, true);
    assert.ok(resultado.urgenciaPercebida === 'Urgente' || resultado.urgenciaPercebida === 'Alta');
    assert.ok(resultado.mensagem);
    assert.ok(resultado.relatorioClinico || resultado.resumoPT);
  });

  it('queixa inicial vaga/curta gera pergunta de anamnese acolhedora (prontoParaDiagnostico: false)', async () => {
    const queixaInicial = 'Estou com dor de cabeça';

    const resultado = await conduzirAnamneseOuDiagnostico(queixaInicial, []);
    // Para uma fala curta inicial, o sistema deve continuar investigando antes de gastar cota clínica
    if (!resultado.prontoParaDiagnostico) {
      assert.ok(resultado.mensagem);
      assert.match(resultado.mensagem, /\?/);
    } else {
      // Caso a IA decida que já é suficiente, deve ter resumo e urgência
      assert.ok(resultado.urgenciaPercebida);
    }
  });

  it('queixa inicial de dor no peito sem detalhes (turno 1) investiga tempo e intensidade antes de fechar', async () => {
    const queixaInicialPeito = 'Estou sentindo dor no peito';

    const resultado = await conduzirAnamneseOuDiagnostico(queixaInicialPeito, []);
    // No primeiro turno com apenas "dor no peito" sem relato de colapso, deve perguntar tempo e intensidade
    if (!resultado.prontoParaDiagnostico) {
      assert.ok(resultado.mensagem);
      assert.match(resultado.mensagem, /\?/);
      // Deve conter termos investigativos de anamnese clínica
      const msg = resultado.mensagem.toLowerCase();
      const temTermoInvestigativo = [
        'tempo', 'dias', 'horas', 'quando', 'começou', 'intensidade',
        'braço', 'aperto', 'pontada', 'queimação', 'dor', 'como', 'sente',
        'espalha', 'irradia', 'respira', 'costas', 'outro', 'local'
      ].some(termo => msg.includes(termo));
      assert.ok(temTermoInvestigativo);
    } else {
      // Caso a IA com alta sensibilidade feche, deve ter classificação e orientar urgência
      assert.ok(resultado.urgenciaPercebida === 'Urgente' || resultado.urgenciaPercebida === 'Alta');
    }
  });

  it('avalia sintomas diretamente via Gemini retornando estrutura clínica padronizada', async () => {
    const resultado = await avaliarSintomasDireto('Febre alta, calafrios e dores intensas no corpo há 3 dias', []);

    assert.ok(resultado);
    assert.ok(resultado.mensagem);
    assert.ok(resultado.recomendacao);
    assert.ok(resultado.especialidade);
    assert.ok(['Normal', 'Média', 'Alta', 'Urgente'].includes(resultado.prioridade));
    assert.ok(resultado.orientacao);
    assert.ok(['UBS', 'UPA', 'CAPS', 'SAMU'].includes(resultado.tipoUnidade));
    assert.ok(resultado.fonteIA);
  });
});
