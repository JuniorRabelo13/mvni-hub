import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Database, 
  HardDrive, 
  Radio, 
  Cpu, 
  Globe, 
  DollarSign, 
  TrendingUp,
  Zap,
  Server,
  Activity
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { cn } from "@/lib/utils";

// Mock data para visualização premium
const usageHistory = [
  { day: '01', db: 42, storage: 18, edge: 1200, api: 8500 },
  { day: '05', db: 48, storage: 22, edge: 1850, api: 10200 },
  { day: '10', db: 51, storage: 25, edge: 2100, api: 11800 },
  { day: '15', db: 55, storage: 28, edge: 2400, api: 13500 },
  { day: '20', day_lbl: '20', db: 58, storage: 31, edge: 2800, api: 15200 },
  { day: '25', db: 62, storage: 34, edge: 3200, api: 17800 },
  { day: '30', db: 67, storage: 38, edge: 3850, api: 19500 },
];

const costBreakdown = [
  { name: 'Database', cost: 89.50, color: '#10b981' },
  { name: 'Storage', cost: 42.30, color: '#3b82f6' },
  { name: 'Edge Functions', cost: 65.20, color: '#a855f7' },
  { name: 'Bandwidth', cost: 28.40, color: '#f59e0b' },
  { name: 'Realtime', cost: 15.80, color: '#ef4444' },
];

