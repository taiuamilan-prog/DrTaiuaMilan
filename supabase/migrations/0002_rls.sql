-- =====================================================================
-- Fase 1 — RLS (Row Level Security)
-- =====================================================================
-- Estratégia: cliente do paciente NÃO acessa tabelas diretamente.
-- Toda interação ocorre via funções RPC SECURITY DEFINER (0003).
-- Por isso, o role anon recebe DENY por padrão em todas as tabelas.
-- O role service_role (admin/médico) bypassa RLS naturalmente.
-- =====================================================================

alter table pacientes                  enable row level security;
alter table acessos_paciente           enable row level security;
alter table sessoes_paciente           enable row level security;
alter table marcos_trilha              enable row level security;
alter table progresso_paciente         enable row level security;
alter table fotos_ferida               enable row level security;
alter table chat_mensagens             enable row level security;
alter table agendamentos_solicitados   enable row level security;
alter table kb_documentos              enable row level security;
alter table auditoria                  enable row level security;

-- Para garantir bloqueio total ao anon mesmo sem policies:
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;

-- O authenticated role (médico/secretária via Supabase Auth — Fase 7)
-- ganha policies específicas mais tarde. Por ora não recebe nada.
revoke all on all tables in schema public from authenticated;

-- service_role mantém acesso total (não tem RLS aplicado).

-- =====================================================================
-- Permissões para invocar RPCs (concedidas em 0003 por função).
-- =====================================================================
