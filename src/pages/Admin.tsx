import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Hash, 
  TrendingUp, 
  DollarSign, 
  AlertCircle, 
  Calendar,
  Filter,
  BarChart3,
  ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { startOfMonth, endOfMonth, format, isBefore, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeLines: 0,
    monthlyRevenue: 0,
    commissionsPaid: 0,
    estimatedProfit: 0
  });
  const [topSellers, setTopSellers] = useState<any[]>([]);
  const [alerts, setAlerts] = useState({
    overduePayments: 0,
    inactiveUsers: 0
  });
  const [period, setPeriod] = useState("current_month");

  useEffect(() => {
    async function checkAdmin() {
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      
      if (profile?.role !== "admin") {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      setIsAdmin(true);
      fetchAdminData();
    }

    async function fetchAdminData() {
      setLoading(true);
      try {
        // Range de data
        const now = new Date();
        const start = period === "current_month" ? startOfMonth(now) : startOfMonth(subMonths(now, 1));
        const end = period === "current_month" ? endOfMonth(now) : endOfMonth(subMonths(now, 1));

        // 1. Total Usuários
        const { count: userCount } = await supabase
          .from("profiles")
          .select("*", { count: 'exact', head: true });

        // 2. Linhas Ativas
        const { count: lineCount } = await supabase
          .from("linhas")
          .select("*", { count: 'exact', head: true })
          .eq("status", "ativa");

        // 3. Faturamento Mês & Comissões
        const { data: payments } = await supabase
          .from("cobrancas")
          .select("valor, status, pago_em, is_primeira")
          .gte("pago_em", start.toISOString())
          .lte("pago_em", end.toISOString())
          .eq("status", "pago");

        const monthlyRevenue = payments?.reduce((acc, p) => acc + Number(p.valor), 0) || 0;
        
        // Simulação de lógica de comissão (baseada nas configurações default do sistema)
        // Primeira: 85, Recorrência: 20
        const commissionsPaid = payments?.reduce((acc, p) => {
          const comm = p.is_primeira ? 85 : 20;
          return acc + comm;
        }, 0) || 0;

        const estimatedProfit = monthlyRevenue - commissionsPaid;

        // 4. Top Vendedores
        const { data: sellers } = await supabase
          .from("profiles")
          .select("id, nome, email")
          .eq("role", "vendedor");

        const sellerMetrics = await Promise.all(
          (sellers || []).map(async (s) => {
            const { count: lines } = await supabase
              .from("linhas")
              .select("*", { count: 'exact', head: true })
              .eq("user_id", s.id)
              .eq("status", "ativa");

            const { data: p } = await supabase
              .from("cobrancas")
              .select("valor")
              .eq("user_id", s.id)
              .eq("status", "pago");
            
            const revenue = p?.reduce((acc, curr) => acc + Number(curr.valor), 0) || 0;

            return {
              nome: s.nome || s.email,
              linhas: lines || 0,
              ganho: revenue
            };
          })
        );

        setTopSellers(sellerMetrics.sort((a, b) => b.ganho - a.ganho).slice(0, 5));

        // 5. Alertas
        const { count: overdue } = await supabase
          .from("cobrancas")
          .select("*", { count: 'exact', head: true })
          .eq("status", "pendente")
          .lt("vencimento", now.toISOString().split('T')[0]);

        const { count: inactive } = await supabase
          .from("profiles")
          .select("*", { count: 'exact', head: true })
          .eq("status", "inativo");

        setStats({
          totalUsers: userCount || 0,
          activeLines: lineCount || 0,
          monthlyRevenue,
          commissionsPaid,
          estimatedProfit
        });

        setAlerts({
          overduePayments: overdue || 0,
          inactiveUsers: inactive || 0
        });

      } catch (error) {
        console.error("Erro no dashboard admin:", error);
        toast.error("Erro ao carregar dados administrativos");
      } finally {
        setLoading(false);
      }
    }

    checkAdmin();
  }, [user, period]);

  if (!isAdmin && !loading) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center space-y-4">
        <ShieldAlert className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold">Acesso Negado</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Esta área é restrita a administradores globais do sistema.
        </p>
      </div>
    );
  }

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Admin</h1>
          <p className="text-muted-foreground">Visão global da operação e saúde do negócio.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current_month">Mês Atual</SelectItem>
              <SelectItem value="last_month">Mês Anterior</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Usuários Totais</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Linhas Ativas</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeLines}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Faturamento</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Comissões</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.commissionsPaid)}</div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase text-primary">Lucro Estimado</CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(stats.estimatedProfit)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Top Vendedores */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Top Vendedores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Linhas Ativas</TableHead>
                  <TableHead className="text-right">Faturamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={3} className="text-center">Carregando...</TableCell></TableRow>
                ) : topSellers.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center">Nenhum dado disponível.</TableCell></TableRow>
                ) : (
                  topSellers.map((s, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{s.nome}</TableCell>
                      <TableCell>{s.linhas}</TableCell>
                      <TableCell className="text-right font-bold text-emerald-600">{formatCurrency(s.ganho)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Alertas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Alertas do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Cobranças Atrasadas</p>
                <p className="text-xs text-muted-foreground">Pagamentos pendentes após vencimento.</p>
              </div>
              <div className="text-2xl font-bold text-destructive">{alerts.overduePayments}</div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-4 dark:bg-amber-900/10 dark:border-amber-900/20">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Usuários Inativos</p>
                <p className="text-xs text-muted-foreground">Contas com status inativo no sistema.</p>
              </div>
              <div className="text-2xl font-bold text-amber-600">{alerts.inactiveUsers}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
