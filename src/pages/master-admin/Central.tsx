import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Activity, 
  DollarSign, 
  Users, 
  MessageSquare, 
  Cpu, 
  ShieldAlert, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  Zap,
  BarChart4
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const MasterCentral = () => {
  const chartData = [
    { time: "00:00", revenue: 4500, users: 120 },
    { time: "04:00", revenue: 3200, users: 85 },
    { time: "08:00", revenue: 8900, users: 450 },
    { time: "12:00", revenue: 12400, users: 890 },
    { time: "16:00", revenue: 15600, users: 1100 },
    { time: "20:00", revenue: 14200, users: 950 },
    { time: "23:59", revenue: 9800, users: 600 },
  ];

  const mainStats = [
    { label: "Receita Hoje", value: "R$ 64.400", trend: "+14%", trendUp: true, icon: DollarSign, color: "text-emerald-400" },
    { label: "Clientes Ativos", value: "12.840", trend: "+320", trendUp: true, icon: Users, color: "text-blue-400" },
    { label: "WhatsApps Online", value: "8.420", trend: "98.2%", trendUp: true, icon: MessageSquare, color: "text-emerald-500" },
    { label: "Inadimplência", value: "4.2%", trend: "-0.5%", trendUp: true, icon: AlertCircle, color: "text-red-400" },
  ];

  const infraHealth = [
    { name: "Edge Functions", status: "Operacional", load: 24, health: 100 },
    { name: "Database Engine", status: "Estável", load: 68, health: 100 },
    { name: "Workers Queue", status: "Processando", load: 45, health: 100 },
    { name: "Realtime Sync", status: "Operacional", load: 12, health: 100 },
  ];

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic flex items-center gap-3">
            <BarChart4 className="w-10 h-10 text-primary not-italic" />
            Centro <span className="text-primary not-italic">Executivo</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-lg font-medium">Controle estratégico e saúde global do ecossistema SaaS.</p>
        </div>
        <div className="flex gap-3">
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-4 py-2 gap-2 text-sm font-bold">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            SISTEMA 100% OPERACIONAL
          </Badge>
          <Button className="bg-white text-black hover:bg-slate-200 font-bold px-6">
            Relatório Board
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mainStats.map((stat, i) => (
          <Card key={i} className="bg-card/40 border-white/10 backdrop-blur-md hover:border-primary/30 transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                  <h2 className="text-3xl font-black text-white mt-1">{stat.value}</h2>
                </div>
                <div className={`p-3 rounded-2xl bg-white/5 ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <span className={`text-xs font-bold flex items-center ${stat.trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
                  {stat.trendUp ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                  {stat.trend}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">vs. ontem</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 bg-card/40 border-white/10 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold">Fluxo de Receita (24h)</CardTitle>
              <CardDescription>Monitoramento transacional em tempo real</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Receita</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevCentral" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                    tickFormatter={(value) => `R$${value/1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                    itemStyle={{ fontWeight: 800, color: '#D4AF37' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#D4AF37" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorRevCentral)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-card/40 border-white/10 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Saúde da Infraestrutura
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {infraHealth.map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-sm font-bold text-white">{item.name}</p>
                      <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {item.status}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-muted-foreground">{item.load}% Carga</span>
                  </div>
                  <Progress value={item.load} className="h-1.5 bg-white/5" indicatorClassName="bg-primary" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-red-500/5 border-red-500/20 backdrop-blur-md relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-12 h-12 text-red-500" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold text-red-400 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Alertas Críticos (03)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                <p className="text-xs text-white font-medium">Gateway PIX: Latência Alta (+5s)</p>
                <Clock className="w-3 h-3 ml-auto text-muted-foreground" />
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                <p className="text-xs text-white font-medium">Inadimplência Planos VIP subiu 1.2%</p>
                <Clock className="w-3 h-3 ml-auto text-muted-foreground" />
              </div>
              <Button variant="ghost" className="w-full text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300">
                Ver todos os incidentes
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/20 to-transparent border-primary/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-primary" />
                Workers & IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="text-center flex-1 border-r border-white/10">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Ativos</p>
                  <p className="text-2xl font-black text-white">42</p>
                </div>
                <div className="text-center flex-1 border-r border-white/10">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Fila</p>
                  <p className="text-2xl font-black text-white">128</p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Falhas</p>
                  <p className="text-2xl font-black text-emerald-400">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MasterCentral;
