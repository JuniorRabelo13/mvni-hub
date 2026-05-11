import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  LineChart, 
  Target, 
  Users, 
  DollarSign, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  ChevronRight
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Legend,
  ComposedChart,
  Line
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const MasterProjecoes = () => {
  const projectionData = [
    { name: "Jan", revenue: 450000, expansion: 400000, profit: 120000 },
    { name: "Fev", revenue: 520000, expansion: 450000, profit: 150000 },
    { name: "Mar", revenue: 610000, expansion: 500000, profit: 180000 },
    { name: "Abr", revenue: 750000, expansion: 600000, profit: 240000 },
    { name: "Mai", revenue: 890000, expansion: 700000, profit: 310000 },
    { name: "Jun", revenue: 1050000, expansion: 850000, profit: 380000 },
    { name: "Jul", revenue: 1250000, expansion: 1000000, profit: 460000 },
    { name: "Ago", revenue: 1480000, expansion: 1200000, profit: 550000 },
    { name: "Set", revenue: 1720000, expansion: 1400000, profit: 650000 },
    { name: "Out", revenue: 2100000, expansion: 1650000, profit: 800000 },
    { name: "Nov", revenue: 2450000, expansion: 1900000, profit: 950000 },
    { name: "Dez", revenue: 3000000, expansion: 2300000, profit: 1200000 },
  ];

  const churnData = [
    { month: "Jan", churn: 4.2 },
    { month: "Fev", churn: 3.8 },
    { month: "Mar", churn: 3.5 },
    { month: "Abr", churn: 3.1 },
    { month: "Mai", churn: 2.8 },
    { month: "Jun", churn: 2.5 },
  ];

  const kpis = [
    { 
      title: "Projeção Mensal (Dez)", 
      value: "R$ 3.0M", 
      icon: DollarSign, 
      trend: "+237%", 
      trendUp: true,
      color: "from-emerald-500/20 to-emerald-500/5" 
    },
    { 
      title: "Expansão de Rede", 
      value: "+450%", 
      icon: Users, 
      trend: "Exponencial", 
      trendUp: true,
      color: "from-blue-500/20 to-blue-500/5" 
    },
    { 
      title: "Churn Projetado", 
      value: "2.5%", 
      icon: TrendingDown, 
      trend: "-1.7%", 
      trendUp: true,
      color: "from-amber-500/20 to-amber-500/5" 
    },
    { 
      title: "Lucro Anual Est.", 
      value: "R$ 5.9M", 
      icon: Target, 
      trend: "Meta 2026", 
      trendUp: true,
      color: "from-purple-500/20 to-purple-500/5" 
    },
  ];

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Previsão Inteligente</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white italic uppercase">
            Projeções <span className="text-primary not-italic">Estratégicas</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">Cálculos baseados em IA para crescimento e escala 2026.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 border-white/10 hover:bg-white/5 h-12 px-6">
            <Calendar className="w-4 h-4" />
            Alterar Cenário
          </Button>
          <Button className="bg-primary hover:bg-primary/90 gap-2 h-12 px-6 font-bold shadow-lg shadow-primary/20">
            <BarChart3 className="w-4 h-4" />
            Exportar Board
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <Card key={i} className={`bg-gradient-to-br ${kpi.color} border-white/10 backdrop-blur-xl relative overflow-hidden group hover:scale-[1.02] transition-all duration-300`}>
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <kpi.icon className="w-24 h-24" />
            </div>
            <CardHeader className="pb-2">
              <p className="text-sm font-bold text-muted-foreground/80 uppercase tracking-tighter">{kpi.title}</p>
            </CardHeader>
            <CardContent>
              <h2 className="text-3xl font-black text-white mb-2">{kpi.value}</h2>
              <div className="flex items-center gap-2 text-xs">
                <Badge className={kpi.trendUp ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}>
                  {kpi.trendUp ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                  {kpi.trend}
                </Badge>
                <span className="text-muted-foreground/60 font-medium">vs. período anterior</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 bg-card/40 border-white/10 backdrop-blur-md">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl font-bold">Curva de Crescimento 2026</CardTitle>
                <CardDescription>Projeção de Faturamento vs Lucro Líquido</CardDescription>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-xs text-muted-foreground font-medium">Faturamento</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs text-muted-foreground font-medium">Lucro</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[450px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectionData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                    tickFormatter={(value) => `R$${value/1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                    itemStyle={{ fontWeight: 700 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#D4AF37" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorRev)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#10b981" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorProfit)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="bg-card/40 border-white/10 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-500" />
                Churn Rate (Previsão)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={churnData}>
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10 }}
                    />
                    <Tooltip 
                      cursor={{ fill: '#ffffff05' }}
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '8px' }}
                    />
                    <Bar dataKey="churn" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                <p className="text-xs text-red-400 font-medium leading-relaxed">
                  "Otimização em curso: A meta é reduzir o churn para <span className="font-bold underline">1.8%</span> até o Q3 através de automação de retenção."
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <Target className="w-12 h-12 text-primary/10" />
            </div>
            <CardHeader>
              <CardTitle className="text-xl font-bold">Resumo Executivo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Meta Anual 2026</span>
                  <span className="text-white font-bold">R$ 25.0M</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[35%] rounded-full shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
                </div>
                <p className="text-[10px] text-muted-foreground text-right italic">35% da meta atingida (Q1 Proj.)</p>
              </div>

              <div className="pt-4 border-t border-white/10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Oportunidade de Expansão</p>
                    <p className="text-sm font-bold text-white">+R$ 1.2M (Nova Rede)</p>
                  </div>
                  <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground/40" />
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <LineChart className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Escalabilidade IA</p>
                    <p className="text-sm font-bold text-white">Redução Custos Op. 15%</p>
                  </div>
                  <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground/40" />
                </div>
              </div>

              <Button className="w-full bg-white text-black hover:bg-slate-200 font-black h-12 uppercase tracking-tighter">
                Ver Plano de Ação Master
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MasterProjecoes;
