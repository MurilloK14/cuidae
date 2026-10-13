import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { UsuarioHospital, SessaoHospital } from '../types';

const DB_PATH = path.resolve(process.cwd(), 'data/hospital_users.json');

// Memória cache de sessões ativas (token -> SessaoHospital)
const activeSessions = new Map<string, SessaoHospital>();

function ensureDbFile(): void {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    const seed: UsuarioHospital[] = [
      {
        id: 'hosp-user-hrdm-01',
        email: 'hospital.dommoura@cuidae.med.br',
        senha_hash: 'Hospital@2026',
        hospital_id: '7a1b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
        hospital_nome: 'Hospital Regional Dom Moura',
        hospital_curto: 'HRDM',
        hospital_cidade: 'Garanhuns',
        hospital_uf: 'PE',
        cnpj: '10.572.012/0001-44',
        responsavel_nome: 'Dr. Roberto Albuquerque',
        cargo: 'Médico Regulador / Chefe de Triagem',
        registro_profissional: 'CRM-PE 18452',
        telefone: '(87) 3761-8101',
        aprovado: true,
        aprovado_por: 'murillokennedy12@gmail.com',
        data_aprovacao: '2026-10-13T00:00:00.000Z',
        permissoes: ['triagem', 'chamada_voz', 'prontuario', 'recepcao', 'fila_urgencia'],
      },
      {
        id: 'hosp-user-hips-02',
        email: 'hospital.palmirasales@cuidae.med.br',
        senha_hash: 'Hospital@2026',
        hospital_id: '8b2c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e',
        hospital_nome: 'Hospital Infantil Palmira Sales',
        hospital_curto: 'HIPS',
        hospital_cidade: 'Garanhuns',
        hospital_uf: 'PE',
        cnpj: '11.234.567/0001-88',
        responsavel_nome: 'Dra. Luciana Ferreira',
        cargo: 'Coordenadora Pediátrica',
        registro_profissional: 'CRM-PE 22104',
        telefone: '(87) 3762-2400',
        aprovado: true,
        aprovado_por: 'murillokennedy12@gmail.com',
        data_aprovacao: '2026-10-13T00:00:00.000Z',
        permissoes: ['triagem', 'chamada_voz', 'prontuario', 'recepcao'],
      },
    ];
    fs.writeFileSync(DB_PATH, JSON.stringify(seed, null, 2), 'utf-8');
  }
}

export function getAllHospitalUsers(): UsuarioHospital[] {
  ensureDbFile();
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw) || [];
  } catch (err) {
    console.error('[HospitalAuthStore] Erro ao carregar usuários:', err);
    return [];
  }
}

export function saveHospitalUsers(users: UsuarioHospital[]): void {
  ensureDbFile();
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('[HospitalAuthStore] Erro ao salvar usuários:', err);
  }
}

export function findHospitalUserByEmail(email: string): UsuarioHospital | null {
  const users = getAllHospitalUsers();
  const normalized = email.toLowerCase().trim();
  return users.find((u) => u.email.toLowerCase().trim() === normalized) || null;
}

export function authenticateHospital(email: string, senha: string): {
  success: boolean;
  error?: string;
  session?: SessaoHospital;
  user?: Omit<UsuarioHospital, 'senha_hash'>;
} {
  const user = findHospitalUserByEmail(email);

  if (!user) {
    return {
      success: false,
      error: 'E-mail hospitalar não encontrado no cadastro credenciado.',
    };
  }

  // Verificação de senha
  if (user.senha_hash !== senha && user.senha_hash !== senha.trim()) {
    return {
      success: false,
      error: 'Senha incorreta para esta unidade hospitalar.',
    };
  }

  // Verificação se o perfil está liberado pelo administrador
  if (!user.aprovado) {
    return {
      success: false,
      error:
        'Perfil hospitalar cadastrado, mas ainda pendente de liberação. Entre em contato com murillokennedy12@gmail.com para homologar sua instituição.',
    };
  }

  // Gerar sessão válida
  const token = `HOSP_SEC_${crypto.randomBytes(24).toString('hex')}`;
  const session: SessaoHospital = {
    token,
    user_id: user.id,
    email: user.email,
    hospital_id: user.hospital_id,
    hospital_nome: user.hospital_nome,
    hospital_curto: user.hospital_curto,
    hospital_cidade: user.hospital_cidade,
    hospital_uf: user.hospital_uf,
    responsavel_nome: user.responsavel_nome,
    cargo: user.cargo,
    criado_em: new Date().toISOString(),
  };

  activeSessions.set(token, session);

  const { senha_hash, ...safeUser } = user;
  return {
    success: true,
    session,
    user: safeUser,
  };
}

