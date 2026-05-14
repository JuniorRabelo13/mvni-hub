import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  ClipboardList, 
  Search, 
  Filter, 
  User, 
  Calendar, 
  ArrowUpDown,
  FileText,
  Shield,
  CreditCard,
  UserPlus,
  RefreshCw,
  Cpu
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { QueryError } from "@/components/QueryError";

export default function MasterAuditoria() {
  const { user, role, isAuthReady } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");

  const { data: logs, isLoading, refetch, error: queryError } = useQuery({
    queryKey: ["master-audit-logs", typeFilter, dateFilter],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_master_audit_logs', {
        p_event_type: typeFilter === "all" ? null : typeFilter,
        p_start_date: dateFilter ? `${dateFilter}T00:00:00Z` : null,
      });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user && role === 'master' && isAuthReady
  });

  if (queryError) {
    return (
      <div className="space-y-6">
        <QueryError error={queryError} onRetry={() => refetch()} />
      </div>
    );
  }

  const filteredLogs = logs?.filter(log => 
    log.event_message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.actor_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getEventBadge = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'login': return { icon: User, color: "bg-blue-500/10 text-blue-500 border-blue-500/20" };
      case 'financeiro': return { icon: CreditCard, color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" };
      case 'suspensao': return { icon: Shield, color: "bg-red-500/10 text-red-500 border-red-500/20" };
      case 'reativacao': return { icon: RefreshCw, color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" };
      case 'admin': return { icon: Shield, color: "bg-purple-500/10 text-purple-500 border-purple-500/20" };
      case 'automacao': return { icon: Cpu, color: "bg-amber-500/10 text-amber-500 border-amber-500/20" };
      default: return { icon: FileText, color: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20" };
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Segurança & Conformidade</p>
          <h1 className="mt-1 text-3xl font-bold md:text-4xl">
            Audit <span className="text-gradient-gold">Log Master</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Rastreabilidade completa de todas as ações críticas no ecossistema.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2 border-zinc-800">
          <RefreshCw className="h-3.5 w-3.5" /> Atualizar Logs
        </Button>
      </header>

      <Card className="border-primary/20 bg-zinc-950/50 backdrop-blur-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle className="text-xl font-bold">Histórico de Eventos</CardTitle>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar na mensagem ou ator..."
                  className="pl-9 h-9 bg-zinc-900/50 border-zinc-800 text-xs"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="h-9 bg-zinc-900/50 border border-zinc-800 rounded-md px-3 text-xs text-muted-foreground focus:ring-1 focus:ring-primary outline-none"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">Todos Tipos</option>
                <option value="login">Logins</option>
                <option value="financeiro">Financeiro</option>
                <option value="suspensao">Suspensões</option>
                <option value="reativacao">Reativações</option>
                <option value="plano">Alterações Plano</option>
                <option value="admin">Administrativo</option>
                <option value="automacao">Automações</option>
              </select>
              <div className="relative">
                <Input
                  type="date"
                  className="h-9 bg-zinc-900/50 border-zinc-800 text-xs w-40"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-zinc-800/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-zinc-900/30">
                <TableRow className="hover:bg-transparent border-zinc-800">
                  <TableHead className="text-[11px] uppercase tracking-wider w-[180px]">Timestamp</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider">Tipo</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider">Ator</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider">Mensagem</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider text-right">Metadata</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs?.map((log) => {
                  const badge = getEventBadge(log.event_type);
                  return (
                    <TableRow key={log.log_id} className="border-zinc-800/50 hover:bg-zinc-900/20 group">
                      <TableCell className="font-mono text-[10px] text-muted-foreground">
                        {new Date(log.event_time).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-[9px] uppercase font-bold flex w-fit gap-1 items-center", badge.color)}>
                          <badge.icon className="h-2.5 w-2.5" />
                          {log.event_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                            <User className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <span className="text-xs font-medium">{log.actor_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="text-xs line-clamp-2">{log.event_message}</p>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-zinc-800">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(!filteredLogs || filteredLogs.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <ClipboardList className="h-8 w-8 opacity-20" />
                        <p className="text-xs">Nenhum log de auditoria encontrado.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
