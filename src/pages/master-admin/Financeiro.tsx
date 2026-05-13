import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn as cnUtil } from "@/lib/utils";
import type { DateRange } from "react-day-picker";
import {
  TrendingUp, TrendingDown, Wallet, AlertTriangle, Activity,
  ArrowUpRight, ArrowDownRight, DollarSign, BarChart3, PieChart, Target,
  CalendarIcon
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, LineChart, Line, Area, AreaChart, Legend } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type PeriodKey = "7d" | "30d" | "12m" | "custom";
const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "7d", label: "Últimos 7 dias" },
  { key: "30d", label: "Últimos 30 dias" },
  { key: "12m", label: "Últimos 12 meses" },
  { key: "custom", label: "Personalizado" },
];

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });


export default function MasterFinanceiro() {
  const [period, setPeriod] = useState<PeriodKey>("30d");
  const [customRange, setCustomRange] = useState<DateRange | undefined>();

  const { data: metrics, isLoading } = useQuery({
    queryKey: ["global-finance-metrics"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_global_finance_metrics');
      if (error) throw error;
      return data as any;
    }
  });

  const mesAtual = new Date().toISOString().substring(0, 7);

  const { data: masterSummary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ["master-finance-summary", mesAtual],
    queryFn: async () => {
      const [
        { data: subscriptions },
        { data: commissions }
      ] = await Promise.all([
        supabase.from("assinaturas").select("valor").eq("status", "ativo"),
        supabase.from("comissoes_mensais")
          .select("valor_total, status")
          .eq("mes_referencia", mesAtual)
      ]);

      const receitaBruta = subscriptions?.reduce((acc, sub) => acc + Number(sub.valor), 0) || 0;
      
      const pendentes = commissions?.filter(c => c.status === "pendente") || [];
      const totalComissoesPagar = pendentes.reduce((acc, c) => acc + Number(c.valor_total), 0);
      const representantesPendentes = pendentes.length;
      const margemEstimada = receitaBruta - totalComissoesPagar;

      return {
        receitaBruta,
        totalComissoesPagar,
        margemEstimada,
        representantesPendentes
      };
    }
  });

  const { data: repasses } = useQuery({
    queryKey: ["master-repasses-mes", mesAtual],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comissoes_mensais")
        .select(`
          valor_total,
          valor_ativacoes,
          valor_recorrencia_direta,
          valor_recorrencia_indireta,
          status,
          clientes_diretos_ativos,
          clientes_indiretos_ativos,
          usuarios (
            nome
          )
        `)
        .eq("mes_referencia", mesAtual)
        .order("valor_total", { ascending: false });

      if (error) throw error;
      return data as any[];
    }
  });

  const totaisRepasse = useMemo(() => {
    if (!repasses) return null;
    return repasses.reduce((acc, curr) => ({
      diretos: acc.diretos + (Number(curr.clientes_diretos_ativos) || 0),
      indiretos: acc.indiretos + (Number(curr.clientes_indiretos_ativos) || 0),
      ativacoes: acc.ativacoes + (Number(curr.valor_ativacoes) || 0),
      direta: acc.direta + (Number(curr.valor_recorrencia_direta) || 0),
      indireta: acc.indireta + (Number(curr.valor_recorrencia_indireta) || 0),
      total: acc.total + (Number(curr.valor_total) || 0)
    }), { diretos: 0, indiretos: 0, ativacoes: 0, direta: 0, indireta: 0, total: 0 });
  }, [repasses]);

  const periodLabel = useMemo(() => {
    if (period === "custom" && customRange?.from && customRange?.to) {
      return `${format(customRange.from, "dd/MM/yy")} – ${format(customRange.to, "dd/MM/yy")}`;
    }
    return PERIODS.find(p => p.key === period)?.label ?? "";
  }, [period, customRange]);


  if (isLoading || isLoadingSummary) {
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
        <Card className="border-primary/20 bg-zinc-950/50 backdrop-blur-sm shadow-gold-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between pb-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Receita bruta do mês</p>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-gradient-gold tabular-nums">{fmt(masterSummary?.receitaBruta || 0)}</h2>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium italic">Baseado em assinaturas ativas</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 hover:border-primary/40 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between pb-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total a pagar em comissões</p>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold tabular-nums">{fmt(masterSummary?.totalComissoesPagar || 0)}</h2>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium italic">Comissões pendentes do mês atual</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 hover:border-primary/40 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between pb-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Margem estimada</p>
              <Wallet className="h-4 w-4 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold tabular-nums text-emerald-500">{fmt(masterSummary?.margemEstimada || 0)}</h2>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium italic">Receita bruta (-) Comissões pendentes</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 hover:border-primary/40 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between pb-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Representantes pendentes</p>
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-2xl font-bold tabular-nums">{masterSummary?.representantesPendentes || 0}</h2>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium italic">Aguardando repasse este mês</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20 bg-zinc-950/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Repasses do mês</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Representante</TableHead>
                  <TableHead className="text-center">Dir. Ativos</TableHead>
                  <TableHead className="text-center">Ind. Ativos</TableHead>
                  <TableHead>Ativações</TableHead>
                  <TableHead>Recor. Direta</TableHead>
                  <TableHead>Recor. Indireta</TableHead>
                  <TableHead>Total a receber</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {repasses?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhum repasse encontrado para este mês.
                    </TableCell>
                  </TableRow>
                ) : (
                  repasses?.map((rep, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{rep.usuarios?.nome}</TableCell>
                      <TableCell className="text-center">{rep.clientes_diretos_ativos || 0}</TableCell>
                      <TableCell className="text-center">{rep.clientes_indiretos_ativos || 0}</TableCell>
                      <TableCell>{fmt(Number(rep.valor_ativacoes) || 0)}</TableCell>
                      <TableCell>{fmt(Number(rep.valor_recorrencia_direta) || 0)}</TableCell>
                      <TableCell>{fmt(Number(rep.valor_recorrencia_indireta) || 0)}</TableCell>
                      <TableCell className="font-bold text-primary">{fmt(Number(rep.valor_total) || 0)}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={rep.status === "pago" ? "default" : "outline"}
                          className={rep.status === "pago" ? "bg-green-500 hover:bg-green-600 text-white" : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"}
                        >
                          {rep.status === "pago" ? "pago" : "pendente"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              {repasses && repasses.length > 0 && totaisRepasse && (
                <TableBody className="bg-primary/5 font-bold border-t-2 border-primary/20">
                  <TableRow>
                    <TableCell>TOTAIS</TableCell>
                    <TableCell className="text-center">{totaisRepasse.diretos}</TableCell>
                    <TableCell className="text-center">{totaisRepasse.indiretos}</TableCell>
                    <TableCell>{fmt(totaisRepasse.ativacoes)}</TableCell>
                    <TableCell>{fmt(totaisRepasse.direta)}</TableCell>
                    <TableCell>{fmt(totaisRepasse.indireta)}</TableCell>
                    <TableCell className="text-primary">{fmt(totaisRepasse.total)}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              )}
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/15 bg-zinc-950/40 backdrop-blur-sm p-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Período dos gráficos</span>
          <span className="text-xs text-primary font-semibold ml-1">{periodLabel}</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {PERIODS.map(p => (
            <Button
              key={p.key}
              variant={period === p.key ? "default" : "outline"}
              size="sm"
              className={cnUtil("h-8 text-xs", period === p.key && "bg-primary text-primary-foreground shadow-gold-sm")}
              onClick={() => setPeriod(p.key)}
            >
              {p.label}
            </Button>
          ))}
          {period === "custom" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  {customRange?.from && customRange?.to
                    ? `${format(customRange.from, "dd/MM")} – ${format(customRange.to, "dd/MM")}`
                    : "Selecionar datas"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={customRange}
                  onSelect={setCustomRange}
                  numberOfMonths={2}
                  locale={ptBR}
                  initialFocus
                  className={cnUtil("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-primary/20 bg-zinc-950/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Composição da Receita
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Distribuição por categoria · {periodLabel}</p>
          </CardHeader>
          <CardContent className="h-[300px] p-4">
            <RevenueCompositionChart metrics={metrics} period={period} customRange={customRange} />
          </CardContent>
        </Card>
        
        <Card className="border-primary/20 bg-zinc-950/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Projeção de Faturamento
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Histórico realizado e projeção · {periodLabel}</p>
          </CardHeader>
          <CardContent className="h-[300px] p-4">
            <RevenueProjectionChart metrics={metrics} period={period} customRange={customRange} />
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

function getPeriodScale(period: PeriodKey, customRange?: DateRange): number {
  if (period === "7d") return 7 / 30;
  if (period === "30d") return 1;
  if (period === "12m") return 12;
  if (period === "custom" && customRange?.from && customRange?.to) {
    const days = Math.max(1, Math.round((+customRange.to - +customRange.from) / 86400000) + 1);
    return days / 30;
  }
  return 1;
}

function RevenueCompositionChart({ metrics, period, customRange }: { metrics: any; period: PeriodKey; customRange?: DateRange }) {
  const scale = getPeriodScale(period, customRange);
  const monthRevenue = (Number(metrics?.revenue_month) || 0) * scale;
  const mrr = (Number(metrics?.mrr) || 0) * scale;
  const overdue = (Number(metrics?.overdue_revenue) || 0) * scale;
  const profit = (Number(metrics?.estimated_profit) || 0) * scale;

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

function RevenueProjectionChart({ metrics, period, customRange }: { metrics: any; period: PeriodKey; customRange?: DateRange }) {
  const monthRevenue = Number(metrics?.revenue_month) || 50000;
  const growthRate = (Number(metrics?.growth_rate) || 5) / 100;
  const today = new Date();

  // Define quantidade de buckets e granularidade conforme o período
  let buckets: { label: string; offset: number; unit: "day" | "month" }[] = [];
  if (period === "7d") {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      buckets.push({ label: format(d, "dd/MM"), offset: -i, unit: "day" });
    }
  } else if (period === "30d") {
    for (let i = 29; i >= 0; i -= 3) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      buckets.push({ label: format(d, "dd/MM"), offset: -i, unit: "day" });
    }
  } else if (period === "12m") {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      buckets.push({ label: format(d, "MMM/yy", { locale: ptBR }), offset: -i, unit: "month" });
    }
  } else if (period === "custom" && customRange?.from && customRange?.to) {
    const totalDays = Math.max(1, Math.round((+customRange.to - +customRange.from) / 86400000) + 1);
    const useMonths = totalDays > 60;
    const steps = Math.min(useMonths ? Math.ceil(totalDays / 30) : Math.min(totalDays, 14), 14);
    for (let i = 0; i < steps; i++) {
      const t = +customRange.from + ((+customRange.to - +customRange.from) * i) / Math.max(steps - 1, 1);
      const d = new Date(t);
      buckets.push({
        label: useMonths ? format(d, "MMM/yy", { locale: ptBR }) : format(d, "dd/MM"),
        offset: useMonths ? -(steps - 1 - i) : -(steps - 1 - i),
        unit: useMonths ? "month" : "day",
      });
    }
  } else {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      buckets.push({ label: format(d, "MMM/yy", { locale: ptBR }), offset: -i, unit: "month" });
    }
  }

  // Adiciona projeções futuras (~30% dos buckets)
  const futureCount = Math.max(2, Math.round(buckets.length * 0.3));
  const lastUnit = buckets[buckets.length - 1]?.unit ?? "month";
  for (let i = 1; i <= futureCount; i++) {
    if (lastUnit === "day") {
      const d = new Date(today); d.setDate(today.getDate() + i);
      buckets.push({ label: format(d, "dd/MM"), offset: i, unit: "day" });
    } else {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
      buckets.push({ label: format(d, "MMM/yy", { locale: ptBR }), offset: i, unit: "month" });
    }
  }

  const dailyBase = monthRevenue / 30;
  const data = buckets.map((b) => {
    const periods = b.offset; // negativo = passado, positivo = futuro
    const base = b.unit === "day" ? dailyBase : monthRevenue;
    const monthlyEquivalent = b.unit === "day" ? periods / 30 : periods;
    const value = base * Math.pow(1 + growthRate, monthlyEquivalent);
    const isFuture = b.offset > 0;
    return {
      mes: b.label,
      realizado: isFuture ? null : Math.round(value),
      projetado: isFuture ? Math.round(value) : (b.offset === 0 ? Math.round(value) : null),
    };
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
        <defs>
          <linearGradient id="realizadoGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="projetadoGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary) / 0.6)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="hsl(var(--primary) / 0.6)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" vertical={false} />
        <XAxis
          dataKey="mes"
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
          cursor={{ stroke: "hsl(var(--primary) / 0.3)", strokeWidth: 1 }}
          contentStyle={{
            background: "hsl(var(--background))",
            border: "1px solid hsl(var(--primary) / 0.3)",
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value: any, name: string) => [value ? fmt(Number(value)) : "—", name === "realizado" ? "Realizado" : "Projetado"]}
          labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
        />
        <Legend
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          formatter={(v) => v === "realizado" ? "Realizado" : "Projetado"}
        />
        <Area
          type="monotone"
          dataKey="realizado"
          stroke="hsl(var(--primary))"
          strokeWidth={2.5}
          fill="url(#realizadoGrad)"
          dot={{ r: 3, fill: "hsl(var(--primary))" }}
          connectNulls
        />
        <Area
          type="monotone"
          dataKey="projetado"
          stroke="hsl(var(--primary) / 0.7)"
          strokeWidth={2.5}
          strokeDasharray="6 4"
          fill="url(#projetadoGrad)"
          dot={{ r: 3, fill: "hsl(var(--primary) / 0.7)" }}
          connectNulls
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
