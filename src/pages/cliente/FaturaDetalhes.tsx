import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";
import { useFatura } from "@/hooks/mvno/useMinhasFaturas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/mvno/EmptyState";
import { StatusFaturaBadge } from "@/components/mvno/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SEO } from "@/components/SEO";

function fmtBRL(n: number) { return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("pt-BR"); } catch { return "—"; }
}

const CATEGORIA_LABEL: Record<string, string> = {
  mensalidade: "Mensalidade",
  dados: "Internet",
  sms: "SMS",
  voz: "Ligações",
  roaming: "Roaming",
  tributo: "Tributos",
  desconto: "Desconto",
  outros: "Outros",
};

export default function FaturaDetalhes() {
  const { id } = useParams();
  const { data: f, isLoading } = useFatura(id);

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-96" /></div>;
  if (!f) return <EmptyState title="Fatura não encontrada" description="Você não tem acesso a esta fatura." />;

  const downloadPdf = async () => {
    if (!f.pdf_path) { toast.info("PDF ainda não disponível."); return; }
    try {
      const { data, error } = await supabase.storage.from("mvno-faturas-cliente").createSignedUrl(f.pdf_path, 300);
      if (error) throw error;
      window.open(data.signedUrl, "_blank");
    } catch { toast.error("Não foi possível gerar o link."); }
  };

  const itens = (f.itens ?? []) as any[];

  return (
    <div className="space-y-6">
      <SEO title="Detalhes da Fatura — MVNI" description="Detalhes da fatura." path={`/cliente/faturas/${f.id}`} />
      <Button asChild variant="ghost" size="sm">
        <Link to="/cliente/faturas"><ArrowLeft className="h-4 w-4" /> Voltar</Link>
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Fatura {new Date(f.competencia).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
          </h1>
          <p className="text-sm text-muted-foreground">
            Linha {f.linha?.numero ?? "—"} · {f.linha?.operadora?.nome ?? "—"} · {f.linha?.plano?.nome ?? "—"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusFaturaBadge status={f.status} />
          <Button onClick={downloadPdf} size="sm" variant="outline">
            <Download className="h-4 w-4" /> Baixar PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="bg-card/60 border-border/60"><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Vencimento</p>
          <p className="text-lg font-semibold mt-1">{fmtDate(f.vencimento)}</p>
        </CardContent></Card>
        <Card className="bg-card/60 border-border/60"><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Valor</p>
          <p className="text-lg font-semibold mt-1">{fmtBRL(Number(f.valor))}</p>
        </CardContent></Card>
        <Card className="bg-card/60 border-border/60"><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Pago em</p>
          <p className="text-lg font-semibold mt-1">{fmtDate(f.pago_em)}</p>
        </CardContent></Card>
      </div>

      <Card className="bg-card/60 border-border/60">
        <CardHeader><CardTitle className="text-base">Itens</CardTitle></CardHeader>
        <CardContent>
          {itens.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Sem itens detalhados.</p>
          ) : (
            <div className="divide-y divide-border/60">
              {itens.map((it) => (
                <div key={it.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">{it.descricao}</p>
                    <p className="text-xs text-muted-foreground">
                      {CATEGORIA_LABEL[it.categoria] ?? it.categoria} · qtd {it.quantidade}
                    </p>
                  </div>
                  <span className="text-sm font-semibold">{fmtBRL(Number(it.valor_total))}</span>
                </div>
              ))}
              <div className="flex items-center justify-between py-3 font-semibold">
                <span>Total</span>
                <span>{fmtBRL(Number(f.valor))}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
