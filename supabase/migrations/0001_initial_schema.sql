-- =====================================================================
-- Fase 1 — Schema inicial
-- App Pós-Operatório Dr. Taiuã Milan
-- =====================================================================
-- Aplicar via SQL Editor do Supabase, em ordem (0001 → 0002 → 0003 → seed).
-- Pré-requisitos: projeto Supabase em região São Paulo, plano Free OK.
-- =====================================================================

-- Extensões necessárias
create extension if not exists "pgcrypto";   -- gen_random_uuid, crypt, gen_salt
create extension if not exists "citext";     -- emails case-insensitive

-- Schema de funções privadas (não expostas via PostgREST)
create schema if not exists app_private;

-- =====================================================================
-- ENUMS
-- =====================================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'procedimento_tipo') then
    create type procedimento_tipo as enum (
      'ATQ_POSTERIOR',
      'ATQ_ANTERIOR',
      'ARTROSCOPIA'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'lado_corporal') then
    create type lado_corporal as enum (
      'DIREITO',
      'ESQUERDO',
      'BILATERAL'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'foto_status') then
    create type foto_status as enum (
      'PENDENTE',
      'OK',
      'ATENCAO',
      'URGENTE'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'agendamento_status') then
    create type agendamento_status as enum (
      'SOLICITADO',
      'EM_ANALISE',
      'CONFIRMADO',
      'REAGENDADO',
      'CANCELADO'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'agendamento_periodo') then
    create type agendamento_periodo as enum ('MANHA', 'TARDE');
  end if;

  if not exists (select 1 from pg_type where typname = 'chat_role') then
    create type chat_role as enum ('user', 'assistant');
  end if;
end$$;

-- =====================================================================
-- TABELAS
-- =====================================================================

-- Pacientes ----------------------------------------------------------
create table if not exists pacientes (
  id                          uuid primary key default gen_random_uuid(),
  nome                        text not null,
  cpf                         text unique,
  telefone                    text,
  email                       citext,
  procedimento                procedimento_tipo not null,
  lado                        lado_corporal not null,
  data_cirurgia               date not null,
  observacoes_clinicas        text,
  consentimento_lgpd_em       timestamptz,
  consentimento_lgpd_versao   int,
  ativo                       boolean not null default true,
  criado_em                   timestamptz not null default now(),
  atualizado_em               timestamptz not null default now()
);

create index if not exists idx_pacientes_data_cirurgia
  on pacientes(data_cirurgia);
create index if not exists idx_pacientes_ativo
  on pacientes(ativo) where ativo;

-- Acessos do paciente (token único + PIN) ----------------------------
create table if not exists acessos_paciente (
  id                     uuid primary key default gen_random_uuid(),
  paciente_id            uuid not null references pacientes(id) on delete cascade,
  token                  text not null unique,
  pin_hash               text,
  expira_em              timestamptz not null,
  primeiro_acesso_em     timestamptz,
  tentativas_falhas      int not null default 0,
  bloqueado_ate          timestamptz,
  revogado_em            timestamptz,
  criado_em              timestamptz not null default now()
);

create index if not exists idx_acessos_token on acessos_paciente(token);
create index if not exists idx_acessos_paciente on acessos_paciente(paciente_id);

-- Sessões ativas (sessionId opaco entregue ao cliente) ---------------
create table if not exists sessoes_paciente (
  id              uuid primary key default gen_random_uuid(),
  paciente_id     uuid not null references pacientes(id) on delete cascade,
  acesso_id       uuid not null references acessos_paciente(id) on delete cascade,
  criado_em       timestamptz not null default now(),
  expira_em       timestamptz not null,
  revogada_em     timestamptz,
  ip_origem       inet,
  user_agent      text
);

create index if not exists idx_sessoes_paciente on sessoes_paciente(paciente_id);
create index if not exists idx_sessoes_validas
  on sessoes_paciente(id) where revogada_em is null;

