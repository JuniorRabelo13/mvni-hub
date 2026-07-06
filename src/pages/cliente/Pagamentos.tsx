import { useMemo } from "react";
import { Wallet } from "lucide-react";
import { useMinhasFaturas } from "@/hooks/mvno/useMinhasFaturas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusFaturaBadge } from "@/components/mvno/StatusBadge";
import { EmptyState } from "@/components/mvno/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SEO } from "@/components/SEO";

function fmtBRL(n: number) { return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function fmtDate(d: string | null | undefined) { if (!d) return "—"; try { return new Date(d).toLocaleDateString("pt-BR"); } catch { return "—"; } }

export default function Pagamentos() {
  const { data, isLoading } = useMinhasFaturas();

  const grupos = useMemo(() => {
    const arr = data ?? [];
    return {
      pagas: arr.filter((f) => f.status === "paga"),
      pendentes: arr.filter((f) => f.status === "aberta"),
      atrasadas: arr.filter((f) => f.status === "atrasada"),
    };
  }, [data]);

  const total = (list: typeof grupos.pagas) => list.reduce((s, f) => s + Number(f.valor ?? 0), 0);

  return (
    <div className="space-y-6">
      <SEO title="Pagamentos — MVNI" description="Pagamentos, recibos e histórico financeiro." path="/cliente/pagamentos" />
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Pagamentos</h1>
        <p className="text-sm text-muted-foreground">Recibos, pendências e histórico. PIX e Cartão em breve.</p>
      </header>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : !data || data.length === 0 ? (
        <EmptyState icon={<Wallet className="h-10 w-10" />} title="Sem pagamentos" description="Ainda não há pagamentos registrados." />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-card/60 border-border/60"><CardContent className="p-4">
              <p className="text-xs uppercase text-muted-foreground">Pago</p>
              <p className="text-2xl font-semibold mt-1">{fmtBRL(total(grupos.pagas))}</p>
              <p className="text-xs text-muted-foreground mt-1">{grupos.pagas.length} fatura(s)</p>
            </CardContent></Card>
            <Card className="bg-card/60 border-border/60"><CardContent className="p-4">
              <p className="text-xs uppercase text-muted-foreground">Pendente</p>
              <p className="text-2xl font-semibold mt-1 text-blue-400">{fmtBRL(total(grupos.pendentes))}</p>
              <p className="text-xs text-muted-foreground mt-1">{grupos.pendentes.length} fatura(s)</p>
            </CardContent></Card>
            <Card className="bg-card/60 border-border/60"><CardContent className="p-4">
              <p className="text-xs uppercase text-muted-foreground">Atrasado</p>
              <p className="text-2xl font-semibold mt-1 text-red-400">{fmtBRL(total(grupos.atrasadas))}</p>
              <p className="text-xs text-muted-foreground mt-1">{grupos.atrasadas.length} fatura(s)</p>
            </CardContent></Card>
          </div>

          <Card className="bg-card/60 border-border/60">
            <CardHeader><CardTitle className="text-base">Histórico</CardTitle></CardHeader>
            <CardContent>
              <Tabs defaultValue="todos">
                <TabsList>
                  <TabsTrigger value="todos">Todos</TabsTrigger>
                  <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
                  <TabsTrigger value="atrasados">Atrasados</TabsTrigger>
                  <TabsTrigger value="pagos">Pagos</TabsTrigger>
                </TabsList>
                {[
                  { k: "todos", list: data },
                  { k: "pendentes", list: grupos.pendentes },
                  { k: "atrasados", list: grupos.atrasadas },
                  { k: "pagos", list: grupos.pagas },
                ].map(({ k, list }) => (
                  <TabsContent key={k} value={k} className="divide-y divide-border/60">
                    {list.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-6 text-center">Nada por aqui.</p>
                    ) : list.map((f) => (
                      <div key={f.id} className="flex items-center justify-between py-3">
                        <div>
                          <p className="text-sm font-medium">
                            {new Date(f.competencia).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                          </p>
                          <p className="text-xs text-muted-foreground">Linha {f.linha?.numero ?? "—"} · Venc. {fmtDate(f.vencimento)}{f.pago_em ? ` · Pago ${fmtDate(f.pago_em)}` : ""}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{fmtBRL(Number(f.valor))}</span>
                          <StatusFaturaBadge status={f.status} />
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
