import { useMemo, useState } from "react";
import { Wallet, QrCode, Receipt } from "lucide-react";
import { useMinhasFaturas, type MvnoFatura } from "@/hooks/mvno/useMinhasFaturas";
import { useMeusPagamentos } from "@/hooks/mvno/usePagamentos";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusFaturaBadge } from "@/components/mvno/StatusBadge";
import { EmptyState } from "@/components/mvno/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SEO } from "@/components/SEO";
import { PixCheckoutDialog } from "@/components/mvno/PixCheckoutDialog";
import { ReciboPix } from "@/components/mvno/ReciboPix";

function fmtBRL(n: number) { return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function fmtDate(d: string | null | undefined) { if (!d) return "—"; try { return new Date(d).toLocaleDateString("pt-BR"); } catch { return "—"; } }

export default function Pagamentos() {
  const { data, isLoading } = useMinhasFaturas();
  const { data: pagamentos } = useMeusPagamentos();

  const [pixFatura, setPixFatura] = useState<MvnoFatura | null>(null);
  const [reciboFor, setReciboFor] = useState<MvnoFatura | null>(null);

  const grupos = useMemo(() => {
    const arr = data ?? [];
    return {
      pagas: arr.filter((f) => f.status === "paga"),
      pendentes: arr.filter((f) => f.status === "aberta" || f.status === "processando"),
      atrasadas: arr.filter((f) => f.status === "atrasada"),
    };
  }, [data]);

  const total = (list: typeof grupos.pagas) => list.reduce((s, f) => s + Number(f.valor ?? 0), 0);

  const pagamentoPorFatura = useMemo(() => {
    const map = new Map<string, (typeof pagamentos extends (infer U)[] | undefined ? U : never)>();
    (pagamentos ?? []).forEach((p) => {
      if (!map.has(p.fatura_id) || p.status === "confirmado") map.set(p.fatura_id, p);
    });
    return map;
  }, [pagamentos]);

  const renderLinha = (f: MvnoFatura) => {
    const pag = pagamentoPorFatura.get(f.id);
    const pode = f.status === "aberta" || f.status === "atrasada" || f.status === "processando";
    const confirmado = pag?.status === "confirmado" || f.status === "paga";
    return (
      <div key={f.id} className="flex items-center justify-between gap-3 py-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">
            {new Date(f.competencia).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            Linha {f.linha?.numero ?? "—"} · Venc. {fmtDate(f.vencimento)}
            {f.pago_em ? ` · Pago ${fmtDate(f.pago_em)}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-semibold">{fmtBRL(Number(f.valor))}</span>
          <StatusFaturaBadge status={f.status} />
          {pode && !confirmado && (
            <Button size="sm" variant="secondary" onClick={() => setPixFatura(f)}>
              <QrCode className="mr-1.5 h-3.5 w-3.5" /> PIX
            </Button>
          )}
          {confirmado && pag && (
            <Button size="sm" variant="outline" onClick={() => setReciboFor(f)}>
              <Receipt className="mr-1.5 h-3.5 w-3.5" /> Recibo
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <SEO title="Pagamentos — MVNI" description="Pagamentos, recibos e histórico financeiro." path="/cliente/pagamentos" />
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Pagamentos</h1>
        <p className="text-sm text-muted-foreground">Pague suas faturas via PIX e acesse os recibos.</p>
      </header>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : !data || data.length === 0 ? (
        <EmptyState icon={<Wallet className="h-10 w-10" />} title="Sem pagamentos" description="Ainda não há faturas registradas." />
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
                    ) : list.map(renderLinha)}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}

      {pixFatura && (
        <PixCheckoutDialog
          open={!!pixFatura}
          onOpenChange={(v) => !v && setPixFatura(null)}
          faturaId={pixFatura.id}
          competencia={pixFatura.competencia}
          numeroLinha={pixFatura.linha?.numero}
        />
      )}

      {reciboFor && pagamentoPorFatura.get(reciboFor.id) && (
        <ReciboPix
          open={!!reciboFor}
          onOpenChange={(v) => !v && setReciboFor(null)}
          pagamento={pagamentoPorFatura.get(reciboFor.id)!}
          faturaCompetencia={reciboFor.competencia}
          numeroLinha={reciboFor.linha?.numero}
        />
      )}
    </div>
  );
}
