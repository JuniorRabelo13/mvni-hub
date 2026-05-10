import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, User, ArrowRight, History } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TimelineAuditoriaProps {
  clienteId: string;
}

export function TimelineAuditoria({ clienteId }: TimelineAuditoriaProps) {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["auditoria-cliente", clienteId],
    queryFn: async () => {
      // Buscamos registros onde o ID do cliente está contido nos metadados da auditoria
      const { data, error } = await supabase
        .from("auditoria")
        .select("*")
        .eq("tabela", "clientes")
        .filter("dados_depois->>cliente_id", "eq", clienteId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3 mt-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground border rounded-lg border-dashed mt-4">
        <History className="h-8 w-8 mb-2 opacity-20" />
        <p className="text-xs">Nenhuma alteração registrada.</p>
      </div>
    );
  }

  const getStatusBadge = (ativo: boolean) => {
    return ativo ? (
      <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">Ativo</span>
    ) : (
      <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">Inativo</span>
    );
  };

  return (
    <div className="space-y-4 mt-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        <History className="h-4 w-4" /> Histórico de Alterações
      </h3>
      <div className="relative space-y-4 before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
        {logs.map((log) => (
          <div key={log.id} className="relative flex items-start gap-4">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-background ${
              log.origem === 'sistema' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
            }`}>
              {log.origem === 'sistema' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
            </div>
            <div className="flex flex-col gap-1 pt-0.5">
              <div className="flex items-center gap-2 text-xs font-medium">
                <span className="capitalize">{log.origem}</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">
                  {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {getStatusBadge(log.dados_antes.ativo)}
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                {getStatusBadge(log.dados_depois.ativo)}
              </div>
              {log.origem === 'humano' && (
                <p className="text-[10px] text-muted-foreground italic">
                  Alterado via Dashboard
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
