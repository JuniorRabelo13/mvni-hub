import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import type { MvnoPagamento } from "@/hooks/mvno/usePagamentos";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pagamento: MvnoPagamento;
  faturaCompetencia?: string;
  numeroLinha?: string;
};

function fmtBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtDT(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR");
}

export function ReciboPix({ open, onOpenChange, pagamento, faturaCompetencia, numeroLinha }: Props) {
  const handlePrint = () => {
    const el = document.getElementById("recibo-pix-print");
    if (!el) return window.print();
    const w = window.open("", "_blank", "width=600,height=800");
    if (!w) return;
    w.document.write(`<html><head><title>Recibo PIX</title>
      <style>body{font-family:system-ui,sans-serif;padding:24px;color:#111}h1{font-size:18px;margin:0 0 12px}dl{display:grid;grid-template-columns:140px 1fr;gap:8px 12px;font-size:14px}dt{color:#666}dd{margin:0;font-weight:600}</style>
      </head><body>${el.innerHTML}</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Recibo PIX</DialogTitle>
        </DialogHeader>
        <div id="recibo-pix-print" className="rounded-md border border-border/60 p-4 text-sm">
          <h1 className="text-base font-semibold mb-3">Comprovante de pagamento</h1>
          <dl className="grid grid-cols-[140px_1fr] gap-y-2 gap-x-3">
            <dt className="text-muted-foreground">Competência</dt>
            <dd>{faturaCompetencia ? new Date(faturaCompetencia).toLocaleDateString("pt-BR", { month: "long", year: "numeric" }) : "—"}</dd>
            <dt className="text-muted-foreground">Linha</dt>
            <dd>{numeroLinha ?? "—"}</dd>
            <dt className="text-muted-foreground">Valor</dt>
            <dd>{fmtBRL(Number(pagamento.valor))}</dd>
            <dt className="text-muted-foreground">Pago em</dt>
            <dd>{fmtDT(pagamento.paid_at)}</dd>
            <dt className="text-muted-foreground">Método</dt>
            <dd>PIX</dd>
            <dt className="text-muted-foreground">Transação</dt>
            <dd className="font-mono text-xs break-all">{pagamento.provider_intent_id ?? pagamento.id}</dd>
            <dt className="text-muted-foreground">Status</dt>
            <dd className="capitalize">{pagamento.status}</dd>
          </dl>
        </div>
        <Button onClick={handlePrint} variant="secondary" className="w-full">
          <Printer className="mr-2 h-4 w-4" /> Imprimir / Salvar PDF
        </Button>
      </DialogContent>
    </Dialog>
  );
}
