import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Cpu, 
  Activity, 
  RefreshCw, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Clock,
  History,
  Timer,
  HardDrive
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
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

export default function MasterWorkers() {
  const { user, role, isAuthReady } = useAuth();
  const { data: report, isLoading, refetch } = useQuery({
    queryKey: ["master-workers-report"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_master_workers_report');
      if (error) throw error;
      return data as any;
    },
    refetchInterval: 15000,
    enabled: !!user && role === 'master' && isAuthReady
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

  const kpis = [
    { label: "Workers Ativos", value: report?.active_workers || 0, icon: Cpu, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Fila de Tarefas", value: report?.pending_tasks || 0, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Falhas (24h)", value: report?.failed_tasks || 0, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" },
    { label: "Execução Média", value: `${report?.avg_execution_ms || 0}ms`, icon: Timer, color: "text-blue-500", bg: "bg-blue-500/10" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Infraestrutura IA & Workers</p>
          <h1 className="mt-1 text-3xl font-bold md:text-4xl">
            Centro de <span className="text-gradient-gold">Operações Workers</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestão de Edge Functions, tarefas assíncronas e processamento em background.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2 border-zinc-800">
            <RefreshCw className="h-3.5 w-3.5" /> Reload
          </Button>
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-xs font-bold uppercase backdrop-blur-sm">
            <Activity className="h-3 w-3 animate-pulse text-emerald-500" /> Infrastructure OK
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((s) => (
          <Card key={s.label} className="border-border/60 bg-zinc-950/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{s.label}</p>
                <div className={cn("p-1.5 rounded-md", s.bg)}>
                  <s.icon className={cn("h-4 w-4", s.color)} />
                </div>
              </div>
              <h2 className="text-2xl font-bold">{s.value}</h2>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-primary/20 bg-zinc-950/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
          <CardTitle className="text-xl font-bold">Edge Functions & Microservices</CardTitle>
          <div className="flex items-center gap-2">
             <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]">Cloud Infrastructure</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-zinc-800/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-zinc-900/30">
                <TableRow className="hover:bg-transparent border-zinc-800">
                  <TableHead className="text-[11px] uppercase tracking-wider">Function Name</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider text-center">Uptime</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider text-center">Avg Latency</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider text-center">Errors (24h)</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider text-right">Resource Load</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report?.workers?.map((w: any) => (
                  <TableRow key={w.name} className="border-zinc-800/50 hover:bg-zinc-900/20 group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                          <Cpu className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-xs font-bold group-hover:text-primary transition-colors">{w.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {w.status === 'online' ? (
                          <div className="flex items-center gap-1.5 text-emerald-500">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Healthy</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-amber-500">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Degraded</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs text-muted-foreground">{w.uptime}</TableCell>
                    <TableCell className="text-center font-mono text-xs text-blue-400">{w.exec_time}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={cn(
                        "text-[10px] font-mono",
                        w.errors > 0 ? "border-red-500/20 text-red-500 bg-red-500/5" : "border-zinc-800 text-muted-foreground"
                      )}>
                        {w.errors}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
                             <div 
                                className={cn("h-full", w.status === 'online' ? "bg-emerald-500" : "bg-amber-500")} 
                                style={{ width: w.status === 'online' ? '25%' : '85%' }} 
                             />
                          </div>
                       </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <Card className="lg:col-span-2 border-border/40 bg-zinc-950/20">
            <CardHeader className="flex flex-row items-center justify-between">
               <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary"><History className="h-4 w-4" /> Global Task Log</CardTitle>
               <Badge variant="outline" className="text-[9px] border-zinc-800">Streaming...</Badge>
            </CardHeader>
            <CardContent className="text-[10px] text-muted-foreground font-mono space-y-1 max-h-[200px] overflow-y-auto custom-scrollbar">
               <div className="p-2 border-l-2 border-emerald-500 bg-emerald-500/5 mb-1 text-emerald-400 flex justify-between">
                  <span>[14:15:02] Task #9982: Email delivery success (User: 22a1).</span>
                  <span className="opacity-50">12ms</span>
               </div>
               <div className="p-2 border-l-2 border-blue-500 bg-blue-500/5 mb-1 text-blue-400 flex justify-between">
                  <span>[14:14:55] Task #9981: WhatsApp session sync complete.</span>
                  <span className="opacity-50">45ms</span>
               </div>
               <div className="p-2 border-l-2 border-zinc-800 bg-zinc-900/30 mb-1 flex justify-between">
                  <span>[14:14:40] Worker: billing-reconciliation started cycle.</span>
                  <span className="opacity-50">—</span>
               </div>
               <div className="p-2 border-l-2 border-red-500 bg-red-500/5 mb-1 text-red-400 flex justify-between">
                  <span>[14:14:12] Task #9975: Data-sanitization failed (DB Lock).</span>
                  <span className="opacity-50">Retry #2</span>
               </div>
            </CardContent>
         </Card>

         <Card className="border-border/40 bg-zinc-950/20">
            <CardHeader><CardTitle className="text-sm font-bold flex items-center gap-2 text-primary"><HardDrive className="h-4 w-4" /> Resource Usage</CardTitle></CardHeader>
            <CardContent className="space-y-4 pt-2">
               <div className="space-y-1.5">
                  <div className="flex justify-between text-[9px] uppercase font-bold text-muted-foreground">
                    <span>Database CPU</span>
                    <span className="text-emerald-500">22%</span>
                  </div>
                  <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[22%]" />
                  </div>
               </div>
               <div className="space-y-1.5">
                  <div className="flex justify-between text-[9px] uppercase font-bold text-muted-foreground">
                    <span>Memory Usage</span>
                    <span className="text-amber-500">68%</span>
                  </div>
                  <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 w-[68%]" />
                  </div>
               </div>
               <div className="space-y-1.5">
                  <div className="flex justify-between text-[9px] uppercase font-bold text-muted-foreground">
                    <span>API Traffic</span>
                    <span className="text-primary font-bold">NORMAL</span>
                  </div>
                  <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[35%]" />
                  </div>
               </div>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
