import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";

interface PinPadProps {
  comprimento?: number;
  onCompleto?: (pin: string) => void;
  onMudanca?: (pin: string) => void;
  autoFoco?: boolean;
  desabilitado?: boolean;
  rotulo?: string;
  erro?: string | null;
}

export function PinPad({
  comprimento = 4,
  onCompleto,
  onMudanca,
  autoFoco = true,
  desabilitado = false,
  rotulo = "Digite seu PIN",
  erro = null,
}: PinPadProps) {
  const [valores, setValores] = useState<string[]>(() =>
    Array(comprimento).fill("")
  );
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (autoFoco) refs.current[0]?.focus();
  }, [autoFoco]);

  function atualizar(index: number, char: string) {
    const apenasDigito = char.replace(/\D/g, "").slice(-1);
    const novos = [...valores];
    novos[index] = apenasDigito;
    setValores(novos);
    onMudanca?.(novos.join(""));
    if (apenasDigito && index < comprimento - 1) {
      refs.current[index + 1]?.focus();
    }
    if (novos.every((v) => v !== "")) {
      onCompleto?.(novos.join(""));
    }
  }

  function aoTeclar(e: KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key === "Backspace") {
      if (valores[index]) {
        const novos = [...valores];
        novos[index] = "";
        setValores(novos);
        onMudanca?.(novos.join(""));
      } else if (index > 0) {
        refs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < comprimento - 1) {
      refs.current[index + 1]?.focus();
    }
  }

  function aoColar(e: React.ClipboardEvent<HTMLInputElement>) {
    const colado = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!colado) return;
    e.preventDefault();
    const recortado = colado.slice(0, comprimento).split("");
    const novos = Array(comprimento).fill("") as string[];
    recortado.forEach((c, i) => (novos[i] = c));
    setValores(novos);
    onMudanca?.(novos.join(""));
    refs.current[Math.min(recortado.length, comprimento - 1)]?.focus();
    if (recortado.length === comprimento) onCompleto?.(novos.join(""));
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-navy-900">{rotulo}</p>
      <div
        className="flex gap-3 justify-center"
        role="group"
        aria-label={rotulo}
      >
        {valores.map((v, i) => (
          <input
            key={i}
            ref={(el) => (refs.current[i] = el)}
            value={v}
            onChange={(e) => atualizar(i, e.target.value)}
            onKeyDown={(e) => aoTeclar(e, i)}
            onPaste={aoColar}
            type="tel"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            disabled={desabilitado}
            aria-invalid={Boolean(erro)}
            className={cn(
              "h-14 w-12 sm:w-14 text-center text-2xl font-medium tabular",
              "rounded-xl border bg-white text-navy-900",
              "border-navy-900/15 focus-ring focus-visible:border-teal-500",
              "transition-all",
              erro && "border-alert-red/50 bg-red-50/50"
            )}
          />
        ))}
      </div>
      {erro && (
        <p
          role="alert"
          className="text-sm text-alert-red text-center"
        >
          {erro}
        </p>
      )}
    </div>
  );
}
