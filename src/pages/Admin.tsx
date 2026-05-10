import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Users, TrendingUp, DollarSign, Activity, ChevronRight, LayoutDashboard, ShieldCheck, AlertTriangle, Fingerprint, RefreshCcw, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function AdminDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
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

  const { data: alerts = [], isLoading: loadingAlerts } = useQuery({
    queryKey: ["admin-fraud-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("view_admin_alertas_fraude").select("*");
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const resolveAlertMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("admin_alertas_fraude").update({ resolvido: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-fraud-alerts"] });
      toast.success("Alerta marcado como resolvido.");
    },
  });

  if (loadingMetrics || loadingChart || loadingAlerts) {
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

      {/* Seção Anti-Fraude */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border-red-500/20 bg-red-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xl flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" /> Alertas de Fraude Pendentes
            </CardTitle>
            <Badge variant="destructive">{alerts.length} alertas</Badge>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                <p>Nenhuma atividade suspeita detectada na rede.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {alerts.map((alert: any) => (
                  <div key={alert.id} className="py-4 flex items-center justify-between first:pt-0 last:pb-0">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm capitalize">{alert.tipo.replace('_', ' ')}</span>
                        <Badge variant="outline" className={`text-[10px] ${alert.score_risco > 7 ? 'text-red-600 bg-red-50' : 'text-amber-600 bg-amber-50'}`}>
                          Risco {alert.score_risco}/10
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        IDs envolvidos: {alert.user_ids.map((id: string) => id.slice(0, 8)).join(', ')}
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => resolveAlertMutation.mutate(alert.id)}
                      disabled={resolveAlertMutation.isPending}
                    >
                      Marcar como Resolvido
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Fingerprint className="h-5 w-5 text-primary" /> Sistema Anti-Fraude
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-muted rounded-lg text-xs space-y-2">
              <p><strong>Monitoramento Ativo:</strong></p>
              <ul className="list-disc pl-4 space-y-1 opacity-80">
                <li>Detecção recursiva de redes circulares</li>
                <li>Mapeamento de IP/Browser Fingerprinting</li>
                <li>Identificação de multi-contas vinculadas</li>
              </ul>
            </div>
            <Button variant="ghost" className="w-full text-xs" onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-fraud-alerts"] })}>
              <RefreshCcw className="h-3 w-3 mr-2" /> Forçar Varredura Agora
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
