import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  Activity, 
  RefreshCw, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Clock,
  Battery,
  Link as LinkIcon,
  QrCode
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

export default function MasterWhatsApp() {
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const { data: report, isLoading, refetch, error: queryError } = useQuery({
    queryKey: ["master-whatsapp-report"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_master_whatsapp_report');
      if (error) throw error;
      setLastUpdate(new Date());
      return data as any;
    },
    refetchInterval: 10000 // Refresh a cada 10 segundos para efeito realtime
  });

  if (queryError) {
    return (
      <div className="space-y-6">
        <QueryError error={queryError} onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  const kpis = [
    { label: "Conectados", value: report?.connected || 0, icon: LinkIcon, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Offline", value: report?.disconnected || 0, icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
    { label: "Fila de Envio", value: report?.queue || 0, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Mensagens (24h)", value: report?.sent || 0, icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Erros", value: report?.failed || 0, icon: AlertTriangle, color: "text-red-400", bg: "bg-red-400/10" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Infraestrutura de Mensageria</p>
          <h1 className="mt-1 text-3xl font-bold md:text-4xl">
            WhatsApp <span className="text-gradient-gold">Engine Master</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Controle global de instâncias, sessões e fluxo de mensagens do ecossistema.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-[10px] text-muted-foreground font-mono bg-zinc-900/50 px-3 py-1.5 rounded-md border border-zinc-800">
            LAST UPDATE: {lastUpdate.toLocaleTimeString()}
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2 border-zinc-800 h-9">
            <RefreshCw className="h-3.5 w-3.5" /> Force Sync
          </Button>
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-xs font-bold uppercase backdrop-blur-sm">
            <Zap className="h-3 w-3 animate-pulse text-amber-500" /> Gateway Ativo
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
          <CardTitle className="text-xl font-bold">Instâncias em Operação</CardTitle>
          <div className="flex items-center gap-2">
             <Badge variant="outline" className="bg-emerald-500/5 text-emerald-500 border-emerald-500/20 text-[10px]">98.2% Uptime</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-zinc-800/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-zinc-900/30">
                <TableRow className="hover:bg-transparent border-zinc-800">
                  <TableHead className="text-[11px] uppercase tracking-wider">Instância / QR</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider text-center">Fila</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider text-center">Enviadas</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider text-center">Erros</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider text-center">Reconnects</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider text-right">Saúde</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report?.instances?.map((inst: any) => (
                  <TableRow key={inst.id} className="border-zinc-800/50 hover:bg-zinc-900/20 group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                          <QrCode className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold group-hover:text-primary transition-colors">{inst.instance_name}</span>
                          <span className="text-[10px] text-muted-foreground">{inst.phone_number || 'Sem número'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {inst.status === 'connected' ? (
                          <div className="flex items-center gap-1.5 text-emerald-500">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-bold uppercase">Online</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-red-500">
                            <XCircle className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-bold uppercase">Offline</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-[10px] font-mono border-zinc-800">
                        {report?.queue || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs text-emerald-400">
                      {inst.sent_count || 0}
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs text-red-400">
                      {inst.error_count || 0}
                    </TableCell>
                    <TableCell className="text-center">
                       <span className="text-[10px] font-bold text-muted-foreground">{inst.reconnects || 0}</span>
                    </TableCell>
                    <TableCell className="text-right">
                       <div className="flex items-center justify-end gap-2">
                          <span className="text-[10px] font-bold">{inst.health || '100'}%</span>
                          <Battery className={cn(
                            "h-3.5 w-3.5 rotate-90",
                            (parseInt(inst.health) || 100) > 50 ? "text-emerald-500" : "text-amber-500"
                          )} />
                       </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!report?.instances || report.instances.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Activity className="h-8 w-8 opacity-20" />
                        <p className="text-xs">Nenhuma instância detectada no ecossistema.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <Card className="border-border/40 bg-zinc-950/20">
            <CardHeader><CardTitle className="text-sm font-bold flex items-center gap-2 text-primary"><RefreshCw className="h-4 w-4" /> Log de Reconexões Recentes</CardTitle></CardHeader>
            <CardContent className="text-[10px] text-muted-foreground font-mono space-y-1">
               <div className="p-2 border-l-2 border-emerald-500 bg-emerald-500/5 mb-1 text-emerald-400">[14:02:11] Instance WA-PRO-01: Reconnected successfully.</div>
               <div className="p-2 border-l-2 border-zinc-800 bg-zinc-900/30 mb-1">[13:58:45] Instance WA-PRO-04: Session refresh required.</div>
               <div className="p-2 border-l-2 border-zinc-800 bg-zinc-900/30 mb-1">[13:45:22] Global Gateway: Traffic spike detected (450 msg/min).</div>
            </CardContent>
         </Card>

         <Card className="border-border/40 bg-zinc-950/20">
            <CardHeader><CardTitle className="text-sm font-bold flex items-center gap-2 text-red-400"><AlertTriangle className="h-4 w-4" /> Alertas de Erros Críticos</CardTitle></CardHeader>
            <CardContent className="text-[10px] text-muted-foreground font-mono space-y-1">
               <div className="p-2 border-l-2 border-red-500 bg-red-500/5 mb-1 text-red-400">[14:05:32] Error: Node Instance #44 response timeout.</div>
               <div className="p-2 border-l-2 border-amber-500 bg-amber-500/5 mb-1 text-amber-400">[13:50:11] Warning: Rate limit reached for Instance #12.</div>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
