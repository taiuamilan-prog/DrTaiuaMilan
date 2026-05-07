interface EnvConfig {
  supabaseUrl: string | null;
  supabaseAnonKey: string | null;
  lgpdVersao: number;
}

export const env: EnvConfig = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || null,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || null,
  lgpdVersao: Number(import.meta.env.VITE_LGPD_VERSAO ?? 1),
};

export function backendConfigurado(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}
