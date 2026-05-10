import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Users, TrendingUp, DollarSign, Activity, ChevronRight, LayoutDashboard, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function AdminDashboard() {
  const { user } = useAuth();
  const isAdmin = (user as any)?.role === 'admin';

  // Proteção de rota no frontend
  if (!user) return <Navigate to="/auth" />;
  if (!isAdmin) return <Navigate to="/dashboard" />;

  const { data: metrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ["admin-metrics"],
    queryFn: async () => {
      const { data, error } = await supabase.from("admin_mrr_consolidado").select("*");
      if (error) throw error;
      
      const totalMrr = data.reduce((acc, curr) => acc + Number(curr.mrr_atual), 0);
      const totalClientes = data.reduce((acc, curr) => acc + Number(curr.clientes_ativos), 0);
      const totalAfiliados = data.length;
      
      return { totalMrr, totalClientes, totalAfiliados, afiliados: data };
    },
  });

  const { data: chartData, isLoading: loadingChart } = useQuery({
    queryKey: ["admin-chart"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_mrr_historico", { p_meses: 6 });
      if (error) throw error;
      return data.map((d: any) => ({
        mes: new Date(d.mes).toLocaleDateString('pt-BR', { month: 'short' }),
        mrr: Number(d.mrr_total)
      }));
    },
  });

  if (loadingMetrics || loadingChart) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Master Admin</h1>
            <p className="text-muted-foreground">Visão consolidada de toda a operação multi-tenant</p>
          </div>
        </div>
      </header>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-3 w-3" /> MRR Total Rede
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(metrics?.totalMrr || 0)}</div>
            <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" /> +12% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
              <Users className="h-3 w-3" /> Clientes na Rede
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalClientes}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Base total de franqueados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
              <Activity className="h-3 w-3" /> Afiliados Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalAfiliados}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Usuários com base ativa</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
              <LayoutDashboard className="h-3 w-3" /> Ticket Médio Rede
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt((metrics?.totalMrr || 0) / (metrics?.totalClientes || 1))}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Média consolidada</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Evolução */}
      <Card>
        <CardHeader>
          <CardTitle>Crescimento MRR (6 meses)</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis dataKey="mes" axisLine={false} tickLine={false} fontSize={12} />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                formatter={(val: number) => [fmt(val), "MRR"]}
              />
              <Area type="monotone" dataKey="mrr" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorMrr)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabela de Afiliados */}
      <Card>
        <CardHeader>
          <CardTitle>Performance por Afiliado</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Afiliado</TableHead>
                <TableHead>Clientes Ativos</TableHead>
                <TableHead>MRR Gerado</TableHead>
                <TableHead>Último Acesso</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics?.afiliados.map((af) => (
                <TableRow key={af.afiliado_id}>
                  <TableCell>
                    <div className="font-medium">{af.afiliado_email}</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">ID: {af.afiliado_id.slice(0,8)}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{af.clientes_ativos}</Badge>
                  </TableCell>
                  <TableCell className="font-bold">{fmt(Number(af.mrr_atual))}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {af.ultimo_acesso ? new Date(af.ultimo_acesso).toLocaleDateString('pt-BR') : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <button className="p-2 hover:bg-muted rounded-full transition-colors">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