export default function MasterInfraestrutura() {
  const totalCost = costBreakdown.reduce((acc, curr) => acc + curr.cost, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Recursos & Custos</p>
          <h1 className="mt-1 text-3xl font-bold md:text-4xl">
            Infraestrutura <span className="text-gradient-gold">Cloud</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Monitoramento de recursos, consumo e projeção de custos operacionais.</p>
        </div>
        <Badge variant="outline" className="text-[10px] uppercase font-bold border-emerald-500/20 bg-emerald-500/10 text-emerald-500 gap-2">
          <Activity className="h-3 w-3" /> TODOS SERVIÇOS OPERACIONAIS
        </Badge>
      </header>

      {/* KPIs Premium */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-zinc-800 bg-gradient-to-br from-emerald-500/5 to-zinc-950/50 overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -translate-y-12 translate-x-12" />
          <CardHeader className="pb-2 relative">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <Database className="h-4 w-4 text-emerald-500" />
              </div>
              <span className="text-[9px] uppercase font-bold text-emerald-500">+12%</span>
            </div>
            <CardDescription className="text-[10px] uppercase font-bold pt-2">Database</CardDescription>
            <CardTitle className="text-2xl font-bold">6.8 GB</CardTitle>
            <p className="text-[10px] text-muted-foreground">de 8 GB disponíveis</p>
          </CardHeader>
          <CardContent className="relative">
            <Progress value={85} className="h-1.5" />
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-gradient-to-br from-blue-500/5 to-zinc-950/50 overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-12 translate-x-12" />
          <CardHeader className="pb-2 relative">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <HardDrive className="h-4 w-4 text-blue-500" />
              </div>
              <span className="text-[9px] uppercase font-bold text-blue-500">+8%</span>
            </div>
            <CardDescription className="text-[10px] uppercase font-bold pt-2">Storage</CardDescription>
            <CardTitle className="text-2xl font-bold">38 GB</CardTitle>
            <p className="text-[10px] text-muted-foreground">de 100 GB alocados</p>
          </CardHeader>
          <CardContent className="relative">
            <Progress value={38} className="h-1.5" />
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-gradient-to-br from-purple-500/5 to-zinc-950/50 overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -translate-y-12 translate-x-12" />
          <CardHeader className="pb-2 relative">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <Cpu className="h-4 w-4 text-purple-500" />
              </div>
              <span className="text-[9px] uppercase font-bold text-purple-500">+24%</span>
            </div>
            <CardDescription className="text-[10px] uppercase font-bold pt-2">Edge Functions</CardDescription>
            <CardTitle className="text-2xl font-bold">3.85M</CardTitle>
            <p className="text-[10px] text-muted-foreground">invocações no mês</p>
          </CardHeader>
          <CardContent className="relative">
            <Progress value={64} className="h-1.5" />
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-zinc-950/50 overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -translate-y-12 translate-x-12" />
          <CardHeader className="pb-2 relative">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <span className="text-[9px] uppercase font-bold text-primary">PROJEÇÃO</span>
            </div>
            <CardDescription className="text-[10px] uppercase font-bold pt-2">Custo Mensal</CardDescription>
            <CardTitle className="text-2xl font-bold text-gradient-gold">${totalCost.toFixed(2)}</CardTitle>
            <p className="text-[10px] text-muted-foreground">estimado até final do mês</p>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex items-center gap-1 text-[10px] text-emerald-500">
              <TrendingUp className="h-3 w-3" /> -4.2% vs último mês
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos principais */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-zinc-800 bg-zinc-950/50 lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Consumo de Recursos</CardTitle>
                <CardDescription className="text-xs">Últimos 30 dias de utilização</CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px] border-zinc-800">MENSAL</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={usageHistory}>
                <defs>
                  <linearGradient id="colorDb" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorStorage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.3} />
                <XAxis dataKey="day" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
                  labelStyle={{ color: '#a1a1aa', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="db" stroke="#10b981" strokeWidth={2} fill="url(#colorDb)" name="DB (GB)" />
                <Area type="monotone" dataKey="storage" stroke="#3b82f6" strokeWidth={2} fill="url(#colorStorage)" name="Storage (GB)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-950/50">
          <CardHeader>
            <CardTitle className="text-lg">Distribuição de Custos</CardTitle>
            <CardDescription className="text-xs">Breakdown operacional</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {costBreakdown.map((item) => {
              const pct = (item.cost / totalCost) * 100;
              return (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <span className="font-mono font-bold">${item.cost.toFixed(2)}</span>
                  </div>
                  <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all" 
                      style={{ width: `${pct}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              );
            })}
            <div className="pt-4 mt-4 border-t border-zinc-800 flex justify-between items-baseline">
              <span className="text-xs uppercase font-bold text-muted-foreground">Total</span>
              <span className="text-2xl font-bold text-gradient-gold">${totalCost.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edge Functions + API */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-zinc-800 bg-zinc-950/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <Zap className="h-4 w-4 text-purple-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Edge Functions</CardTitle>
                  <CardDescription className="text-xs">Invocações por período</CardDescription>
                </div>
              </div>
              <span className="text-2xl font-bold text-purple-500">3.85M</span>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={usageHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.3} />
                <XAxis dataKey="day" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
                  labelStyle={{ color: '#a1a1aa', fontSize: '11px' }}
                />
                <Bar dataKey="edge" fill="#a855f7" radius={[4, 4, 0, 0]} name="Invocações" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-950/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Globe className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Uso de API</CardTitle>
                  <CardDescription className="text-xs">Requests REST + GraphQL</CardDescription>
                </div>
              </div>
              <span className="text-2xl font-bold text-amber-500">19.5K</span>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={usageHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.3} />
                <XAxis dataKey="day" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
                  labelStyle={{ color: '#a1a1aa', fontSize: '11px' }}
                />
                <Line type="monotone" dataKey="api" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 3 }} name="Requests" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detalhes de Serviços */}
      <Card className="border-zinc-800 bg-zinc-950/50">
        <CardHeader>
          <CardTitle className="text-lg">Detalhamento de Serviços</CardTitle>
          <CardDescription className="text-xs">Status e métricas em tempo real</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Database, name: 'PostgreSQL', metric: '6.8 GB', detail: '125 conexões ativas', status: 'healthy', color: 'emerald' },
              { icon: HardDrive, name: 'Object Storage', metric: '38 GB', detail: '2.4K arquivos', status: 'healthy', color: 'blue' },
              { icon: Radio, name: 'Realtime', metric: '482 ch', detail: '1.2K subs ativas', status: 'healthy', color: 'pink' },
              { icon: Cpu, name: 'Edge Runtime', metric: '142ms', detail: 'latência média', status: 'healthy', color: 'purple' },
              { icon: Globe, name: 'CDN / Bandwidth', metric: '142 GB', detail: 'transferência mensal', status: 'healthy', color: 'amber' },
              { icon: Server, name: 'Auth Service', metric: '8.2K', detail: 'logins esta semana', status: 'healthy', color: 'emerald' },
            ].map((svc) => (
              <div key={svc.name} className="p-4 rounded-lg border border-zinc-800/50 bg-zinc-900/20 hover:border-zinc-700 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className={cn("p-2 rounded-lg border", 
                    `bg-${svc.color}-500/10 border-${svc.color}-500/20`
                  )}>
                    <svc.icon className={cn("h-4 w-4", `text-${svc.color}-500`)} />
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    HEALTHY
                  </div>
                </div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{svc.name}</p>
                <p className="text-xl font-bold mt-1">{svc.metric}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{svc.detail}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}