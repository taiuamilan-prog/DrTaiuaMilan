import { getSupabase } from "./supabase";
import type {
  IniciarAcessoResultado,
  PacienteSessao,
  SessaoCriada,
} from "@/types/db";

function userAgent(): string {
  return typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 240) : "";
}

export async function iniciarAcesso(token: string): Promise<IniciarAcessoResultado> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .rpc("iniciar_acesso", { p_token: token })
    .single<IniciarAcessoResultado>();
  if (error) throw error;
  return data;
}

export async function definirPinEConsentir(
  token: string,
  pin: string,
  lgpdVersao: number
): Promise<SessaoCriada> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .rpc("definir_pin_e_consentir", {
      p_token: token,
      p_pin: pin,
      p_lgpd_versao: lgpdVersao,
      p_user_agent: userAgent(),
    })
    .single<SessaoCriada>();
  if (error) throw error;
  return data;
}

export async function validarPin(token: string, pin: string): Promise<SessaoCriada> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .rpc("validar_pin", {
      p_token: token,
      p_pin: pin,
      p_user_agent: userAgent(),
    })
    .single<SessaoCriada>();
  if (error) throw error;
  return data;
}

export async function obterPacientePorSessao(
  sessionId: string
): Promise<PacienteSessao> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .rpc("obter_paciente_por_sessao", { p_session_id: sessionId })
    .single<PacienteSessao>();
  if (error) throw error;
  return data;
}

export async function revogarSessao(sessionId: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.rpc("revogar_sessao", {
    p_session_id: sessionId,
  });
  if (error) throw error;
}
