export type Procedimento = "ATQ_POSTERIOR" | "ATQ_ANTERIOR" | "ARTROSCOPIA";
export type LadoCorporal = "DIREITO" | "ESQUERDO" | "BILATERAL";

export const procedimentoLabel: Record<Procedimento, string> = {
  ATQ_POSTERIOR: "Artroplastia total do quadril — via posterior",
  ATQ_ANTERIOR: "Artroplastia total do quadril — via anterior",
  ARTROSCOPIA: "Artroscopia de quadril",
};

export const ladoLabel: Record<LadoCorporal, string> = {
  DIREITO: "lado direito",
  ESQUERDO: "lado esquerdo",
  BILATERAL: "bilateral",
};

export type EstadoAcesso = "ONBOARDING" | "PIN" | "BLOQUEADO" | "INVALIDO";

export interface IniciarAcessoResultado {
  estado: EstadoAcesso;
  primeiro_acesso: boolean | null;
  paciente_nome: string | null;
  procedimento: Procedimento | null;
  data_cirurgia: string | null;
  bloqueado_ate: string | null;
}

export interface SessaoCriada {
  session_id: string;
  expira_em: string;
}

export interface PacienteSessao {
  paciente_id: string;
  nome: string;
  procedimento: Procedimento;
  lado: LadoCorporal;
  data_cirurgia: string;
  expira_em: string;
}
