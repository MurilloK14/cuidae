-- ==============================================================================
-- SAÚDEIA - SCHEMA DO BANCO DE DADOS SUPABASE (PostgreSQL)
-- Copie e cole este script no SQL Editor do seu painel Supabase.
-- ==============================================================================

-- 1. EXTENSÕES NECESSÁRIAS
create extension if not exists "uuid-ossp";

-- 2. TIPOS CUSTOMIZADOS (ENUMS)
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
  create type public.lembrete_tipo as enum ('vacina', 'consulta', 'retorno', 'exame');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.assinatura_plano as enum ('intermediaria', 'premium');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.assinatura_status as enum ('ativa', 'cancelada', 'expirada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.unidade_tipo as enum ('ubs', 'upa', 'hospital', 'clinica');
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------------------------
-- 3. TABELA: PROFILES (Perfis de usuário estendendo auth.users)
-- ------------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  nome_completo text,
  telefone text,
  data_nascimento date,
  cidade text,
  uf varchar(2),
  camada public.camada_tipo default 'gratuita' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ------------------------------------------------------------------------------
-- 4. TABELA: TRIAGENS (Registro principal de cada triagem)
-- ------------------------------------------------------------------------------
create table if not exists public.triagens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  sintoma_principal text not null,
  duracao text,
  intensidade integer check (intensidade >= 1 and intensidade <= 10),
  created_at timestamptz default now() not null
);

-- ------------------------------------------------------------------------------
-- 5. TABELA: TRIAGEM_RESPOSTAS (Perguntas e respostas de acompanhamento)
-- ------------------------------------------------------------------------------
create table if not exists public.triagem_respostas (
  id uuid default gen_random_uuid() primary key,
  triagem_id uuid references public.triagens(id) on delete cascade not null,
  pergunta text not null,
  resposta text not null,
  created_at timestamptz default now() not null
);

-- ------------------------------------------------------------------------------
-- 6. TABELA: TRIAGEM_FOTOS (Fotos anexadas na triagem com path no storage)
-- ------------------------------------------------------------------------------
create table if not exists public.triagem_fotos (
  id uuid default gen_random_uuid() primary key,
  triagem_id uuid references public.triagens(id) on delete cascade not null,
  storage_path text not null,
  descricao text,
  created_at timestamptz default now() not null
);

-- ------------------------------------------------------------------------------
-- 7. TABELA: TRIAGEM_RESULTADOS (Resultado e recomendação da triagem)
-- ------------------------------------------------------------------------------
create table if not exists public.triagem_resultados (
  id uuid default gen_random_uuid() primary key,
  triagem_id uuid references public.triagens(id) on delete cascade not null unique,
  nivel_urgencia public.urgencia_tipo default 'verde' not null,
  recomendacao public.recomendacao_tipo default 'esperar' not null,
  explicacao text not null,
  created_at timestamptz default now() not null
);

-- ------------------------------------------------------------------------------
-- 8. TABELA: LEMBRETES (Vacinas, consultas, exames futuros)
-- ------------------------------------------------------------------------------
create table if not exists public.lembretes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  tipo public.lembrete_tipo default 'consulta' not null,
  descricao text not null,
  data_lembrete date not null,
  concluido boolean default false not null,
  created_at timestamptz default now() not null
);

-- ------------------------------------------------------------------------------
-- 9. TABELA: ASSINATURAS (Upgrades de plano e histórico financeiro)
-- ------------------------------------------------------------------------------
create table if not exists public.assinaturas (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  plano public.assinatura_plano not null,
  status public.assinatura_status default 'ativa' not null,
  gateway_id text,
  preco_centavos integer default 0 not null,
  created_at timestamptz default now() not null,
  expires_at timestamptz
);

