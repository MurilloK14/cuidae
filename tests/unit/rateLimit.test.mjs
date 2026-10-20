import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  LIMITES_USUARIO,
  checarLimiteUsuario,
  registrarConsumoUsuario,
  extrairIdentificadorUsuario
} from '../../src/lib/triage/rateLimit.ts';

describe('Rate Limiter & Token Budgeting (rateLimit.ts)', () => {
  it('permite acesso inicial de novo usuário com cotas cheias', () => {
    const userId = `test_user_init_${Date.now()}`;
    const checagem = checarLimiteUsuario(userId, 300);

    assert.strictEqual(checagem.permitido, true);
    assert.strictEqual(checagem.mensagensRestantes, LIMITES_USUARIO.MAX_MENSAGENS_POR_HORA);
    assert.strictEqual(checagem.tokensRestantes, LIMITES_USUARIO.MAX_TOKENS_POR_DIA);
  });

  it('bloqueia usuário quando limite de mensagens por hora é atingido', () => {
    const userId = `test_user_msg_limit_${Date.now()}`;

    // Consome até o limite máximo de mensagens por hora
    for (let i = 0; i < LIMITES_USUARIO.MAX_MENSAGENS_POR_HORA; i++) {
      const antes = checarLimiteUsuario(userId, 50);
      assert.strictEqual(antes.permitido, true);
      registrarConsumoUsuario(userId, 50, false);
    }

    // A próxima requisição deve ser bloqueada
    const excedido = checarLimiteUsuario(userId, 50);
    assert.strictEqual(excedido.permitido, false);
    assert.match(excedido.motivo || '', /Limite de mensagens por hora atingido/i);
  });

  it('bloqueia usuário quando limite diário de triagens é atingido', () => {
    const userId = `test_user_triage_limit_${Date.now()}`;

    // Consome até o limite de triagens
    for (let i = 0; i < LIMITES_USUARIO.MAX_TRIAGENS_POR_DIA; i++) {
      registrarConsumoUsuario(userId, 100, true);
    }

    const excedido = checarLimiteUsuario(userId, 100);
    assert.strictEqual(excedido.permitido, false);
    assert.match(excedido.motivo || '', /Limite di[aá]rio de atendimentos de triagem atingido/i);
  });

  it('bloqueia usuário quando orçamento diário de tokens é excedido', () => {
    const userId = `test_user_token_limit_${Date.now()}`;

    // Consome tokens próximos ao limite
    registrarConsumoUsuario(userId, LIMITES_USUARIO.MAX_TOKENS_POR_DIA - 100, false);

    // Tentar chamada com custo maior que o saldo
    const excedido = checarLimiteUsuario(userId, 200);
    assert.strictEqual(excedido.permitido, false);
    assert.match(excedido.motivo || '', /Cota di[aá]ria de processamento por IA atingida/i);
  });

  it('extrai identificador do usuário corretamente via bodyUserId, x-forwarded-for, x-real-ip e fallback', () => {
    // 1. bodyUserId válido
    const req1 = new Request('http://localhost/api', { headers: {} });
    assert.strictEqual(extrairIdentificadorUsuario(req1, 'user-12345'), 'user_user-12345');

    // 2. x-forwarded-for com múltiplos IPs
    const req2 = new Request('http://localhost/api', {
      headers: { 'x-forwarded-for': '203.0.113.195, 70.41.3.18' }
    });
    assert.strictEqual(extrairIdentificadorUsuario(req2), 'ip_203.0.113.195');

    // 3. x-real-ip
    const req3 = new Request('http://localhost/api', {
      headers: { 'x-real-ip': '198.51.100.1' }
    });
    assert.strictEqual(extrairIdentificadorUsuario(req3), 'ip_198.51.100.1');

    // 4. Fallback sem cabeçalhos nem user
    const req4 = new Request('http://localhost/api', { headers: {} });
    assert.strictEqual(extrairIdentificadorUsuario(req4), 'sessao_padrao');
  });
});
