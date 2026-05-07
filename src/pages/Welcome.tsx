import { ArrowRight, Compass, HeartPulse, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { t } from "@/i18n/pt-BR";

const pilarIcons = [Compass, HeartPulse, ShieldCheck];

export function Welcome() {
  return (
    <>
      <Hero />
      <Pilares />
      <Encerramento />
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-ivory-50 via-ivory-50 to-white"
      />
      <div
        aria-hidden
        className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-teal-500/[0.06] blur-3xl -z-10"
      />
      <div
        aria-hidden
        className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-gold-500/[0.08] blur-3xl -z-10"
      />

      <div className="max-w-6xl mx-auto px-6 lg:px-10 pt-20 pb-16 lg:pt-28 lg:pb-24">
        <p className="text-xs uppercase tracking-[0.22em] text-teal-700 mb-6">
          {t.boasVindas.sobreTitulo}
        </p>

        <h1 className="font-serif text-navy-900 text-[2.5rem] sm:text-5xl lg:text-6xl leading-[1.05] tracking-tightish max-w-3xl">
          {t.boasVindas.titulo}
        </h1>

        <p className="mt-6 text-lg text-slate-700/85 leading-relaxed max-w-2xl">
          {t.boasVindas.subtitulo}
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Button variant="primary" size="lg">
            {t.boasVindas.chamadaPrimaria}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
          <Button variant="ghost" size="lg">
            {t.boasVindas.chamadaSecundaria}
          </Button>
        </div>

        <ConceitoSelo />
      </div>
    </section>
  );
}

function ConceitoSelo() {
  return (
    <div className="mt-14 inline-flex items-center gap-3 rounded-full border border-gold-500/30 bg-white/60 px-4 py-2 backdrop-blur">
      <span className="h-1.5 w-1.5 rounded-full bg-gold-500" />
      <span className="text-xs uppercase tracking-[0.2em] text-navy-900/80">
        {t.marca.conceito}
      </span>
      <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
    </div>
  );
}

function Pilares() {
  return (
    <section className="max-w-6xl mx-auto px-6 lg:px-10 py-12 lg:py-20">
      <div className="grid gap-6 md:grid-cols-3">
        {t.boasVindas.pilares.map((pilar, i) => {
          const Icon = pilarIcons[i] ?? Compass;
          return (
            <Card key={pilar.titulo} className="h-full">
              <span
                aria-hidden
                className="inline-grid h-11 w-11 place-items-center rounded-xl bg-teal-500/10 text-teal-700 mb-5"
              >
                <Icon className="h-5 w-5" />
              </span>
              <CardTitle>{pilar.titulo}</CardTitle>
              <CardDescription>{pilar.descricao}</CardDescription>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function Encerramento() {
  return (
    <section className="max-w-6xl mx-auto px-6 lg:px-10 pb-16">
      <Alert tone="info" title="Como você acessa este acompanhamento">
        Após a sua alta hospitalar, nossa equipe envia por WhatsApp um link
        pessoal de acesso. Esse link é único e protegido por um PIN definido por
        você no primeiro uso. {t.boasVindas.avisoLegal}
      </Alert>
    </section>
  );
}