-- Marcos da trilha (catálogo por procedimento) -----------------------
create table if not exists marcos_trilha (
  id                  uuid primary key default gen_random_uuid(),
  procedimento        procedimento_tipo not null,
  dia_pos_op          int not null,
  titulo              text not null,
  descricao_md        text not null,
  video_youtube_id    text,
  exercicios          jsonb not null default '[]'::jsonb,
  sinais_alarme_md    text,
  ordem               int not null,
  criado_em           timestamptz not null default now(),
  atualizado_em       timestamptz not null default now(),
  unique (procedimento, dia_pos_op, ordem)
);

create index if not exists idx_marcos_proc_dia
  on marcos_trilha(procedimento, dia_pos_op);

-- Progresso do paciente em cada marco --------------------------------
create table if not exists progresso_paciente (
  paciente_id              uuid not null references pacientes(id) on delete cascade,
  marco_id                 uuid not null references marcos_trilha(id) on delete cascade,
  visualizado_em           timestamptz,
  exercicios_completados   jsonb not null default '[]'::jsonb,
  primary key (paciente_id, marco_id)
);

-- Fotos da ferida ----------------------------------------------------
create table if not exists fotos_ferida (
  id                uuid primary key default gen_random_uuid(),
  paciente_id       uuid not null references pacientes(id) on delete cascade,
  storage_path      text not null,
  enviada_em        timestamptz not null default now(),
  revisada_em       timestamptz,
  parecer_medico    text,
  status            foto_status not null default 'PENDENTE'
);

create index if not exists idx_fotos_paciente on fotos_ferida(paciente_id);
create index if not exists idx_fotos_status on fotos_ferida(status);

-- Mensagens do chat com IA -------------------------------------------
create table if not exists chat_mensagens (
  id                    uuid primary key default gen_random_uuid(),
  paciente_id           uuid not null references pacientes(id) on delete cascade,
  role                  chat_role not null,
  content               text not null,
  red_flag              boolean not null default false,
  encaminhada_medico    boolean not null default false,
  criado_em             timestamptz not null default now()
);

create index if not exists idx_chat_paciente_data
  on chat_mensagens(paciente_id, criado_em desc);
create index if not exists idx_chat_red_flag
  on chat_mensagens(red_flag) where red_flag;

-- Solicitações de agendamento ----------------------------------------
create table if not exists agendamentos_solicitados (
  id                  uuid primary key default gen_random_uuid(),
  paciente_id         uuid not null references pacientes(id) on delete cascade,
  data_preferencial   date not null,
  periodo             agendamento_periodo not null,
  motivo              text,
  status              agendamento_status not null default 'SOLICITADO',
  data_confirmada     timestamptz,
  unidade             text,
  criado_em           timestamptz not null default now(),
  atualizado_em       timestamptz not null default now()
);

create index if not exists idx_agend_status on agendamentos_solicitados(status);
create index if not exists idx_agend_paciente on agendamentos_solicitados(paciente_id);

-- Base de conhecimento (RAG) -----------------------------------------
-- pgvector entra na Fase 5; deixo a tabela base sem o tipo vector.
create table if not exists kb_documentos (
  id                       uuid primary key default gen_random_uuid(),
  titulo                   text not null,
  conteudo_md              text not null,
  procedimento_aplicavel   text[] not null default '{}',
  versao                   int not null default 1,
  ativo                    boolean not null default true,
  criado_em                timestamptz not null default now(),
  atualizado_em            timestamptz not null default now()
);

-- Auditoria genérica -------------------------------------------------
create table if not exists auditoria (
  id            uuid primary key default gen_random_uuid(),
  ator          text not null,
  acao          text not null,
  recurso       text,
  recurso_id    uuid,
  detalhes      jsonb,
  criado_em     timestamptz not null default now()
);

create index if not exists idx_auditoria_data on auditoria(criado_em desc);

-- =====================================================================
-- Trigger genérico: atualiza atualizado_em
-- =====================================================================
create or replace function app_private.tg_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'pacientes',
      'marcos_trilha',
      'agendamentos_solicitados',
      'kb_documentos'
    ])
  loop
    execute format(
      'drop trigger if exists tg_%s_atualizado_em on %I;
       create trigger tg_%s_atualizado_em
         before update on %I
         for each row execute function app_private.tg_atualizado_em();',
      t, t, t, t
    );
  end loop;
end$$;
