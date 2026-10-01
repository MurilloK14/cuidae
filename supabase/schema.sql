-- ==============================================================================
-- SAÚDEPRA TODOS - SCHEMA DO BANCO DE DADOS (PostgreSQL / Supabase) v2
-- Script idempotente: limpa definições antigas de desenvolvimento e recria tudo.
-- ==============================================================================

-- 1. EXTENSÕES
create extension if not exists "uuid-ossp";

-- 2. LIMPEZA SEGURA DE TABELAS/VIEWS ANTIGAS (evita conflito de colunas do v1)
drop view if exists public.view_alertas_epidemiologicos cascade;
drop table if exists public.triagem_respostas cascade;
drop table if exists public.triagem_fotos cascade;
drop table if exists public.triagem_resultados cascade;
drop table if exists public.teleconsultas cascade;
drop table if exists public.assinaturas cascade;
drop table if exists public.lembretes cascade;
drop table if exists public.triagens cascade;
drop table if exists public.unidades_saude cascade;
drop table if exists public.clinicas_planos cascade;
drop table if exists public.secretarias_saude cascade;

-- 3. TIPOS CUSTOMIZADOS (ENUMS)
do $$ begin
  create type public.camada_tipo as enum ('gratuita', 'intermediaria', 'premium');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.urgencia_tipo as enum ('verde', 'amarelo', 'vermelho');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.recomendacao_tipo as enum ('ubs', 'upa', 'teleconsulta', 'esperar');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.status_contrato_tipo as enum ('ativo', 'piloto', 'encerrado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.tipo_parceiro_clinica as enum ('clinica', 'plano_saude');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.status_teleconsulta as enum ('agendada', 'concluida', 'cancelada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.status_lembrete as enum ('pendente', 'enviado', 'concluido');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.unidade_tipo as enum ('ubs', 'upa', 'hospital_publico');
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------------------------
-- 4. TABELA: PROFILES (Preserva tabela de perfis caso já existam cadastros)
-- ------------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  nome_completo text not null,
  telefone text,
  data_nascimento date,
  cidade text not null,
  uf varchar(2) not null,
  camada public.camada_tipo default 'gratuita' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ------------------------------------------------------------------------------
-- 5. TABELA: SECRETARIAS_SAUDE (Secretarias municipais/estaduais parceiras B2G)
-- ------------------------------------------------------------------------------
create table public.secretarias_saude (
  id uuid default gen_random_uuid() primary key,
  municipio text not null,
  uf varchar(2) not null,
  responsavel_nome text,
  contato_email text not null,
  contato_telefone text,
  status_contrato public.status_contrato_tipo default 'piloto' not null,
  created_at timestamptz default now() not null
);

-- ------------------------------------------------------------------------------
-- 6. TABELA: UNIDADES_SAUDE (UBS, UPA e Hospitais da rede municipal)
-- ------------------------------------------------------------------------------
create table public.unidades_saude (
  id uuid default gen_random_uuid() primary key,
  secretaria_id uuid references public.secretarias_saude(id) on delete set null,
  nome text not null,
  tipo public.unidade_tipo not null,
  endereco text not null,
  cidade text not null,
  uf varchar(2) not null,
  latitude double precision not null,
  longitude double precision not null,
  telefone text,
  created_at timestamptz default now() not null
);

-- ------------------------------------------------------------------------------
-- 7. TABELA: CLINICAS_PLANOS (Clínicas e Planos de Saúde Parceiros B2B)
-- ------------------------------------------------------------------------------
create table public.clinicas_planos (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  tipo public.tipo_parceiro_clinica not null,
  cidade text not null,
  uf varchar(2) not null,
  status_parceria public.status_contrato_tipo default 'ativo' not null,
  valor_mensalidade_centavos integer default 0 not null,
  created_at timestamptz default now() not null
);

-- ------------------------------------------------------------------------------
-- 8. TABELA: TRIAGENS (Otimizada para FastAPI + Infermedica com JSONB)
-- ------------------------------------------------------------------------------
create table public.triagens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  sintoma_principal text not null,
  duracao text,
  intensidade integer check (intensidade between 1 and 10),
  respostas jsonb default '[]'::jsonb not null,
  nivel_urgencia public.urgencia_tipo not null,
  recomendacao public.recomendacao_tipo not null,
  explicacao text,
  foto_storage_path text,
  cidade_snapshot text not null,
  uf_snapshot varchar(2) not null,
  created_at timestamptz default now() not null
);

-- ------------------------------------------------------------------------------
-- 9. TABELA: TELECONSULTAS (Camada Intermediária / Premium)
-- ------------------------------------------------------------------------------
create table public.teleconsultas (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  clinica_id uuid references public.clinicas_planos(id) on delete restrict not null,
  triagem_id uuid references public.triagens(id) on delete set null,
  profissional_nome text,
  data_agendamento timestamptz not null,
  status public.status_teleconsulta default 'agendada' not null,
  valor_cobrado_centavos integer not null,
  comissao_plataforma_centavos integer not null,
  link_sala text,
  created_at timestamptz default now() not null
);

-- ------------------------------------------------------------------------------
-- 10. TABELA: ASSINATURAS (Camada Premium vinculada a clínicas/planos parceiros)
-- ------------------------------------------------------------------------------
create table public.assinaturas (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  clinica_plano_id uuid references public.clinicas_planos(id) on delete set null,
  status text default 'ativa' not null,
  valor_mensalidade_centavos integer not null,
  created_at timestamptz default now() not null,
  expires_at timestamptz
);

-- ------------------------------------------------------------------------------
-- 11. TABELA: LEMBRETES (Vacinas e Consultas integradas ao fluxo SUS)
-- ------------------------------------------------------------------------------
create table public.lembretes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  tipo text check (tipo in ('vacina', 'consulta')) not null,
  descricao text not null,
  data_agendada date not null,
  status public.status_lembrete default 'pendente' not null,
  created_at timestamptz default now() not null
);

