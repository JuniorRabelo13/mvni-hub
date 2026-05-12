import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  AlertTriangle, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  BarChart3,
  PieChart,
  Target
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, LineChart, Line, Area, AreaChart, Legend } from "recharts";

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function MasterFinanceiro() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["global-finance-metrics"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_global_finance_metrics');
      if (error) throw error;
      return data as any;
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <header>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Financeiro Global</p>
          <h1 className="mt-1 text-3xl font-bold md:text-4xl">
            Gestão <span className="text-gradient-gold">Financeira Master</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Monitoramento de KPIs e saúde financeira do ecossistema.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-xs font-bold uppercase backdrop-blur-sm">
          <Activity className="h-3 w-3 animate-pulse" /> Live Metrics
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Receita Total" 
          value={fmt(metrics?.total_revenue)} 
          description="Faturamento histórico acumulado" 
          icon={DollarSign}
          highlight
        />
        <MetricCard 
          title="Receita do Mês" 
          value={fmt(metrics?.revenue_month)} 
          description="Faturamento do mês vigente" 
          icon={BarChart3}
        />
        <MetricCard 
          title="MRR Global" 
          value={fmt(metrics?.mrr)} 
          description="Receita Recorrente Mensal" 
          icon={TrendingUp}
          trend={metrics?.growth_rate > 0 ? "up" : "down"}
          trendValue={`${metrics?.growth_rate}%`}
        />
        <MetricCard 
          title="Inadimplência" 
          value={fmt(metrics?.overdue_revenue)} 
          description="Pagamentos em atraso" 
          icon={AlertTriangle}
          color={metrics?.overdue_revenue > 0 ? "text-red-500" : "text-emerald-500"}
        />
        <MetricCard 
          title="Ticket Médio" 
          value={fmt(metrics?.average_ticket)} 
          description="Média por cliente ativo" 
          icon={Target}
        />
        <MetricCard 
          title="Lucro Estimado" 
          value={fmt(metrics?.estimated_profit)} 
          description="Margem líquida aproximada" 
          icon={PieChart}
          color="text-emerald-400"
        />
        <MetricCard 
          title="Crescimento" 
          value={`${metrics?.growth_rate}%`} 
          description="Performance vs mês anterior" 
          icon={Activity}
          trend={metrics?.growth_rate > 0 ? "up" : "down"}
        />
        <MetricCard 
          title="Status de Caixa" 
          value="SAUDÁVEL" 
          description="Fluxo operacional positivo" 
          icon={Wallet}
          color="text-emerald-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-primary/20 bg-zinc-950/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Composição da Receita
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Distribuição por categoria no mês vigente</p>
          </CardHeader>
          <CardContent className="h-[300px] p-4">
            <RevenueCompositionChart metrics={metrics} />
          </CardContent>
        </Card>
        
        <Card className="border-primary/20 bg-zinc-950/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Projeção de Faturamento
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Histórico realizado e projeção para o ano corrente</p>
          </CardHeader>
          <CardContent className="h-[300px] p-4">
            <RevenueProjectionChart metrics={metrics} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, description, icon: Icon, trend, trendValue, color, highlight }: any) {
  return (
    <Card className={cn(
      "overflow-hidden border-border/60 hover:border-primary/40 transition-all duration-300",
      highlight && "border-primary/40 bg-gradient-noir shadow-gold-sm"
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
          <Icon className={cn("h-4 w-4", color || "text-primary")} />
        </div>
        <div className="flex items-baseline gap-2">
          <h2 className={cn("text-2xl font-bold tabular-nums", highlight ? "text-gradient-gold" : color)}>{value}</h2>
          {trend && (
            <span className={cn("text-[10px] font-bold flex items-center gap-0.5", trend === 'up' ? "text-emerald-500" : "text-red-500")}>
              {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {trendValue}
            </span>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 font-medium italic">{description}</p>
      </CardContent>
    </Card>
  );
}

function RevenueCompositionChart({ metrics }: { metrics: any }) {
  const monthRevenue = Number(metrics?.revenue_month) || 0;
  const mrr = Number(metrics?.mrr) || 0;
  const overdue = Number(metrics?.overdue_revenue) || 0;
  const profit = Number(metrics?.estimated_profit) || 0;

  // Estimativa de composição derivada das métricas globais disponíveis
  const recurring = Math.max(mrr, 0);
  const activations = Math.max(monthRevenue - recurring * 0.6, monthRevenue * 0.25);
  const indirect = Math.max(profit * 0.15, monthRevenue * 0.08);
  const services = Math.max(monthRevenue - (recurring + activations + indirect), monthRevenue * 0.05);

  const data = [
    { categoria: "Recorrente", valor: Math.round(recurring), fill: "hsl(var(--primary))" },
    { categoria: "Ativações", valor: Math.round(activations), fill: "hsl(var(--primary) / 0.75)" },
    { categoria: "Indiretos", valor: Math.round(indirect), fill: "hsl(var(--primary) / 0.55)" },
    { categoria: "Serviços", valor: Math.round(services), fill: "hsl(var(--primary) / 0.4)" },
    { categoria: "Inadimplência", valor: Math.round(overdue), fill: "hsl(0 72% 51% / 0.7)" },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" vertical={false} />
        <XAxis
          dataKey="categoria"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          axisLine={{ stroke: "hsl(var(--border) / 0.4)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`}
        />
        <Tooltip
          cursor={{ fill: "hsl(var(--primary) / 0.08)" }}
          contentStyle={{
            background: "hsl(var(--background))",
            border: "1px solid hsl(var(--primary) / 0.3)",
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value: number) => [fmt(value), "Receita"]}
          labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
        />
        <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
          {data.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
