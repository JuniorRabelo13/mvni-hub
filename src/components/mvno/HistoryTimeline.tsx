import { cn } from "@/lib/utils";

type HistoricoEvento = {
  id: string;
  evento: string;
  descricao?: string | null;
  created_at: string;
  linha?: { id: string; numero: string } | null;
};

const EVENTO_LABELS: Record<string, string> = {
  linha_criada: "Linha criada",
  linha_ativada: "Linha ativada",
  troca_plano: "Troca de plano",
  pagamento: "Pagamento registrado",
  suspensao: "Linha suspensa",
  reativacao: "Linha reativada",
  mudanca_status: "Mudança de status",
  fatura_importada: "Fatura importada",
  alteracao_admin: "Alteração administrativa",
};

const EVENTO_COLOR: Record<string, string> = {
  pagamento: "bg-emerald-500",
  suspensao: "bg-red-500",
  reativacao: "bg-emerald-500",
  linha_ativada: "bg-primary",
  troca_plano: "bg-blue-500",
  fatura_importada: "bg-amber-500",
};

export function HistoryTimeline({ eventos }: { eventos: HistoricoEvento[] }) {
  return (
    <ol className="relative border-l border-border/60 ml-2 space-y-6">
      {eventos.map((h) => {
        const label = EVENTO_LABELS[h.evento] ?? String(h.evento).replace(/_/g, " ");
        const color = EVENTO_COLOR[h.evento] ?? "bg-primary/60";
        return (
          <li key={h.id} className="ml-4">
            <div
              className={cn(
                "absolute -left-1.5 h-3 w-3 rounded-full border border-primary",
                color,
              )}
            />
            <p className="text-xs text-muted-foreground">
              {new Date(h.created_at).toLocaleString("pt-BR")}
            </p>
            <p className="text-sm font-medium capitalize">
              {label}
              {h.linha?.numero && (
                <span className="text-muted-foreground"> · Linha {h.linha.numero}</span>
              )}
            </p>
            {h.descricao && <p className="text-xs text-muted-foreground">{h.descricao}</p>}
          </li>
        );
      })}
    </ol>
  );
}
