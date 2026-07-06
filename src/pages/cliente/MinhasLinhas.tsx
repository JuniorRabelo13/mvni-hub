import { Smartphone } from "lucide-react";
import { useMinhasLinhas } from "@/hooks/mvno/useMinhasLinhas";
import { LinhaCard } from "@/components/mvno/LinhaCard";
import { EmptyState } from "@/components/mvno/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "@/components/QueryError";
import { SEO } from "@/components/SEO";

export default function MinhasLinhas() {
  const { data, isLoading, error, refetch } = useMinhasLinhas();

  return (
    <div className="space-y-6">
      <SEO title="Minhas Linhas — MVNI" description="Todas as suas linhas telefônicas." path="/cliente/linhas" />
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Minhas Linhas</h1>
        <p className="text-sm text-muted-foreground">
          {data ? `${data.length} linha(s) vinculada(s) ao seu CPF.` : "Suas linhas telefônicas."}
        </p>
      </header>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-56" />)}
        </div>
      ) : error ? (
        <QueryError error={error as Error} onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={<Smartphone className="h-10 w-10" />}
          title="Nenhuma linha encontrada"
          description="Assim que sua linha for ativada pela operadora, ela aparecerá aqui."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((l) => <LinhaCard key={l.id} linha={l} />)}
        </div>
      )}
    </div>
  );
}
