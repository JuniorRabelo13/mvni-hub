import { useEffect, useMemo, useState } from "react";
import { Copy, Check, Loader2, QrCode } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { criarPixParaFatura, type PixCharge } from "@/services/mvno/pagamentosService";
import { usePagamento } from "@/hooks/mvno/usePagamentos";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  faturaId: string;
  competencia?: string;
  numeroLinha?: string;
};

function fmtBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function PixCheckoutDialog({ open, onOpenChange, faturaId, competencia, numeroLinha }: Props) {
  const qc = useQueryClient();
  const [charge, setCharge] = useState<PixCharge | null>(null);
  const [copied, setCopied] = useState(false);
  const [remaining, setRemaining] = useState<number>(0);

  const create = useMutation({
    mutationFn: () => criarPixParaFatura(faturaId),
    onSuccess: (d) => setCharge(d),
    onError: (e: any) => toast.error(e?.message ?? "Falha ao gerar PIX"),
  });

  const polling = usePagamento(charge?.pagamento_id, open && !!charge);

  // Auto-cria ao abrir
  useEffect(() => {
    if (open && !charge && !create.isPending) create.mutate();
    if (!open) {
      setCharge(null);
      setCopied(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Countdown
  useEffect(() => {
    if (!charge?.expires_at) return;
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(charge.expires_at!).getTime() - Date.now()) / 1000));
      setRemaining(diff);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [charge?.expires_at]);

  // Confirmação
  useEffect(() => {
    if (polling.data?.status === "confirmado") {
      toast.success("Pagamento confirmado!");
      qc.invalidateQueries({ queryKey: ["mvno", "minhas-faturas"] });
      qc.invalidateQueries({ queryKey: ["mvno", "meus-pagamentos"] });
      setTimeout(() => onOpenChange(false), 1500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [polling.data?.status]);

  const mm = Math.floor(remaining / 60).toString().padStart(2, "0");
  const ss = (remaining % 60).toString().padStart(2, "0");

  const confirmado = polling.data?.status === "confirmado";
  const qrSrc = useMemo(() => {
    const raw = charge?.pix_qr_code_base64;
    if (!raw) return null;
    if (raw.startsWith("http") || raw.startsWith("data:")) return raw;
    return `data:image/png;base64,${raw}`;
  }, [charge?.pix_qr_code_base64]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pagar com PIX</DialogTitle>
          <DialogDescription>
            {competencia ? `Competência ${new Date(competencia).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}` : "Fatura MVNO"}
            {numeroLinha ? ` · Linha ${numeroLinha}` : ""}
          </DialogDescription>
        </DialogHeader>

        {create.isPending && !charge && (
          <div className="flex flex-col items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            Gerando cobrança PIX...
          </div>
        )}

        {charge && !confirmado && (
          <div className="space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Valor</span>
              <span className="text-lg font-semibold">{fmtBRL(Number(charge.valor))}</span>
            </div>

            <div className="flex justify-center rounded-lg border border-border/60 bg-white p-4">
              {qrSrc ? (
                <img src={qrSrc} alt="QR Code PIX" className="h-56 w-56" />
              ) : (
                <div className="flex h-56 w-56 items-center justify-center text-muted-foreground">
                  <QrCode className="h-16 w-16" />
                </div>
              )}
            </div>

            {charge.pix_copia_e_cola && (
              <div className="space-y-2">
                <label className="text-xs uppercase text-muted-foreground">PIX Copia e Cola</label>
                <div className="rounded-md border border-border/60 bg-muted/30 p-2 text-xs break-all font-mono max-h-24 overflow-auto">
                  {charge.pix_copia_e_cola}
                </div>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={async () => {
                    await navigator.clipboard.writeText(charge.pix_copia_e_cola!);
                    setCopied(true);
                    toast.success("Código copiado");
                    setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                  {copied ? "Copiado" : "Copiar código"}
                </Button>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Aguardando confirmação...</span>
              {remaining > 0 && <span>Expira em {mm}:{ss}</span>}
            </div>
          </div>
        )}

        {confirmado && (
          <div className="flex flex-col items-center gap-2 py-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
              <Check className="h-8 w-8" />
            </div>
            <p className="text-lg font-semibold">Pagamento confirmado</p>
            <p className="text-xs text-muted-foreground">Sua fatura foi baixada.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
