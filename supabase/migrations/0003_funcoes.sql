-- =====================================================================
-- Fase 1 — Funções RPC públicas para o fluxo paciente
-- =====================================================================
-- Todas SECURITY DEFINER (rodam como owner) e validam internamente.
-- O cliente nunca acessa tabelas direto; só chama estas funções.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Helpers privados
-- ---------------------------------------------------------------------
create or replace function app_private.registrar_auditoria(
  p_ator text,
  p_acao text,
  p_recurso text,
  p_recurso_id uuid,
  p_detalhes jsonb
) returns void
language plpgsql
security definer
set search_path = public, app_private
as $$
begin
  insert into auditoria(ator, acao, recurso, recurso_id, detalhes)
  values (p_ator, p_acao, p_recurso, p_recurso_id, p_detalhes);
end;
$$;

-- Valida formato do PIN (4 a 6 dígitos numéricos)
create or replace function app_private.pin_valido(p_pin text)
returns boolean
language plpgsql
immutable
as $$
begin
  return p_pin is not null
     and length(p_pin) between 4 and 6
     and p_pin ~ '^[0-9]+$';
end;
$$;

-- ---------------------------------------------------------------------
-- iniciar_acesso(token)
-- Primeira chamada feita ao abrir /p/:token
-- Retorna estado público mínimo para a UI decidir o caminho
-- ---------------------------------------------------------------------
create or replace function public.iniciar_acesso(p_token text)
returns table (
  estado            text,           -- 'ONBOARDING' | 'PIN' | 'BLOQUEADO' | 'INVALIDO'
  primeiro_acesso   boolean,
  paciente_nome     text,
  procedimento      procedimento_tipo,
  data_cirurgia     date,
  bloqueado_ate     timestamptz
)
language plpgsql
security definer
set search_path = public, app_private
as $$
declare
  v_acesso  acessos_paciente%rowtype;
  v_pac     pacientes%rowtype;
begin
  if p_token is null or length(p_token) < 16 then
    return query select 'INVALIDO'::text, null::boolean, null::text,
                        null::procedimento_tipo, null::date, null::timestamptz;
    return;
  end if;

  select * into v_acesso from acessos_paciente where token = p_token;
  if not found
     or v_acesso.revogado_em is not null
     or v_acesso.expira_em < now() then
    return query select 'INVALIDO'::text, null::boolean, null::text,
                        null::procedimento_tipo, null::date, null::timestamptz;
    return;
  end if;

  if v_acesso.bloqueado_ate is not null and v_acesso.bloqueado_ate > now() then
    return query select 'BLOQUEADO'::text, null::boolean, null::text,
                        null::procedimento_tipo, null::date, v_acesso.bloqueado_ate;
    return;
  end if;

  select * into v_pac from pacientes where id = v_acesso.paciente_id;
  if not found or not v_pac.ativo then
    return query select 'INVALIDO'::text, null::boolean, null::text,
                        null::procedimento_tipo, null::date, null::timestamptz;
    return;
  end if;

  if v_acesso.pin_hash is null then
    return query select 'ONBOARDING'::text, true, v_pac.nome,
                        v_pac.procedimento, v_pac.data_cirurgia, null::timestamptz;
  else
    return query select 'PIN'::text, false, v_pac.nome,
                        v_pac.procedimento, v_pac.data_cirurgia, null::timestamptz;
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- definir_pin_e_consentir(token, pin, lgpd_versao, user_agent)
-- Usado APENAS no primeiro acesso. Hashea PIN + grava consentimento + cria sessão.
-- ---------------------------------------------------------------------
create or replace function public.definir_pin_e_consentir(
  p_token            text,
  p_pin              text,
  p_lgpd_versao      int,
  p_user_agent       text
)
returns table (session_id uuid, expira_em timestamptz)
language plpgsql
security definer
set search_path = public, app_private
as $$
declare
  v_acesso      acessos_paciente%rowtype;
  v_session_id  uuid;
  v_expira      timestamptz := now() + interval '7 days';
begin
  if not app_private.pin_valido(p_pin) then
    raise exception 'PIN inválido' using errcode = '22023';
  end if;

  select * into v_acesso from acessos_paciente where token = p_token for update;
  if not found
     or v_acesso.revogado_em is not null
     or v_acesso.expira_em < now() then
    raise exception 'Token inválido ou expirado' using errcode = '28000';
  end if;

  if v_acesso.pin_hash is not null then
    raise exception 'PIN já definido para este token' using errcode = '23505';
  end if;

  update acessos_paciente
     set pin_hash           = crypt(p_pin, gen_salt('bf', 10)),
         primeiro_acesso_em = now(),
         tentativas_falhas  = 0
   where id = v_acesso.id;

  update pacientes
     set consentimento_lgpd_em     = now(),
         consentimento_lgpd_versao = coalesce(p_lgpd_versao, 1)
   where id = v_acesso.paciente_id
     and consentimento_lgpd_em is null;

  insert into sessoes_paciente(paciente_id, acesso_id, expira_em, user_agent)
  values (v_acesso.paciente_id, v_acesso.id, v_expira, p_user_agent)
  returning id into v_session_id;

  perform app_private.registrar_auditoria(
    'paciente:' || v_acesso.paciente_id::text,
    'PRIMEIRO_ACESSO',
    'sessoes_paciente',
    v_session_id,
    jsonb_build_object('user_agent', p_user_agent)
  );

  return query select v_session_id, v_expira;
