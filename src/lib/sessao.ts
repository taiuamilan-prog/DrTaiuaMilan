const STORAGE_KEY = "drtaiua.sessao.v1";

interface SessaoLocal {
  sessionId: string;
  expiraEm: string;
  pacienteNome?: string;
}

export function salvarSessao(sessao: SessaoLocal): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessao));
  } catch {
    /* navegação privada — silencioso */
  }
}

export function lerSessao(): SessaoLocal | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessaoLocal;
    if (!parsed.sessionId) return null;
    if (new Date(parsed.expiraEm) < new Date()) {
      limparSessao();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function limparSessao(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* silencioso */
  }
}
