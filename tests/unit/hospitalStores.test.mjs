import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const jiti = require('jiti')(process.cwd());

const {
  authenticateHospital,
  getSessionByToken,
  destroySession,
  registerHospitalSolicitacao,
  findHospitalUserByEmail
} = jiti('./src/lib/db/hospitalAuthStore.ts');

const {
  getHospitalConfig,
  updateHospitalConfig
} = jiti('./src/lib/db/hospitalConfigStore.ts');

const {
  saveAgendamento,
  getAgendamentoById,
  updateAgendamentoStatus,
  getMetricasHospital
} = jiti('./src/lib/db/agendamentoStore.ts');

const {
  saveTriagemToStore,
  getTriagemFromStore
} = jiti('./src/lib/db/triageStore.ts');

describe('Hospital Database Stores & State Management', () => {
  describe('Hospital Auth Store (hospitalAuthStore.ts)', () => {
    it('autentica com sucesso usuário hospitalar homologado', () => {
      const email = 'hospital.dommoura@cuidae.med.br';
      const senha = 'Hospital@2026';

      const auth = authenticateHospital(email, senha);
      assert.strictEqual(auth.success, true);
      assert.ok(auth.session);
      assert.ok(auth.session.token.startsWith('HOSP_SEC_'));
      assert.strictEqual(auth.session.hospital_nome, 'Hospital Regional Dom Moura');
      assert.strictEqual(auth.user.email, email);
      assert.strictEqual(auth.user.senha_hash, undefined, 'A senha nunca deve vazar no objeto user');

      // Verifica recuperação de sessão pelo token
      const sessionRetrieved = getSessionByToken(auth.session.token);
      assert.ok(sessionRetrieved);
      assert.strictEqual(sessionRetrieved.token, auth.session.token);

      // Destrói sessão
      destroySession(auth.session.token);
    });

    it('rejeita autenticação com senha incorreta', () => {
      const email = 'hospital.dommoura@cuidae.med.br';
      const senhaErrada = 'SenhaInvalida@999';

      const auth = authenticateHospital(email, senhaErrada);
      assert.strictEqual(auth.success, false);
      assert.match(auth.error || '', /Senha incorreta/i);
    });

    it('rejeita autenticação para e-mail hospitalar inexistente', () => {
      const auth = authenticateHospital('desconhecido@hospital.com', 'QualquerSenha');
      assert.strictEqual(auth.success, false);
      assert.match(auth.error || '', /não encontrado/i);
    });

    it('registra solicitação de novo hospital como pendente de homologação (aprovado: false)', () => {
      const testEmail = `hospital.teste.${Date.now()}@cuidae.med.br`;
      const cnpj = `${Math.floor(10000000 + Math.random() * 90000000)}/0001-99`;

      const reg = registerHospitalSolicitacao({
        email: testEmail,
        hospital_nome: 'Hospital Geral de Teste',
        cnpj,
        responsavel_nome: 'Dr. Testador',
        cargo: 'Diretor Clínico',
        cidade: 'Garanhuns',
        uf: 'PE',
        telefone: '(87) 99999-0000'
      });

      assert.strictEqual(reg.success, true);
      assert.ok(reg.user);
      assert.strictEqual(reg.user.aprovado, false, 'Novo hospital deve aguardar aprovação do administrador');

      // Tentativa de login deve informar que está pendente
      const auth = authenticateHospital(testEmail, 'Hospital@2026');
      assert.strictEqual(auth.success, false);
      assert.match(auth.error || '', /pendente de liberação/i);
    });
  });

  describe('Hospital Config Store (hospitalConfigStore.ts)', () => {
    it('carrega e atualiza configurações operacionais do hospital', () => {
      const hospitalId = '7a1b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d';
      const configInicial = getHospitalConfig(hospitalId);

      assert.ok(configInicial);
      assert.ok(typeof configInicial.tempo_medio_consulta_minutos === 'number');

      // Atualiza tempo médio de consulta
      const novoTempo = 25;
      const atualizado = updateHospitalConfig(hospitalId, {
        tempo_medio_consulta_minutos: novoTempo
      });

      assert.strictEqual(atualizado.tempo_medio_consulta_minutos, novoTempo);

      // Re-lê para confirmar persistência
      const configPersistida = getHospitalConfig(hospitalId);
      assert.strictEqual(configPersistida.tempo_medio_consulta_minutos, novoTempo);
    });
  });

  describe('Agendamento Store (agendamentoStore.ts)', () => {
    it('cria novo agendamento com protocolo, hash de segurança SHA-256 e transmissão hospitalar', async () => {
      const novo = await saveAgendamento({
        paciente_nome: 'Carlos Eduardo Teste',
        paciente_cpf: '123.456.789-00',
        paciente_telefone: '(87) 98888-7777',
        unidade_nome: 'Hospital Regional Dom Moura',
        especialidade: 'Cardiologia',
        data_agendamento: '2026-10-25',
        horario: '09:00',
        sintomas_citados: 'Dor torácica leve',
        diagnostico_ia: 'Avaliação cardiovascular',
        nivel_urgencia: 'amarelo',
        prioridade: 'Média'
      });

      assert.ok(novo.id);
      assert.ok(novo.protocolo.startsWith('HOSP-GRH-'));
      assert.strictEqual(novo.status, 'agendado');
      assert.strictEqual(novo.status_envio_hospital, 'transmitido_com_sucesso');
      assert.ok(novo.transmissao_hospital);
      assert.ok(novo.transmissao_hospital.hash_seguranca);
      assert.strictEqual(novo.transmissao_hospital.hash_seguranca.length, 24);

      // Busca por ID
      const encontrado = await getAgendamentoById(novo.id);
      assert.ok(encontrado);
      assert.strictEqual(encontrado.paciente_nome, 'Carlos Eduardo Teste');

      // Busca por Protocolo
      const encontradoProt = await getAgendamentoById(novo.protocolo);
      assert.ok(encontradoProt);
      assert.strictEqual(encontradoProt.id, novo.id);
    });

    it('atualiza status do agendamento (fluxo de atendimento hospitalar)', async () => {
      const ag = await saveAgendamento({
        paciente_nome: 'Ana Luiza Status Teste',
        unidade_nome: 'Hospital Infantil Palmira Sales',
        status: 'agendado'
      });

      // Transição para confirmado
      const conf = await updateAgendamentoStatus(ag.id, 'confirmado');
      assert.strictEqual(conf.status, 'confirmado');

      // Chamada para atendimento em consultório
      const emAtend = await updateAgendamentoStatus(ag.id, 'em_atendimento', {
        sala_atendimento: 'Consultório 3',
        medico_responsavel: 'Dra. Luciana Ferreira'
      });
      assert.strictEqual(emAtend.status, 'em_atendimento');
      assert.strictEqual(emAtend.sala_atendimento, 'Consultório 3');
      assert.strictEqual(emAtend.medico_responsavel, 'Dra. Luciana Ferreira');

      // Conclusão
      const conc = await updateAgendamentoStatus(ag.id, 'concluido', {
        anotacoes_medicas: 'Paciente medicado e liberado com receita.'
      });
      assert.strictEqual(conc.status, 'concluido');
      assert.strictEqual(conc.anotacoes_medicas, 'Paciente medicado e liberado com receita.');
    });

    it('calcula métricas de atendimento hospitalar com precisão', async () => {
      const metricas = await getMetricasHospital();
      assert.strictEqual(typeof metricas.total, 'number');
      assert.strictEqual(typeof metricas.aguardando, 'number');
      assert.strictEqual(typeof metricas.emAtendimento, 'number');
      assert.strictEqual(typeof metricas.concluidos, 'number');
      assert.strictEqual(typeof metricas.urgentes, 'number');
      assert.ok(metricas.total >= metricas.aguardando + metricas.emAtendimento + metricas.concluidos);
    });
  });

  describe('Triage Store (triageStore.ts)', () => {
    it('salva e recupera uma triagem clínica do banco local', async () => {
      const triagem = await saveTriagemToStore({
        user_id: 'user_teste_store_1',
        sintoma_principal: 'Cefaleia e náuseas',
        nivel_urgencia: 'amarelo',
        recomendacao: 'ubs',
        explicacao: 'Quadro sugestivo de enxaqueca',
        tipoUnidade: 'UBS'
      });

      assert.ok(triagem.id);
      assert.strictEqual(triagem.sintoma_principal, 'Cefaleia e náuseas');
      assert.strictEqual(triagem.nivel_urgencia, 'amarelo');

      const recuperada = await getTriagemFromStore(triagem.id);
      assert.ok(recuperada);
      assert.strictEqual(recuperada.id, triagem.id);
      assert.strictEqual(recuperada.explicacao, 'Quadro sugestivo de enxaqueca');
    });
  });
});