end;
$$;

-- ---------------------------------------------------------------------
-- validar_pin(token, pin, user_agent)
-- Acessos subsequentes. Aplica rate-limit por tentativas.
-- ---------------------------------------------------------------------
create or replace function public.validar_pin(
  p_token       text,
  p_pin         text,
  p_user_agent  text
)
returns table (session_id uuid, expira_em timestamptz)
language plpgsql
security definer
set search_path = public, app_private
as $$
declare
  v_acesso       acessos_paciente%rowtype;
  v_session_id   uuid;
  v_expira       timestamptz := now() + interval '7 days';
  v_max_tents    constant int := 5;
  v_bloqueio     constant interval := interval '15 minutes';
begin
  if not app_private.pin_valido(p_pin) then
    raise exception 'PIN inválido' using errcode = '22023';
  end if;

  select * into v_acesso from acessos_paciente where token = p_token for update;
  if not found
     or v_acesso.revogado_em is not null
     or v_acesso.expira_em < now()
     or v_acesso.pin_hash is null then
    raise exception 'Token inválido' using errcode = '28000';
  end if;

  if v_acesso.bloqueado_ate is not null and v_acesso.bloqueado_ate > now() then
    raise exception 'Acesso bloqueado temporariamente' using errcode = '28003';
  end if;

  if v_acesso.pin_hash <> crypt(p_pin, v_acesso.pin_hash) then
    update acessos_paciente
       set tentativas_falhas = tentativas_falhas + 1,
           bloqueado_ate = case
             when tentativas_falhas + 1 >= v_max_tents then now() + v_bloqueio
             else bloqueado_ate
           end
     where id = v_acesso.id;

    perform app_private.registrar_auditoria(
      'paciente:' || v_acesso.paciente_id::text,
      'PIN_FALHA',
      'acessos_paciente',
      v_acesso.id,
      jsonb_build_object('tentativa', v_acesso.tentativas_falhas + 1)
    );

    raise exception 'PIN incorreto' using errcode = '28P01';
  end if;

  update acessos_paciente
     set tentativas_falhas = 0,
         bloqueado_ate     = null
   where id = v_acesso.id;

  insert into sessoes_paciente(paciente_id, acesso_id, expira_em, user_agent)
  values (v_acesso.paciente_id, v_acesso.id, v_expira, p_user_agent)
  returning id into v_session_id;

  perform app_private.registrar_auditoria(
    'paciente:' || v_acesso.paciente_id::text,
    'LOGIN',
    'sessoes_paciente',
    v_session_id,
    jsonb_build_object('user_agent', p_user_agent)
  );

  return query select v_session_id, v_expira;
end;
$$;

-- ---------------------------------------------------------------------
-- obter_paciente_por_sessao(session_id)
-- Retorna dados do paciente logado, validando sessão.
-- ---------------------------------------------------------------------
create or replace function public.obter_paciente_por_sessao(p_session_id uuid)
returns table (
  paciente_id    uuid,
  nome           text,
  procedimento   procedimento_tipo,
  lado           lado_corporal,
  data_cirurgia  date,
  expira_em      timestamptz
)
language plpgsql
security definer
set search_path = public, app_private
as $$
declare
  v_sessao  sessoes_paciente%rowtype;
  v_pac     pacientes%rowtype;
begin
  select * into v_sessao from sessoes_paciente where id = p_session_id;
  if not found
     or v_sessao.revogada_em is not null
     or v_sessao.expira_em < now() then
    raise exception 'Sessão inválida ou expirada' using errcode = '28000';
  end if;

  select * into v_pac from pacientes where id = v_sessao.paciente_id;
  if not found or not v_pac.ativo then
    raise exception 'Paciente não encontrado' using errcode = '42704';
  end if;

  return query
    select v_pac.id, v_pac.nome, v_pac.procedimento, v_pac.lado,
           v_pac.data_cirurgia, v_sessao.expira_em;
end;
$$;

-- ---------------------------------------------------------------------
-- revogar_sessao(session_id)
-- Logout do paciente.
-- ---------------------------------------------------------------------
create or replace function public.revogar_sessao(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public, app_private
as $$
begin
  update sessoes_paciente
     set revogada_em = now()
   where id = p_session_id
     and revogada_em is null;
end;
$$;

-- =====================================================================
-- Permissões: anon pode INVOCAR (mas não ler tabelas diretamente)
-- =====================================================================
grant execute on function public.iniciar_acesso(text)               to anon;
grant execute on function public.definir_pin_e_consentir(text, text, int, text) to anon;
grant execute on function public.validar_pin(text, text, text)      to anon;
grant execute on function public.obter_paciente_por_sessao(uuid)    to anon;
grant execute on function public.revogar_sessao(uuid)               to anon;

-- Helpers privados ficam restritos
revoke all on function app_private.registrar_auditoria(text, text, text, uuid, jsonb) from public;
revoke all on function app_private.pin_valido(text) from public;
revoke all on function app_private.tg_atualizado_em() from public;
