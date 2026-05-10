import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart4, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Wallet, 
  AlertTriangle, 
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function MasterDashboard() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["global-metrics"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_global_metrics');
      if (error) throw error;
      return data as any;
    }
  });

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-40 w-full" /><div className="grid grid-cols-4 gap-4"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div></div>;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Centro de Comando Master</h1>
          <p className="text-muted-foreground">Visão 360º de toda a operação do SaaS.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-xs font-bold uppercase">
          <Activity className="h-4 w-4" /> Live Operation
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="MRR Global" 
          value={fmt(metrics?.mrr)} 
          description="+12.5% em relação ao mês anterior" 
          icon={TrendingUp}
          trend="up"
        />
        <MetricCard 
          title="Receita Total" 
          value={fmt(metrics?.total_revenue)} 
          description="Desde o início da operação" 
          icon={Wallet}
        />
        <MetricCard 
          title="Clientes Ativos" 
          value={metrics?.active_clients} 
          description="Base total do ecossistema" 
          icon={Users}
        />
        <MetricCard 
          title="Inadimplência" 
          value={fmt(metrics?.overdue_revenue)} 
          description="Atrasos superiores a 24h" 
          icon={AlertTriangle}
          trend="down"
          color="text-red-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Performance Financeira</CardTitle></CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg m-4">
            Gráfico de Projeção Financeira (BI Master)
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader><CardTitle>Alertas Críticos</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <AlertItem title="Falha de Webhook" message="Instância #WA-04 desconectada." severity="critical" />
              <AlertItem title="Saque Pendente" message="R$ 1.250,00 aguardando aprovação." severity="warning" />
              <AlertItem title="Novos Afiliados" message="5 novos parceiros na última hora." severity="info" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, description, icon: Icon, trend, color }: any) {
  return (
    <Card className="overflow-hidden border-border/60 hover:border-primary/40 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <Icon className={cn("h-4 w-4", color || "text-muted-foreground")} />
        </div>
        <div className="flex items-baseline gap-2">
          <h2 className={cn("text-2xl font-bold tabular-nums", color)}>{value}</h2>
          {trend && (
            <span className={cn("text-[10px] font-bold flex items-center", trend === 'up' ? "text-emerald-500" : "text-red-500")}>
              {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function AlertItem({ title, message, severity }: any) {
  const colors: any = {
    critical: "bg-red-500",
    warning: "bg-amber-500",
    info: "bg-blue-500"
  };
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/40">
      <div className={cn("h-2 w-2 mt-1.5 rounded-full shrink-0", colors[severity])} />
      <div>
        <p className="text-sm font-bold">{title}</p>
        <p className="text-xs text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
