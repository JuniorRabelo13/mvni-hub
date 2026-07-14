import { useMemo } from "react";
import { BarChart3 } from "lucide-react";
import { useConsumo } from "@/hooks/mvno/useConsumo";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/mvno/EmptyState";
import { ConsumptionCharts } from "@/components/mvno/ConsumptionCharts";
import { SEO } from "@/components/SEO";

export default function Consumo() {
  const { data, isLoading } = useConsumo();

  const agregado = useMemo(() => {
    if (!data) return null;
    const totalDados = data.reduce((s: number, c: any) => s + Number(c.dados_mb ?? 0), 0);
    const totalSms = data.reduce((s: number, c: any) => s + Number(c.sms_qtd ?? 0), 0);
    const totalMin = data.reduce((s: number, c: any) => s + Number(c.minutos_qtd ?? 0), 0);
    return { totalDados, totalSms, totalMin };
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

          <ConsumptionCharts consumos={data as any[]} />
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
