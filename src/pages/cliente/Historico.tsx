import { History } from "lucide-react";
import { useHistoricoTodasLinhas } from "@/hooks/mvno/useConsumo";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/mvno/EmptyState";
import { HistoryTimeline } from "@/components/mvno/HistoryTimeline";
import { SEO } from "@/components/SEO";

export default function Historico() {
  const { data, isLoading } = useHistoricoTodasLinhas();

  return (
    <div className="space-y-6">
      <SEO title="Histórico — MVNI" description="Histórico de eventos das suas linhas." path="/cliente/historico" />
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Histórico</h1>
        <p className="text-sm text-muted-foreground">Timeline de eventos das suas linhas.</p>
      </header>

      {isLoading ? (
        <div className="space-y-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : !data || data.length === 0 ? (
        <EmptyState icon={<History className="h-10 w-10" />} title="Sem eventos" description="Ainda não há eventos registrados." />
      ) : (
        <Card className="bg-card/60 border-border/60">
          <CardContent className="p-6">
            <HistoryTimeline eventos={data as any[]} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