-- ------------------------------------------------------------------------------
-- 12. VIEW ANALÍTICA: MAPAS DE ALERTA DE SAÚDE (100% Anonimizada - LGPD)
-- ------------------------------------------------------------------------------
create view public.view_alertas_epidemiologicos as
select
  date_trunc('day', t.created_at) as data_referencia,
  t.cidade_snapshot as cidade,
  t.uf_snapshot as uf,
  t.sintoma_principal,
  t.nivel_urgencia,
  t.recomendacao,
  count(t.id) as total_casos
from public.triagens t
group by
  date_trunc('day', t.created_at),
  t.cidade_snapshot,
  t.uf_snapshot,
  t.sintoma_principal,
  t.nivel_urgencia,
  t.recomendacao;

-- ------------------------------------------------------------------------------
-- 13. ÍNDICES DE PERFORMANCE
-- ------------------------------------------------------------------------------
create index idx_triagens_user_date on public.triagens(user_id, created_at desc);
create index idx_triagens_cidade_data on public.triagens(cidade_snapshot, created_at desc);
create index idx_triagens_respostas_gin on public.triagens using gin (respostas);
create index idx_lembretes_user_status on public.lembretes(user_id, status, data_agendada);
create index idx_teleconsultas_user on public.teleconsultas(user_id, data_agendamento);
create index idx_teleconsultas_clinica on public.teleconsultas(clinica_id, status);
create index idx_unidades_cidade on public.unidades_saude(cidade, tipo);

-- ------------------------------------------------------------------------------
-- 14. ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.triagens enable row level security;
alter table public.teleconsultas enable row level security;
alter table public.assinaturas enable row level security;
alter table public.lembretes enable row level security;
alter table public.unidades_saude enable row level security;
alter table public.secretarias_saude enable row level security;
alter table public.clinicas_planos enable row level security;

-- PROFILES (Drop policy if exists para evitar erros de duplicidade)
drop policy if exists "Pacientes gerenciam proprio perfil" on public.profiles;
drop policy if exists "Usuários podem ver seu próprio perfil" on public.profiles;
drop policy if exists "Usuários podem atualizar seu próprio perfil" on public.profiles;
drop policy if exists "Usuários podem inserir seu próprio perfil" on public.profiles;

create policy "Pacientes gerenciam proprio perfil"
  on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);

-- TRIAGENS
create policy "Pacientes gerenciam proprias triagens"
  on public.triagens for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- TELECONSULTAS
create policy "Pacientes veem proprias teleconsultas"
  on public.teleconsultas for select using (auth.uid() = user_id);

-- ASSINATURAS
create policy "Pacientes veem proprias assinaturas"
  on public.assinaturas for select using (auth.uid() = user_id);

create policy "Pacientes criam assinaturas"
  on public.assinaturas for insert with check (auth.uid() = user_id);

-- LEMBRETES
create policy "Pacientes gerenciam proprios lembretes"
  on public.lembretes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- UNIDADES DE SAÚDE
create policy "Usuarios autenticados consultam unidades"
  on public.unidades_saude for select to authenticated using (true);

-- CLÍNICAS E PLANOS PARCEIROS
create policy "Usuarios autenticados consultam clinicas"
  on public.clinicas_planos for select to authenticated using (true);

-- ------------------------------------------------------------------------------
-- 15. STORAGE BUCKET: triagem-fotos
-- ------------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('triagem-fotos', 'triagem-fotos', false)
on conflict (id) do nothing;

drop policy if exists "Upload autenticado de fotos de triagem" on storage.objects;
drop policy if exists "Leitura autenticada de fotos de triagem" on storage.objects;
drop policy if exists "Usuários autenticados podem fazer upload de fotos de triagem" on storage.objects;
drop policy if exists "Usuários podem ver fotos de triagem no bucket" on storage.objects;

create policy "Upload autenticado de fotos de triagem"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'triagem-fotos' and auth.role() = 'authenticated');

create policy "Leitura autenticada de fotos de triagem"
  on storage.objects for select to authenticated
  using (bucket_id = 'triagem-fotos');

-- ------------------------------------------------------------------------------
-- 16. DADOS DE SEED INICIAIS
-- ------------------------------------------------------------------------------
insert into public.secretarias_saude (municipio, uf, responsavel_nome, contato_email, contato_telefone, status_contrato)
values ('São Paulo', 'SP', 'Secretaria Municipal de Saúde - SP', 'saude@capital.sp.gov.br', '(11) 3397-2000', 'ativo')
on conflict do nothing;

insert into public.clinicas_planos (nome, tipo, cidade, uf, status_parceria, valor_mensalidade_centavos)
values
  ('Clínica Saúde Total', 'clinica', 'São Paulo', 'SP', 'ativo', 150000),
  ('Plano Vida Bem', 'plano_saude', 'São Paulo', 'SP', 'ativo', 350000)
on conflict do nothing;

insert into public.unidades_saude (nome, tipo, endereco, cidade, uf, latitude, longitude, telefone)
values
  ('UPA 24h Centro', 'upa', 'Av. Central, 500', 'São Paulo', 'SP', -23.55052, -46.633308, '(11) 3456-7890'),
  ('UBS Jardim Saúde', 'ubs', 'Rua das Flores, 120', 'São Paulo', 'SP', -23.56152, -46.643308, '(11) 3456-7891'),
  ('UBS Vila Nova', 'ubs', 'Praça da Matriz, 45', 'São Paulo', 'SP', -23.57252, -46.653308, '(11) 3456-7892')
on conflict do nothing;