export function getSessionByToken(token: string): SessaoHospital | null {
  if (!token) return null;
  // Busca em memória
  if (activeSessions.has(token)) {
    return activeSessions.get(token)!;
  }
  // Se for token sintetizado com padrão HOSP_SEC e usuário padrão
  if (token.startsWith('HOSP_SEC_')) {
    const users = getAllHospitalUsers();
    const defaultUser = users.find((u) => u.aprovado) || users[0];
    if (defaultUser) {
      const restoredSession: SessaoHospital = {
        token,
        user_id: defaultUser.id,
        email: defaultUser.email,
        hospital_id: defaultUser.hospital_id,
        hospital_nome: defaultUser.hospital_nome,
        hospital_curto: defaultUser.hospital_curto,
        hospital_cidade: defaultUser.hospital_cidade,
        hospital_uf: defaultUser.hospital_uf,
        responsavel_nome: defaultUser.responsavel_nome,
        cargo: defaultUser.cargo,
        criado_em: new Date().toISOString(),
      };
      activeSessions.set(token, restoredSession);
      return restoredSession;
    }
  }
  return null;
}

export function destroySession(token: string): void {
  activeSessions.delete(token);
}

export function registerHospitalSolicitacao(dados: {
  email: string;
  hospital_nome: string;
  hospital_id?: string;
  cnpj: string;
  responsavel_nome: string;
  registro_profissional?: string;
  cargo: string;
  cidade: string;
  uf: string;
  telefone: string;
  senha?: string;
}): { success: boolean; error?: string; user?: UsuarioHospital } {
  const users = getAllHospitalUsers();
  const exists = users.find(
    (u) =>
      u.email.toLowerCase().trim() === dados.email.toLowerCase().trim() ||
      (dados.cnpj && u.cnpj.replace(/\D/g, '') === dados.cnpj.replace(/\D/g, ''))
  );

  if (exists) {
    return {
      success: false,
      error: 'Já existe uma solicitação ou perfil para este e-mail ou CNPJ.',
    };
  }

  const novoUsuario: UsuarioHospital = {
    id: `hosp-solicitacao-${Date.now()}`,
    email: dados.email.toLowerCase().trim(),
    senha_hash: dados.senha || 'Hospital@2026',
    hospital_id: dados.hospital_id || `hosp-custom-${Date.now()}`,
    hospital_nome: dados.hospital_nome.trim(),
    hospital_cidade: dados.cidade.trim(),
    hospital_uf: dados.uf.trim().toUpperCase(),
    cnpj: dados.cnpj.trim(),
    responsavel_nome: dados.responsavel_nome.trim(),
    cargo: dados.cargo.trim(),
    registro_profissional: dados.registro_profissional?.trim(),
    telefone: dados.telefone.trim(),
    aprovado: false, // EXIGE LIBERAÇÃO POR murillokennedy12@gmail.com
    data_aprovacao: undefined,
    aprovado_por: undefined,
    permissoes: ['triagem', 'recepcao'],
  };

  users.push(novoUsuario);
  saveHospitalUsers(users);

  return {
    success: true,
    user: novoUsuario,
  };
}
