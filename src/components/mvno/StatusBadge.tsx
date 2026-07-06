import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const LINHA_MAP: Record<string, { label: string; className: string }> = {
  ativa: { label: "Ativa", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  suspensa: { label: "Suspensa", className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  bloqueada: { label: "Bloqueada", className: "bg-red-500/15 text-red-400 border-red-500/30" },
  cancelada: { label: "Cancelada", className: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" },
  pendente: { label: "Pendente", className: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  portabilidade: { label: "Portabilidade", className: "bg-violet-500/15 text-violet-400 border-violet-500/30" },
};

const FATURA_MAP: Record<string, { label: string; className: string }> = {
  aberta: { label: "Em aberto", className: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  paga: { label: "Paga", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  atrasada: { label: "Atrasada", className: "bg-red-500/15 text-red-400 border-red-500/30" },
  cancelada: { label: "Cancelada", className: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" },
  processando: { label: "Processando", className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
};

export function StatusLinhaBadge({ status }: { status: string }) {
  const m = LINHA_MAP[status] ?? { label: status, className: "bg-muted text-foreground" };
  return <Badge variant="outline" className={cn("font-medium", m.className)}>{m.label}</Badge>;
}

export function StatusFaturaBadge({ status }: { status: string }) {
  const m = FATURA_MAP[status] ?? { label: status, className: "bg-muted text-foreground" };
  return <Badge variant="outline" className={cn("font-medium", m.className)}>{m.label}</Badge>;
}
