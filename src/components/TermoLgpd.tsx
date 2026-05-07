import { Alert } from "@/components/ui/Alert";
import { t } from "@/i18n/pt-BR";

interface TermoLgpdProps {
  pacienteNome: string;
}

export function TermoLgpd({ pacienteNome }: TermoLgpdProps) {
  return (
    <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
      <p>
        Olá, <strong>{pacienteNome}</strong>. Para usar o acompanhamento
        pós-operatório do {t.marca.medico}, precisamos do seu consentimento para
        tratar seus dados pessoais e de saúde, conforme a{" "}
        <strong>Lei Geral de Proteção de Dados (Lei 13.709/2018)</strong>.
      </p>

      <div className="rounded-xl border border-navy-900/10 bg-ivory-50/60 p-4 space-y-3">
        <Bloco titulo="Quais dados são tratados">
          Identificação (nome, CPF, contato), dados clínicos do seu
          procedimento, fotos da ferida que você optar por enviar, mensagens
          que você trocar com o assistente, e registros de uso do app.
        </Bloco>
        <Bloco titulo="Para que servem">
          Acompanhar sua recuperação, oferecer orientações educativas curadas
          pelo seu médico, e permitir que a equipe avalie pedidos de retorno
          ou imagens enviadas. Os dados <strong>não</strong> são usados para
          marketing nem compartilhados com terceiros.
        </Bloco>
        <Bloco titulo="Onde ficam">
          Em servidores do Supabase, na região de São Paulo, com criptografia
          em trânsito (HTTPS) e em repouso. O acesso é restrito ao Dr. Taiuã
          Milan e à equipe autorizada.
        </Bloco>
        <Bloco titulo="Seus direitos">
          Você pode, a qualquer momento, solicitar acesso, correção ou
          exclusão dos seus dados, entrando em contato com a equipe pelo
          mesmo número de WhatsApp pelo qual recebeu o link.
        </Bloco>
      </div>

      <Alert tone="info">
        Conteúdo educativo. Não substitui avaliação médica presencial. Em
        emergência, ligue 192 (SAMU) ou procure o pronto-socorro.
      </Alert>
    </div>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-medium text-navy-900 mb-1">{titulo}</p>
      <p>{children}</p>
    </div>
  );
}
