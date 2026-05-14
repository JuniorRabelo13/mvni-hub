import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Phone, 
  Activity, 
  Search, 
  Filter, 
  ShieldCheck, 
  ShieldAlert, 
  ShieldOff,
  RefreshCw,
  Database,
  Users
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

export default function MasterLinhas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: report, isLoading, refetch, error: queryError } = useQuery({
    queryKey: ["master-lines-report"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_master_lines_report');
      if (error) throw error;
      return data as any;
    }
  });

  if (queryError) {
    return (
      <div className="space-y-6">
        <QueryError error={queryError} onRetry={() => refetch()} />
      </div>
    );
  }

  const filteredLines = report?.linhas?.filter((l: any) => {
    const matchesSearch = l.numero.includes(searchTerm) || 
                         l.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  const stats = [
    { label: "Ativas", value: report?.ativas || 0, icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Suspensas", value: report?.suspensas || 0, icon: ShieldAlert, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Canceladas", value: report?.canceladas || 0, icon: ShieldOff, color: "text-red-500", bg: "bg-red-500/10" },
    { label: "Reativadas", value: report?.reativadas || 0, icon: RefreshCw, color: "text-blue-500", bg: "bg-blue-500/10" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Infraestrutura Telecom</p>
          <h1 className="mt-1 text-3xl font-bold md:text-4xl">
            Gestão de <span className="text-gradient-gold">Linhas Global</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Monitoramento em tempo real de ativações e status operacional.</p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2 border-zinc-800">
            <RefreshCw className="h-3 w-3" /> Atualizar
          </Button>
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-xs font-bold uppercase backdrop-blur-sm">
            <Activity className="h-3 w-3 animate-pulse" /> Live Status
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="border-border/60 bg-zinc-950/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{s.label}</p>
                <div className={cn("p-1.5 rounded-md", s.bg)}>
                  <s.icon className={cn("h-4 w-4", s.color)} />
                </div>
              </div>
              <h2 className="text-2xl font-bold">{s.value}</h2>
              <p className="text-[10px] text-muted-foreground mt-1">Linhas no estado {s.label.toLowerCase()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-primary/20 bg-zinc-950/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
            <CardTitle className="text-xl font-bold">Monitoramento de Linhas</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative w-48">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Número ou cliente..."
                  className="pl-9 h-9 bg-zinc-900/50 border-zinc-800 text-xs"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="h-9 bg-zinc-900/50 border border-zinc-800 rounded-md px-3 text-xs text-muted-foreground focus:ring-1 focus:ring-primary outline-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Todos Status</option>
                <option value="ativa">Ativas</option>
                <option value="suspensa">Suspensas</option>
                <option value="cancelada">Canceladas</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-zinc-800/50">
              <Table>
                <TableHeader className="bg-zinc-900/30">
                  <TableRow className="hover:bg-transparent border-zinc-800">
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Afiliado</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ativação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLines?.map((l: any) => (
                    <TableRow key={l.id} className="border-zinc-800/50 hover:bg-zinc-900/20 group">
                      <TableCell className="font-mono text-xs font-bold text-primary">{l.numero}</TableCell>
                      <TableCell className="text-xs">{l.cliente_nome || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{l.afiliado_nome || "—"}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-[10px] h-5 uppercase font-bold",
                            l.status === 'ativa' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                            l.status === 'suspensa' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                            "bg-red-500/10 text-red-500 border-red-500/20"
                          )}
                        >
                          {l.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-[10px] text-muted-foreground">
                        {new Date(l.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredLines?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        Nenhuma linha encontrada.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-primary/20 bg-zinc-950/50 backdrop-blur-sm">
            <CardHeader><CardTitle className="text-sm font-bold flex items-center gap-2"><Database className="h-4 w-4 text-primary" /> Consumo Operacional</CardTitle></CardHeader>
            <CardContent className="space-y-4">
               <div className="space-y-2">
                  <div className="flex justify-between text-[10px] uppercase font-bold">
                    <span>Provisionamento</span>
                    <span>85%</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[85%]" />
                  </div>
               </div>
               <div className="space-y-2">
                  <div className="flex justify-between text-[10px] uppercase font-bold">
                    <span>API Gateway</span>
                    <span>12ms</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[40%]" />
                  </div>
               </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-zinc-950/50 backdrop-blur-sm">
            <CardHeader><CardTitle className="text-sm font-bold flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Demandas Pendentes</CardTitle></CardHeader>
            <CardContent className="p-0">
               <div className="divide-y divide-zinc-800">
                  <div className="p-4 flex items-center justify-between">
                    <div className="text-[10px] font-bold">Solicitações de Reativação</div>
                    <Badge className="bg-primary text-[10px]">12</Badge>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <div className="text-[10px] font-bold">Novas Ativações (24h)</div>
                    <Badge variant="outline" className="text-[10px] border-emerald-500/20 text-emerald-500">+45</Badge>
                  </div>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
