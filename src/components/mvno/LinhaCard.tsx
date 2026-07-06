import { Link } from "react-router-dom";
import { Smartphone, ChevronRight, Calendar, Wifi } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusLinhaBadge } from "./StatusBadge";
import type { MvnoLinha } from "@/hooks/mvno/useMinhasLinhas";

function fmtDate(d: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("pt-BR");
  } catch {
    return "—";
  }
}

function fmtBRL(n: number | null | undefined) {
  if (n == null) return "R$ 0,00";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function LinhaCard({ linha }: { linha: MvnoLinha }) {
  return (
    <Card className="bg-card/60 backdrop-blur border-border/60 hover:border-primary/40 transition-colors">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">{linha.numero}</p>
              <p className="text-xs text-muted-foreground">
                {linha.operadora?.nome ?? "Operadora —"}
                {linha.plano?.nome ? ` · ${linha.plano.nome}` : ""}
              </p>
            </div>
          </div>
          <StatusLinhaBadge status={linha.status} />
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-md border border-border/50 bg-background/40 p-2.5">
            <p className="text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3 w-3" /> Ativação
            </p>
            <p className="mt-0.5 font-medium">{fmtDate(linha.ativada_em)}</p>
          </div>
          <div className="rounded-md border border-border/50 bg-background/40 p-2.5">
            <p className="text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3 w-3" /> Vencimento
            </p>
            <p className="mt-0.5 font-medium">{fmtDate(linha.proximo_vencimento)}</p>
          </div>
          <div className="rounded-md border border-border/50 bg-background/40 p-2.5">
            <p className="text-muted-foreground flex items-center gap-1.5">
              <Wifi className="h-3 w-3" /> Franquia
            </p>
            <p className="mt-0.5 font-medium">
              {linha.plano?.franquia_dados_mb
                ? `${(linha.plano.franquia_dados_mb / 1024).toFixed(1)} GB`
                : "—"}
            </p>
          </div>
          <div className="rounded-md border border-border/50 bg-background/40 p-2.5">
            <p className="text-muted-foreground">Mensalidade</p>
            <p className="mt-0.5 font-medium">{fmtBRL(linha.valor_mensal)}</p>
          </div>
        </div>

        <Button asChild variant="outline" size="sm" className="w-full">
          <Link to={`/cliente/linhas/${linha.id}`}>
            Ver detalhes <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
