import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, AlertTriangle, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Página de sucesso — dupla função:
 *  1. Sucesso do cadastro (fluxo antigo, sem session_id).
 *  2. Sucesso do checkout Stripe (?session_id=...): faz polling em usuarios.cadastro_pago_em
 *     até o webhook gravar o pagamento e libera o painel automaticamente.
 */
const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 45_000;

const CadastroSucesso = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const isPaymentReturn = Boolean(sessionId);

  const [status, setStatus] = useState<"confirming" | "confirmed" | "timeout" | "not_logged">(
    isPaymentReturn ? "confirming" : "confirmed",
  );

  useEffect(() => {
    if (!isPaymentReturn) return;
    let cancelled = false;
    let elapsed = 0;

    const tick = async () => {
      if (cancelled) return;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setStatus("not_logged");
          return;
        }
        const { data } = await (supabase as any)
          .from("usuarios")
          .select("cadastro_pago_em")
          .eq("id", user.id)
          .maybeSingle();

        if (data?.cadastro_pago_em) {
          setStatus("confirmed");
          setTimeout(() => navigate("/painel", { replace: true }), 1800);
          return;
        }
      } catch (err) {
        console.error("[CadastroSucesso] poll error:", err);
      }
      elapsed += POLL_INTERVAL_MS;
      if (elapsed >= POLL_TIMEOUT_MS) {
        setStatus("timeout");
        return;
      }
      setTimeout(tick, POLL_INTERVAL_MS);
    };

    tick();
    return () => {
      cancelled = true;
    };
  }, [isPaymentReturn, navigate]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-lg">
              <span className="text-primary-foreground font-bold text-xl">M</span>
            </div>
            <span className="text-2xl font-bold tracking-tight">MVNI</span>
          </div>
        </div>

        <div className="bg-card/50 backdrop-blur-sm p-10 rounded-xl border border-white/10 shadow-xl space-y-6 flex flex-col items-center">
          {status === "confirming" && (
            <>
              <div className="bg-primary/10 p-4 rounded-full border border-primary/20">
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Confirmando seu pagamento…
                </h1>
                <p className="text-sm text-muted-foreground">
                  Aguarde alguns segundos enquanto a Stripe confirma sua transação e liberamos seu acesso completo ao MVNI Hub.
                </p>
              </div>
            </>
          )}

          {status === "confirmed" && (
            <>
              <div className="bg-emerald-500/10 p-4 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-16 h-16 text-emerald-500" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-white">
                  {isPaymentReturn ? "Cadastro ativado!" : "Conta criada com sucesso!"}
                </h1>
                <p className="text-muted-foreground">
                  {isPaymentReturn
                    ? "Seu acesso completo ao MVNI Hub está liberado. Redirecionando para o painel…"
                    : "Seu cadastro foi realizado. Acesse o sistema com seu e-mail e senha para começar."}
                </p>
              </div>
              <Button
                className="w-full h-12 text-base font-semibold mt-4"
                onClick={() => navigate(isPaymentReturn ? "/painel" : "/auth")}
              >
                {isPaymentReturn ? "Ir para o painel" : "Acessar minha conta"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}

          {status === "timeout" && (
            <>
              <div className="bg-amber-500/10 p-4 rounded-full border border-amber-500/20">
                <AlertTriangle className="w-16 h-16 text-amber-500" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Pagamento em processamento
                </h1>
                <p className="text-sm text-muted-foreground">
                  A Stripe está processando sua transação. Assim que confirmarmos, seu cadastro será liberado automaticamente. Você já pode acessar o painel — o status será atualizado em segundos.
                </p>
              </div>
              <Button
                className="w-full h-12 text-base font-semibold mt-4"
                onClick={() => navigate("/painel")}
              >
                Ir para o painel <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}

          {status === "not_logged" && (
            <>
              <div className="bg-primary/10 p-4 rounded-full border border-primary/20">
                <CheckCircle2 className="w-16 h-16 text-primary" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Pagamento recebido!
                </h1>
                <p className="text-sm text-muted-foreground">
                  Faça login com seu e-mail e senha para acessar o painel liberado.
                </p>
              </div>
              <Button
                className="w-full h-12 text-base font-semibold mt-4"
                onClick={() => navigate("/auth")}
              >
                Acessar minha conta <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {isPaymentReturn && (
          <p className="text-[11px] text-muted-foreground">
            Ref. sessão: <span className="font-mono">{sessionId?.slice(0, 24)}…</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default CadastroSucesso;
