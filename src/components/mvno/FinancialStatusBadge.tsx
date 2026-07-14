import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";

export type SituacaoFinanceira = "em_dia" | "pendente" | "atrasado";

const MAP: Record<SituacaoFinanceira, { label: string; className: string; icon: React.ReactNode }> = {
  em_dia: {
    label: "Em dia",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  pendente: {
    label: "Pendente",
    className: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    icon: <Clock className="h-3 w-3" />,
  },
  atrasado: {
    label: "Atrasado",
    className: "bg-red-500/15 text-red-400 border-red-500/30",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
};

export function FinancialStatusBadge({ situacao }: { situacao: SituacaoFinanceira }) {
  const m = MAP[situacao];
  return (
    <Badge variant="outline" className={cn("gap-1 font-medium", m.className)}>
      {m.icon}
      {m.label}
    </Badge>
  );
}

/**
 * Deriva a situação financeira a partir da lista de faturas.
 * - atrasado: existe alguma "atrasada"
 * - pendente: existe alguma "aberta"
 * - em_dia: nenhuma pendência
 */
export function derivarSituacao(faturas: Array<{ status: string }> | undefined): SituacaoFinanceira {
  const list = faturas ?? [];
  if (list.some((f) => f.status === "atrasada")) return "atrasado";
  if (list.some((f) => f.status === "aberta")) return "pendente";
  return "em_dia";
}