-- ------------------------------------------------------------------------------
-- 10. TABELA: UNIDADES_SAUDE (Rede de atendimento UBS, UPA, Clínicas)
-- ------------------------------------------------------------------------------
create table if not exists public.unidades_saude (
  id uuid default gen_random_uuid() primary key,
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

-- Inserção de dados iniciais de exemplo (seed para testes locais)
insert into public.unidades_saude (nome, tipo, endereco, cidade, uf, latitude, longitude, telefone)
values
  ('UPA 24h Centro', 'upa', 'Av. Central, 500', 'São Paulo', 'SP', -23.55052, -46.633308, '(11) 3456-7890'),
  ('UBS Jardim Saúde', 'ubs', 'Rua das Flores, 120', 'São Paulo', 'SP', -23.56152, -46.643308, '(11) 3456-7891'),
  ('UBS Vila Nova', 'ubs', 'Praça da Matriz, 45', 'São Paulo', 'SP', -23.57252, -46.653308, '(11) 3456-7892')
on conflict do nothing;

-- ==============================================================================
-- 11. ROW LEVEL SECURITY (RLS) - SEGURANÇA E PRIVACIDADE
-- Garante que cada usuário só leia e escreva em seus próprios registros.
-- ==============================================================================

alter table public.profiles enable row level security;
alter table public.triagens enable row level security;
alter table public.triagem_respostas enable row level security;
alter table public.triagem_fotos enable row level security;
alter table public.triagem_resultados enable row level security;
alter table public.lembretes enable row level security;
alter table public.assinaturas enable row level security;
alter table public.unidades_saude enable row level security;

-- Políticas: PROFILES
create policy "Usuários podem ver seu próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Usuários podem atualizar seu próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Usuários podem inserir seu próprio perfil"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Políticas: TRIAGENS
create policy "Usuários podem ver suas próprias triagens"
  on public.triagens for select
  using (auth.uid() = user_id);

create policy "Usuários podem criar suas próprias triagens"
  on public.triagens for insert
  with check (auth.uid() = user_id);

-- Políticas: TRIAGEM_RESPOSTAS
create policy "Usuários podem ver respostas das suas triagens"
  on public.triagem_respostas for select
  using (exists (select 1 from public.triagens t where t.id = triagem_id and t.user_id = auth.uid()));

create policy "Usuários podem inserir respostas nas suas triagens"
  on public.triagem_respostas for insert
  with check (exists (select 1 from public.triagens t where t.id = triagem_id and t.user_id = auth.uid()));

-- Políticas: TRIAGEM_FOTOS
create policy "Usuários podem ver fotos das suas triagens"
  on public.triagem_fotos for select
  using (exists (select 1 from public.triagens t where t.id = triagem_id and t.user_id = auth.uid()));

create policy "Usuários podem inserir fotos nas suas triagens"
  on public.triagem_fotos for insert
  with check (exists (select 1 from public.triagens t where t.id = triagem_id and t.user_id = auth.uid()));

-- Políticas: TRIAGEM_RESULTADOS
create policy "Usuários podem ver resultados das suas triagens"
  on public.triagem_resultados for select
  using (exists (select 1 from public.triagens t where t.id = triagem_id and t.user_id = auth.uid()));

create policy "Usuários podem inserir resultados nas suas triagens"
  on public.triagem_resultados for insert
  with check (exists (select 1 from public.triagens t where t.id = triagem_id and t.user_id = auth.uid()));

-- Políticas: LEMBRETES
create policy "Usuários podem gerenciar seus próprios lembretes"
  on public.lembretes for all
  using (auth.uid() = user_id);

-- Políticas: ASSINATURAS
create policy "Usuários podem ver suas assinaturas"
  on public.assinaturas for select
  using (auth.uid() = user_id);

create policy "Usuários podem criar assinaturas"
  on public.assinaturas for insert
  with check (auth.uid() = user_id);

-- Políticas: UNIDADES_SAUDE (Todos usuários autenticados podem consultar unidades)
create policy "Todos podem consultar unidades de saúde"
  on public.unidades_saude for select
  to authenticated
  using (true);

-- ==============================================================================
-- 12. STORAGE BUCKET: triagem-fotos
-- ==============================================================================
insert into storage.buckets (id, name, public)
values ('triagem-fotos', 'triagem-fotos', false)
on conflict (id) do nothing;

create policy "Usuários autenticados podem fazer upload de fotos de triagem"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'triagem-fotos' and auth.role() = 'authenticated');

create policy "Usuários podem ver fotos de triagem no bucket"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'triagem-fotos');
