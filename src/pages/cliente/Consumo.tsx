import { useMemo } from "react";
import { BarChart3 } from "lucide-react";
import { useConsumo } from "@/hooks/mvno/useConsumo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/mvno/EmptyState";
import { SEO } from "@/components/SEO";

export default function Consumo() {
  const { data, isLoading } = useConsumo();

  const agregado = useMemo(() => {
    if (!data) return null;
    const totalDados = data.reduce((s: number, c: any) => s + Number(c.dados_mb ?? 0), 0);
    const totalSms = data.reduce((s: number, c: any) => s + Number(c.sms_qtd ?? 0), 0);
    const totalMin = data.reduce((s: number, c: any) => s + Number(c.minutos_qtd ?? 0), 0);
    const porMes = new Map<string, { dados: number; sms: number; min: number }>();
    for (const c of data as any[]) {
      const k = c.competencia?.slice(0, 7) ?? "—";
      const cur = porMes.get(k) ?? { dados: 0, sms: 0, min: 0 };
      cur.dados += Number(c.dados_mb ?? 0);
      cur.sms += Number(c.sms_qtd ?? 0);
      cur.min += Number(c.minutos_qtd ?? 0);
      porMes.set(k, cur);
    }
    const meses = Array.from(porMes.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .slice(0, 6);
    return { totalDados, totalSms, totalMin, meses };
  }, [data]);

  return (
    <div className="space-y-6">
      <SEO title="Consumo — MVNI" description="Consumo de dados, SMS e minutos." path="/cliente/consumo" />
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Consumo</h1>
        <p className="text-sm text-muted-foreground">Acompanhe o uso das suas linhas.</p>
      </header>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : !data || data.length === 0 ? (
        <EmptyState icon={<BarChart3 className="h-10 w-10" />} title="Sem dados de consumo" description="Assim que a operadora reportar consumo, ele aparecerá aqui." />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Stat label="Dados totais" value={`${(agregado!.totalDados / 1024).toFixed(2)} GB`} />
            <Stat label="SMS" value={String(agregado!.totalSms)} />
            <Stat label="Minutos" value={String(agregado!.totalMin)} />
          </div>

          <Card className="bg-card/60 border-border/60">
            <CardHeader><CardTitle className="text-base">Consumo por competência</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {agregado!.meses.map(([mes, v]) => {
                const max = Math.max(...agregado!.meses.map(([, m]) => m.dados), 1);
                const pct = (v.dados / max) * 100;
                return (
                  <div key={mes}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium">{mes}</span>
                      <span className="text-muted-foreground">
                        {(v.dados / 1024).toFixed(1)} GB · {v.sms} SMS · {v.min} min
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-background/60 overflow-hidden">
                      <div className="h-full bg-gradient-gold" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="bg-card/60 border-border/60">
      <CardContent className="p-4">
        <p className="text-xs uppercase text-muted-foreground tracking-wide">{label}</p>
        <p className="text-2xl font-semibold mt-2">{value}</p>
      </CardContent>
    </Card>
  );
}
