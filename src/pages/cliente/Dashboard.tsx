import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Smartphone,
  Receipt,
  LifeBuoy,
  Wallet,
  Calendar,
  TrendingUp,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMinhasLinhas } from "@/hooks/mvno/useMinhasLinhas";
import { useMinhasFaturas } from "@/hooks/mvno/useMinhasFaturas";
import { useConsumo } from "@/hooks/mvno/useConsumo";
import { StatusFaturaBadge } from "@/components/mvno/StatusBadge";
import { SEO } from "@/components/SEO";

function fmtBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("pt-BR");
  } catch {
    return "—";
  }
}

export default function ClienteDashboard() {
  const { data: linhas, isLoading: lLoad } = useMinhasLinhas();
  const { data: faturas, isLoading: fLoad } = useMinhasFaturas();
  const { data: consumos } = useConsumo();

  const stats = useMemo(() => {
    const total = linhas?.length ?? 0;
    const ativas = (linhas ?? []).filter((l) => l.status === "ativa").length;
    const mensal = (linhas ?? []).reduce((s, l) => s + Number(l.valor_mensal ?? 0), 0);
    const proximaFatura = (faturas ?? [])
      .filter((f) => f.status === "aberta" || f.status === "atrasada")
      .sort((a, b) => (a.vencimento < b.vencimento ? -1 : 1))[0];
    const valorProxima = (faturas ?? [])
      .filter((f) => f.status === "aberta" || f.status === "atrasada")
      .reduce((s, f) => s + Number(f.valor ?? 0), 0);
    const consumoMB = (consumos ?? []).reduce((s: number, c: any) => s + Number(c.dados_mb ?? 0), 0);
    const atrasadas = (faturas ?? []).filter((f) => f.status === "atrasada").length;
    return { total, ativas, mensal, proximaFatura, valorProxima, consumoMB, atrasadas };
  }, [linhas, faturas, consumos]);

  return (
    <div className="space-y-6">
      <SEO title="Central do Cliente — MVNI" description="Dashboard das suas linhas, faturas e consumo." path="/cliente" />

      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Central do Cliente</h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe suas linhas, faturas e consumo em um só lugar.
        </p>
      </header>

      {stats.atrasadas > 0 && (
        <Card className="border-red-500/40 bg-red-500/5">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                Você possui {stats.atrasadas} fatura(s) em atraso.
              </p>
              <p className="text-xs text-muted-foreground">
                Regularize para evitar suspensão da linha.
              </p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link to="/cliente/faturas">Ver faturas</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total de linhas"
          value={lLoad ? null : String(stats.total)}
          hint={`${stats.ativas} ativa(s)`}
          icon={<Smartphone className="h-4 w-4" />}
        />
        <StatCard
          label="Próxima fatura"
          value={fLoad ? null : fmtDate(stats.proximaFatura?.vencimento)}
          hint={stats.proximaFatura ? fmtBRL(Number(stats.proximaFatura.valor)) : "Nenhuma"}
          icon={<Calendar className="h-4 w-4" />}
        />
        <StatCard
          label="A pagar (aberto)"
          value={fLoad ? null : fmtBRL(stats.valorProxima)}
          hint="Somando faturas em aberto"
          icon={<Wallet className="h-4 w-4" />}
        />
        <StatCard
          label="Consumo (dados)"
          value={
            stats.consumoMB > 0 ? `${(stats.consumoMB / 1024).toFixed(1)} GB` : "0 GB"
          }
          hint="Últimos meses"
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <QuickAction to="/cliente/linhas" icon={<Smartphone className="h-5 w-5" />} label="Minhas linhas" />
        <QuickAction to="/cliente/faturas" icon={<Receipt className="h-5 w-5" />} label="Minhas faturas" />
        <QuickAction to="/cliente/suporte" icon={<LifeBuoy className="h-5 w-5" />} label="Suporte" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-card/60 border-border/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Últimas faturas</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/cliente/faturas">Ver todas <ChevronRight className="h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {fLoad ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : (faturas ?? []).slice(0, 5).length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma fatura ainda.</p>
            ) : (
              (faturas ?? []).slice(0, 5).map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between rounded-md border border-border/50 bg-background/40 p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {new Date(f.competencia).toLocaleDateString("pt-BR", {
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Linha {f.linha?.numero ?? "—"} · Venc. {fmtDate(f.vencimento)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{fmtBRL(Number(f.valor))}</span>
                    <StatusFaturaBadge status={f.status} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/60 border-border/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Resumo das linhas</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/cliente/linhas">Ver todas <ChevronRight className="h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {lLoad ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : (linhas ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Nenhuma linha vinculada ainda.
              </p>
            ) : (
              (linhas ?? []).slice(0, 5).map((l) => (
                <Link
                  key={l.id}
                  to={`/cliente/linhas/${l.id}`}
                  className="flex items-center justify-between rounded-md border border-border/50 bg-background/40 p-3 hover:border-primary/40 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">{l.numero}</p>
                    <p className="text-xs text-muted-foreground">
                      {l.plano?.nome ?? "—"} · {fmtBRL(Number(l.valor_mensal))}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string | null;
  hint?: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="bg-card/60 border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs uppercase tracking-wide">{label}</span>
          <span className="text-primary">{icon}</span>
        </div>
        <div className="mt-2">
          {value === null ? (
            <Skeleton className="h-7 w-24" />
          ) : (
            <p className="text-2xl font-semibold tracking-tight">{value}</p>
          )}
          {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAction({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="group flex items-center justify-between rounded-lg border border-border/60 bg-card/60 p-4 hover:border-primary/40 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
          {icon}
        </div>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
    </Link>
  );
}
