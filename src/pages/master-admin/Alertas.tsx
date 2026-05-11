import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertTriangle, 
  TrendingDown, 
  MessageSquareOff, 
  Cpu, 
  CreditCard, 
  Zap,
  RefreshCw,
  Bell,
  CheckCircle2,
  Clock,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function MasterAlertas() {
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const { data: alerts, isLoading, refetch } = useQuery({
    queryKey: ["master-critical-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_master_critical_alerts');
      if (error) throw error;
      return data as any[];
    },
    refetchInterval: 30000 // Atualiza a cada 30 segundos
  });

  const filteredAlerts = alerts?.filter(alert => 
    severityFilter === "all" || alert.severity === severityFilter
  );

  const getSeverityConfig = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critica':
        return {
          label: "Crítica",
          color: "text-red-500 bg-red-500/10 border-red-500/20",
          iconColor: "text-red-500",
          pulse: "animate-pulse"
        };
      case 'media':
        return {
          label: "Média",
          color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
          iconColor: "text-amber-500",
          pulse: ""
        };
      case 'baixa':
        return {
          label: "Baixa",
          color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
          iconColor: "text-blue-500",
          pulse: ""
        };
      default:
        return {
          label: "Informativa",
          color: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20",
          iconColor: "text-zinc-500",
          pulse: ""
        };
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'financeiro': return TrendingDown;
      case 'infraestrutura': return Cpu;
      case 'whatsapp': return MessageSquareOff;
      case 'automacao': return Zap;
      default: return AlertTriangle;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Monitoramento de Saúde</p>
          <h1 className="mt-1 text-3xl font-bold md:text-4xl">
            Alertas <span className="text-gradient-gold">Críticos</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Gestão de incidentes e anomalias em tempo real no ecossistema.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-900/50 p-1 rounded-lg border border-zinc-800">
            {['all', 'critica', 'media', 'baixa'].map((s) => (
              <button
                key={s}
                onClick={() => setSeverityFilter(s)}
                className={cn(
                  "px-3 py-1.5 text-[10px] uppercase font-bold rounded-md transition-all",
                  severityFilter === s 
                    ? "bg-zinc-800 text-primary shadow-sm" 
                    : "text-muted-foreground hover:text-white"
                )}
              >
                {s === 'all' ? 'Todos' : s}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2 border-zinc-800">
            <RefreshCw className="h-3.5 w-3.5" /> Atualizar
          </Button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredAlerts?.map((alert) => {
          const severity = getSeverityConfig(alert.severity);
          const Icon = getCategoryIcon(alert.category);
          
          return (
            <Card key={alert.id} className="border-zinc-800 bg-zinc-950/50 backdrop-blur-sm overflow-hidden group hover:border-primary/20 transition-all">
              <div className={cn("h-1 w-full", severity.color.split(' ')[1].replace('/10', ''))} />
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className={cn("p-2 rounded-lg", severity.color)}>
                    <Icon className={cn("h-5 w-5", severity.pulse)} />
                  </div>
                  <Badge variant="outline" className={cn("text-[10px] uppercase font-bold", severity.color)}>
                    {severity.label}
                  </Badge>
                </div>
                <CardTitle className="text-lg mt-3 flex items-center gap-2">
                  {alert.title}
                </CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  {alert.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2 pb-4">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    {new Date(alert.created_at).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Bell className="h-3 w-3" />
                    {alert.category.toUpperCase()}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-zinc-900 flex gap-2">
                  <Button variant="outline" size="sm" className="w-full text-[10px] h-8 border-zinc-800 hover:bg-zinc-900">
                    INVESTIGAR
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full text-[10px] h-8 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10">
                    RESOLVER
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {(!filteredAlerts || filteredAlerts.length === 0) && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-xl bg-zinc-950/20">
            <CheckCircle2 className="h-12 w-12 text-emerald-500/20 mb-3" />
            <h3 className="text-lg font-medium text-muted-foreground">Tudo limpo por aqui!</h3>
            <p className="text-sm text-muted-foreground/60">Nenhum alerta crítico detectado no momento.</p>
          </div>
        )}
      </div>
    </div>
  );
}