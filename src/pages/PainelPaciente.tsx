import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { CalendarDays, ImagePlus, MapPin, MessagesSquare, LogOut } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { obterPacientePorSessao, revogarSessao } from "@/lib/auth";
import { lerSessao, limparSessao } from "@/lib/sessao";
import { backendConfigurado } from "@/lib/env";
import { ladoLabel, procedimentoLabel, type PacienteSessao } from "@/types/db";

export function PainelPaciente() {
  const { token = "" } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const sessao = lerSessao();
  const [paciente, setPaciente] = useState<PacienteSessao | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!sessao) return;
    if (!backendConfigurado()) return;
    let cancelado = false;
    obterPacientePorSessao(sessao.sessionId)
      .then((p) => {
        if (!cancelado) setPaciente(p);
      })
      .catch(() => {
        if (!cancelado) {
          setErro("Sua sessão expirou. Entre novamente com seu PIN.");
          limparSessao();
          setTimeout(() => navigate(`/p/${token}`, { replace: true }), 1500);
        }
      });
    return () => {
      cancelado = true;
    };
  }, [sessao, token, navigate]);

  if (!sessao) return <Navigate to={`/p/${token}`} replace />;
  if (erro) {
    return (
      <section className="max-w-lg mx-auto px-6 py-12">
        <Alert tone="attention">{erro}</Alert>
      </section>
    );
  }
  if (!paciente) return null;

  const diasPosOp = calcDiasPosOp(paciente.data_cirurgia);
  const primeiroNome = paciente.nome.split(" ")[0];

  async function sair() {
    if (sessao) {
      try {
        await revogarSessao(sessao.sessionId);
      } catch {
        /* ignora — local fica limpo de qualquer forma */
      }
    }
    limparSessao();
    navigate(`/p/${token}`, { replace: true });
  }

  return (
    <section className="max-w-3xl mx-auto px-6 lg:px-10 py-10 lg:py-14">
      <header className="flex items-start justify-between gap-4 mb-10">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-teal-700 mb-2">
            Acompanhamento pós-operatório
          </p>
          <h1 className="font-serif text-navy-900 text-3xl sm:text-4xl tracking-tightish">
            Olá, {primeiroNome}.
          </h1>
          <p className="mt-2 text-sm text-slate-700/85">
            {procedimentoLabel[paciente.procedimento]} ({ladoLabel[paciente.lado]})
            <span aria-hidden> · </span>
            <span className="tabular">
              {diasPosOp >= 0 ? `D+${diasPosOp}` : `${Math.abs(diasPosOp)} dia(s) para a cirurgia`}
            </span>
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={sair} aria-label="Sair">
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </header>

      <Alert tone="info" title="Sua trilha está sendo preparada">
        Em breve você verá aqui os marcos da sua recuperação, com vídeos,
        exercícios e orientações específicas. Esta é a Fase 1 do
        desenvolvimento — o conteúdo completo chega na próxima etapa.
      </Alert>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <ItemMenu
          icone={CalendarDays}
          titulo="Trilha de recuperação"
          descricao="Marcos de D+1 a D+90, com vídeos e exercícios."
          status="Em breve"
        />
        <ItemMenu
          icone={ImagePlus}
          titulo="Cuidados com a ferida"
          descricao="Galeria educativa e envio seguro de fotos."
          status="Em breve"
        />
        <ItemMenu
          icone={MessagesSquare}
          titulo="Tirar uma dúvida"
          descricao="Assistente baseado nos protocolos do Dr. Taiuã."
          status="Em breve"
        />
        <ItemMenu
          icone={MapPin}
          titulo="Solicitar retorno"
          descricao="Agendamento nas unidades parceiras."
          status="Em breve"
        />
      </div>
    </section>
  );
}

function ItemMenu({
  icone: Icone,
  titulo,
  descricao,
  status,
}: {
  icone: typeof CalendarDays;
  titulo: string;
  descricao: string;
  status?: string;
}) {
  return (
    <Card className="h-full">
      <div className="flex items-start justify-between gap-3">
        <span className="inline-grid h-11 w-11 place-items-center rounded-xl bg-teal-500/10 text-teal-700 mb-4">
          <Icone className="h-5 w-5" />
        </span>
        {status && (
          <span className="text-[10px] uppercase tracking-[0.15em] text-gold-700 bg-gold-50 px-2 py-1 rounded-full">
            {status}
          </span>
        )}
      </div>
      <CardTitle>{titulo}</CardTitle>
      <CardDescription>{descricao}</CardDescription>
    </Card>
  );
}

function calcDiasPosOp(dataCirurgiaIso: string): number {
  const cirurgia = new Date(dataCirurgiaIso + "T00:00:00");
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const diff = hoje.getTime() - cirurgia.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}
