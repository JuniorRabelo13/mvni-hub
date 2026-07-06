import { useState } from "react";
import { Link } from "react-router-dom";
import { Receipt, Download, Eye } from "lucide-react";
import { useMinhasFaturas } from "@/hooks/mvno/useMinhasFaturas";
import { useMinhasLinhas } from "@/hooks/mvno/useMinhasLinhas";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/mvno/EmptyState";
import { StatusFaturaBadge } from "@/components/mvno/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SEO } from "@/components/SEO";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

function fmtBRL(n: number) { return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("pt-BR"); } catch { return "—"; }
}

export default function MinhasFaturas() {
  const [linhaFiltro, setLinhaFiltro] = useState<string>("todas");
  const { data: linhas } = useMinhasLinhas();
  const { data, isLoading } = useMinhasFaturas(linhaFiltro === "todas" ? undefined : linhaFiltro);

  const downloadPdf = async (path: string | null) => {
    if (!path) { toast.info("PDF ainda não disponível para esta fatura."); return; }
    try {
      const { data, error } = await supabase.storage
        .from("mvno-faturas-cliente")
        .createSignedUrl(path, 300);
      if (error) throw error;
      window.open(data.signedUrl, "_blank");
    } catch (e: any) {
      toast.error("Não foi possível gerar o link do PDF.");
    }
  };

  return (
    <div className="space-y-6">
      <SEO title="Minhas Faturas — MVNI" description="Faturas mensais das suas linhas." path="/cliente/faturas" />
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Minhas Faturas</h1>
          <p className="text-sm text-muted-foreground">Histórico de faturas por competência.</p>
        </div>
        {(linhas ?? []).length > 1 && (
          <Select value={linhaFiltro} onValueChange={setLinhaFiltro}>
            <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as linhas</SelectItem>
              {(linhas ?? []).map((l) => (
                <SelectItem key={l.id} value={l.id}>{l.numero}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </header>

      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : (data ?? []).length === 0 ? (
        <EmptyState icon={<Receipt className="h-10 w-10" />} title="Nenhuma fatura" description="Ainda não há faturas emitidas." />
      ) : (
        <Card className="bg-card/60 border-border/60">
          <CardContent className="p-0 divide-y divide-border/60">
            {(data ?? []).map((f) => (
              <div key={f.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-medium">
                    {new Date(f.competencia).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Linha {f.linha?.numero ?? "—"} · Vencimento {fmtDate(f.vencimento)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">{fmtBRL(Number(f.valor))}</span>
                  <StatusFaturaBadge status={f.status} />
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/cliente/faturas/${f.id}`}><Eye className="h-4 w-4" />Ver</Link>
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => downloadPdf(f.pdf_path)}>
                    <Download className="h-4 w-4" />PDF
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
