import type { ReactNode } from "react";
import { t } from "@/i18n/pt-BR";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-dvh flex flex-col bg-ivory-50">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="border-b border-navy-900/5 bg-ivory-50/80 backdrop-blur supports-[backdrop-filter]:bg-ivory-50/60 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <Wordmark />
        <span className="hidden sm:inline text-xs uppercase tracking-[0.18em] text-slate-700/70">
          {t.marca.especialidade}
        </span>
      </div>
    </header>
  );
}

function Wordmark() {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden
        className="h-8 w-8 rounded-full border border-gold-500/60 grid place-items-center"
      >
        <span className="h-2 w-2 rounded-full bg-teal-500" />
      </span>
      <span className="font-serif text-navy-900 text-lg tracking-tightish">
        Dr. Taiuã Milan
      </span>
    </div>
  );
}

function Footer() {
  const ano = new Date().getFullYear();
  return (
    <footer className="border-t border-navy-900/5 mt-24">
      <div className="max-w-6xl mx-auto px-6 lg:px-10 py-8 text-xs text-slate-700/70 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <p>
          © {ano} {t.marca.medico}. {t.rodape.direitos}
        </p>
        <p className="tabular">
          {t.marca.crm} · {t.marca.rqe} · {t.marca.teot}
        </p>
      </div>
      <div className="bg-navy-900/[0.02] border-t border-navy-900/5">
        <p className="max-w-6xl mx-auto px-6 lg:px-10 py-4 text-[11px] leading-relaxed text-slate-700/70">
          Conteúdo educativo. Não substitui avaliação médica presencial.{" "}
          {t.marca.crm} — {t.marca.rqe}.
        </p>
      </div>
    </footer>
  );
}
