import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, ArrowRight, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { PinPad } from "@/components/PinPad";
import { TermoLgpd } from "@/components/TermoLgpd";
import { cn } from "@/lib/cn";
import { backendConfigurado, env } from "@/lib/env";
import {
  iniciarAcesso,
  definirPinEConsentir,
  validarPin,
} from "@/lib/auth";
import { salvarSessao } from "@/lib/sessao";
import type { IniciarAcessoResultado } from "@/types/db";
import { procedimentoLabel } from "@/types/db";

type Fase = "carregando" | "indisponivel" | "invalido" | "bloqueado" | "onboarding" | "pin";

export function AcessoPaciente() {
  const { token = "" } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [fase, setFase] = useState<Fase>("carregando");
  const [info, setInfo] = useState<IniciarAcessoResultado | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!backendConfigurado()) {
      setFase("indisponivel");
      return;
    }
    let cancelado = false;
    (async () => {
      try {
        const r = await iniciarAcesso(token);
        if (cancelado) return;
        setInfo(r);
        if (r.estado === "ONBOARDING") setFase("onboarding");
        else if (r.estado === "PIN") setFase("pin");
        else if (r.estado === "BLOQUEADO") setFase("bloqueado");
        else setFase("invalido");
      } catch {
        if (!cancelado) setFase("invalido");
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [token]);

  function aoLogar(sessionId: string, expiraEm: string) {
    salvarSessao({
      sessionId,
      expiraEm,
      pacienteNome: info?.paciente_nome ?? undefined,
    });
    navigate(`/p/${token}/painel`, { replace: true });
  }

  if (fase === "carregando") return <Centralizado><Loader2 className="h-6 w-6 animate-spin text-teal-700" /></Centralizado>;
  if (fase === "indisponivel") return <Indisponivel />;
  if (fase === "invalido") return <LinkInvalido />;
  if (fase === "bloqueado") return <Bloqueado bloqueadoAte={info?.bloqueado_ate ?? null} />;

  if (fase === "onboarding" && info?.paciente_nome && info.procedimento) {
    return (
      <Onboarding
        pacienteNome={info.paciente_nome}
        procedimento={info.procedimento}
        erro={erro}
        onConfirmar={async (pin) => {
          setErro(null);
          try {
            const s = await definirPinEConsentir(token, pin, env.lgpdVersao);
            aoLogar(s.session_id, s.expira_em);
          } catch (e) {
            setErro(traduzirErro(e));
          }
        }}
      />
    );
  }

  if (fase === "pin" && info?.paciente_nome) {
    return (
      <EntradaPin
        pacienteNome={info.paciente_nome}
        erro={erro}
        onConfirmar={async (pin) => {
          setErro(null);
          try {
            const s = await validarPin(token, pin);
            aoLogar(s.session_id, s.expira_em);
          } catch (e) {
            setErro(traduzirErro(e));
          }
        }}
      />
    );
  }

  return null;
}

function Onboarding(props: {
  pacienteNome: string;
  procedimento: keyof typeof procedimentoLabel;
  erro: string | null;
  onConfirmar: (pin: string) => Promise<void>;
}) {
  const [pin, setPin] = useState("");
  const [confirma, setConfirma] = useState("");
  const [aceitou, setAceitou] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroLocal, setErroLocal] = useState<string | null>(null);

  const podeEnviar =
    pin.length >= 4 && confirma === pin && aceitou && !enviando;

  async function enviar() {
    setErroLocal(null);
    if (pin !== confirma) {
      setErroLocal("Os PINs informados não coincidem.");
      return;
    }
    setEnviando(true);
    await props.onConfirmar(pin);
    setEnviando(false);
  }

  return (
    <Container>
      <Cabecalho
        sub="Bem-vindo(a) ao seu acompanhamento"
        titulo={`Olá, ${props.pacienteNome.split(" ")[0]}.`}
        descricao={`Você passou por ${procedimentoLabel[props.procedimento]}. Vamos preparar seu acesso seguro em duas etapas rápidas.`}
      />

      <Card className="mt-8 space-y-8">
        <Etapa numero={1} titulo="Termo de consentimento (LGPD)">
          <TermoLgpd pacienteNome={props.pacienteNome} />
          <label className="mt-4 flex items-start gap-3 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={aceitou}
              onChange={(e) => setAceitou(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-navy-900/30 text-teal-500 focus-ring"
            />
            <span>
              Li e concordo com os termos acima e autorizo o tratamento dos
              meus dados conforme descrito.
            </span>
          </label>
        </Etapa>

        <Etapa numero={2} titulo="Defina um PIN de 4 dígitos">
          <p className="text-sm text-slate-700/85 mb-4">
            Esse PIN será pedido sempre que você abrir o app neste celular.
            Escolha algo memorável, mas evite datas de aniversário óbvias.
          </p>
          <div className="space-y-6">
            <PinPad
              rotulo="Novo PIN"
              onMudanca={setPin}
              autoFoco={false}
              comprimento={4}
            />
            <PinPad
              rotulo="Confirme o PIN"
              onMudanca={setConfirma}
              autoFoco={false}
              comprimento={4}
            />
          </div>
          {(erroLocal || props.erro) && (
            <p role="alert" className="mt-4 text-sm text-alert-red text-center">
              {erroLocal || props.erro}
            </p>
          )}
        </Etapa>

        <div className="flex justify-end pt-2">
          <Button
            variant="primary"
            size="lg"
            disabled={!podeEnviar}
            onClick={enviar}
          >
            {enviando ? "Confirmando..." : "Confirmar e entrar"}
            {!enviando && <ArrowRight className="h-4 w-4" aria-hidden />}
          </Button>
        </div>
      </Card>
    </Container>
  );
}

function EntradaPin(props: {
  pacienteNome: string;
  erro: string | null;
  onConfirmar: (pin: string) => Promise<void>;
}) {
  const [enviando, setEnviando] = useState(false);

  return (
    <Container compacto>
      <Cabecalho
        sub="Acesso seguro"
        titulo={`Bem-vindo(a) de volta, ${props.pacienteNome.split(" ")[0]}.`}
        descricao="Digite seu PIN para continuar."
      />
      <Card className="mt-8">
        <PinPad
          comprimento={4}
          onCompleto={async (pin) => {
            setEnviando(true);
            await props.onConfirmar(pin);
            setEnviando(false);
          }}
          desabilitado={enviando}
          erro={props.erro}
        />
        <p className="mt-6 text-xs text-center text-slate-700/70">
          Esqueceu o PIN? Solicite um novo link à secretaria pelo WhatsApp.
        </p>
      </Card>
    </Container>
  );
}

function LinkInvalido() {
  return (
    <Container compacto>
      <Card>
        <div className="flex flex-col items-center text-center gap-4">
          <span className="h-12 w-12 grid place-items-center rounded-full bg-alert-red/10 text-alert-red">
            <ShieldOff className="h-6 w-6" />
          </span>
          <h2 className="font-serif text-2xl text-navy-900">Link inválido ou expirado</h2>
          <p className="text-sm text-slate-700/85 max-w-sm">
            O link que você abriu não está mais ativo. Por favor, entre em
            contato com a secretaria pelo WhatsApp para receber um novo
            acesso.
          </p>
        </div>
      </Card>
    </Container>
  );
}

function Bloqueado({ bloqueadoAte }: { bloqueadoAte: string | null }) {
  const ate = bloqueadoAte ? new Date(bloqueadoAte) : null;
  return (
    <Container compacto>
      <Card>
        <div className="flex flex-col items-center text-center gap-4">
          <span className="h-12 w-12 grid place-items-center rounded-full bg-gold-500/15 text-gold-700">
            <ShieldOff className="h-6 w-6" />
          </span>
          <h2 className="font-serif text-2xl text-navy-900">Acesso temporariamente bloqueado</h2>
          <p className="text-sm text-slate-700/85 max-w-sm">
            Por segurança, bloqueamos seu acesso após várias tentativas
            seguidas com PIN incorreto.
            {ate && (
              <>
                {" "}Tente novamente após{" "}
                <span className="tabular font-medium">
                  {ate.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                .
              </>
            )}
          </p>
        </div>
      </Card>
    </Container>
  );
}

function Indisponivel() {
  return (
    <Container compacto>
      <Alert tone="attention" title="Acesso ainda não configurado">
        O backend deste app está em configuração. Quando o cadastro for
        concluído pela equipe, você poderá usar este link normalmente. Em
        caso de dúvida, entre em contato pelo WhatsApp.
      </Alert>
    </Container>
  );
}

function Container({
  children,
  compacto,
}: {
  children: React.ReactNode;
  compacto?: boolean;
}) {
  return (
    <section
      className={cn(
        "mx-auto px-6 lg:px-10 py-12 lg:py-16",
        compacto ? "max-w-lg" : "max-w-2xl"
      )}
    >
      {children}
    </section>
  );
}

function Centralizado({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[60vh] grid place-items-center">{children}</div>
  );
}

function Cabecalho({
  sub,
  titulo,
  descricao,
}: {
  sub: string;
  titulo: string;
  descricao: string;
}) {
  return (
    <header>
      <p className="text-xs uppercase tracking-[0.22em] text-teal-700 mb-3">
        {sub}
      </p>
      <h1 className="font-serif text-navy-900 text-3xl sm:text-4xl tracking-tightish">
        {titulo}
      </h1>
      <p className="mt-3 text-base text-slate-700/85 leading-relaxed max-w-xl">
        {descricao}
      </p>
    </header>
  );
}

function Etapa({
  numero,
  titulo,
  children,
}: {
  numero: number;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-baseline gap-3 mb-4">
        <span className="font-serif text-gold-500 text-2xl tabular">
          {String(numero).padStart(2, "0")}
        </span>
        <h2 className="font-serif text-navy-900 text-xl">{titulo}</h2>
      </div>
      {children}
    </section>
  );
}

function traduzirErro(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (/PIN inválido/i.test(msg)) return "PIN inválido. Use 4 dígitos numéricos.";
  if (/PIN incorreto/i.test(msg)) return "PIN incorreto.";
  if (/Token inválido/i.test(msg)) return "Link inválido. Solicite um novo à secretaria.";
  if (/bloqueado/i.test(msg)) return "Acesso temporariamente bloqueado.";
  if (/Sessão inválida/i.test(msg)) return "Sua sessão expirou. Entre novamente.";
  return "Não foi possível concluir. Tente novamente em instantes.";
}
