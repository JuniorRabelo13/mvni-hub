import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, Filter, TrendingUp, Wallet, Clock, Users, ArrowUpRight, ArrowDownRight, Award, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { QueryError } from "@/components/QueryError";

const MasterComissoes = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const mesAtual = format(new Date(), "yyyy-MM");

  const { data: commissionsData, isLoading, error: queryError, refetch } = useQuery({
    queryKey: ["master-commissions-data", mesAtual],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comissoes_mensais")
        .select(`
          *,
          profiles!fk_comissoes_mensais_representante_profile (
            nome
          )
        `);
      
      if (error) throw error;
      return data;
    }
  });

  const kpis = useMemo(() => {
    if (!commissionsData) return [
      { title: "Comissões Geradas", value: "R$ 0,00", icon: TrendingUp, color: "text-emerald-400", trend: "0%", trendUp: true },
      { title: "Pagamentos Pendentes", value: "R$ 0,00", icon: Clock, color: "text-amber-400", trend: "0%", trendUp: false },
      { title: "Bônus Indiretos", value: "R$ 0,00", icon: Award, color: "text-purple-400", trend: "0%", trendUp: true },
      { title: "Recorrência Mensal", value: "R$ 0,00", icon: Wallet, color: "text-blue-400", trend: "0%", trendUp: true },
    ];

    const currentMonthData = commissionsData.filter(c => c.mes_referencia === mesAtual);
    const totalPendente = currentMonthData.filter(c => c.status === "pendente").reduce((acc, curr) => acc + Number(curr.valor_total), 0);
    const totalPago = currentMonthData.filter(c => c.status === "pago").reduce((acc, curr) => acc + Number(curr.valor_total), 0);
    const totalBonus = currentMonthData.reduce((acc, curr) => acc + Number(curr.valor_recorrencia_indireta || 0), 0);
    const totalRecorrencia = currentMonthData.reduce((acc, curr) => acc + Number(curr.valor_recorrencia_direta || 0), 0);

    const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    return [
      { title: "Total Gerado (Mês)", value: fmt(totalPago + totalPendente), icon: TrendingUp, color: "text-emerald-400", trend: "+0%", trendUp: true },
      { title: "Pagamentos Pendentes", value: fmt(totalPendente), icon: Clock, color: "text-amber-400", trend: "0%", trendUp: false },
      { title: "Bônus Indiretos", value: fmt(totalBonus), icon: Award, color: "text-purple-400", trend: "+0%", trendUp: true },
      { title: "Recorrência Direta", value: fmt(totalRecorrencia), icon: Wallet, color: "text-blue-400", trend: "+0%", trendUp: true },
    ];
  }, [commissionsData, mesAtual]);

  const rankingData = useMemo(() => {
    if (!commissionsData) return [];
    return commissionsData
      .filter(c => c.mes_referencia === mesAtual)
      .sort((a, b) => Number(b.valor_total) - Number(a.valor_total))
      .slice(0, 10)
      .map((c, i) => ({
        name: c.profiles?.nome || "Representante",
        total: Number(c.valor_total),
        paid: c.status === "pago" ? Number(c.valor_total) : 0,
        color: i === 0 ? "#10b981" : i === 1 ? "#3b82f6" : i === 2 ? "#8b5cf6" : "#f59e0b"
      }));
  }, [commissionsData, mesAtual]);

  const recentCommissions = useMemo(() => {
    if (!commissionsData) return [];
    return commissionsData
      .filter(c => !searchTerm || c.profiles?.nome?.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => b.mes_referencia.localeCompare(a.mes_referencia))
      .slice(0, 20)
      .map(c => ({
        id: c.id,
        user: c.profiles?.nome || "Representante",
        type: Number(c.valor_recorrencia_indireta) > 0 ? "Indireta" : "Direta",
        amount: Number(c.valor_total),
        status: c.status === "pago" ? "Pago" : "Pendente",
        date: format(new Date(c.mes_referencia + "-01"), "MMM/yy", { locale: ptBR }),
        client: `${c.clientes_diretos_ativos || 0} cl. ativos`
      }));
  }, [commissionsData, searchTerm]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pago": return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">Pago</Badge>;
      case "Pendente": return <Badge variant="outline" className="text-amber-400 border-amber-400/50">Pendente</Badge>;
      case "Cancelado": return <Badge variant="destructive">Cancelado</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (queryError) {
    return (
      <div className="p-6">
        <QueryError error={queryError} onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Gestão de Comissões</h1>
          <p className="text-muted-foreground mt-1">Monitoramento global de repasses, bônus e performance financeira.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 border-white/10 hover:bg-white/5">
            <Filter className="w-4 h-4" />
            Filtros Avançados
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-500 gap-2">
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <Card key={i} className="bg-card/50 border-white/10 backdrop-blur-sm overflow-hidden relative">
            <div className={`absolute top-0 left-0 w-1 h-full ${kpi.color.replace('text', 'bg')}`} />
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                <div className={`flex items-center gap-1 text-xs font-medium ${kpi.trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
                  {kpi.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {kpi.trend}
                </div>
              </div>
              <p className="text-sm font-medium text-muted-foreground mt-2">{kpi.title}</p>
            </CardHeader>
            <CardContent>
              <h2 className="text-2xl font-bold text-white">{kpi.value}</h2>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-card/50 border-white/10 backdrop-blur-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle>Histórico de Repasses</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar parceiro..."
                className="pl-9 bg-background/50 border-white/10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="todas" className="w-full">
              <TabsList className="bg-background/50 border-white/10 mb-4">
                <TabsTrigger value="todas">Todas</TabsTrigger>
                <TabsTrigger value="pagas">Pagas</TabsTrigger>
                <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
              </TabsList>
              
              <TabsContent value="todas" className="mt-0">
                <div className="rounded-md border border-white/10 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-white/5">
                      <TableRow className="border-white/10 hover:bg-transparent">
                        <TableHead className="text-white">Parceiro</TableHead>
                        <TableHead className="text-white">Tipo</TableHead>
                        <TableHead className="text-white">Resumo</TableHead>
                        <TableHead className="text-white">Valor</TableHead>
                        <TableHead className="text-white">Status</TableHead>
                        <TableHead className="text-white">Mês</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentCommissions.map((item) => (
                        <TableRow key={item.id} className="border-white/10 hover:bg-white/5 transition-colors">
                          <TableCell className="font-medium text-white">{item.user}</TableCell>
                          <TableCell>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                              {item.type}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">{item.client}</TableCell>
                          <TableCell className="font-bold text-white">R$ {item.amount.toFixed(2)}</TableCell>
                          <TableCell>{getStatusBadge(item.status)}</TableCell>
                          <TableCell className="text-muted-foreground text-sm uppercase">{item.date}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <CardTitle>Ranking do Mês</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rankingData} layout="vertical" margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    tick={{ fill: '#94a3b8', fontSize: 12 }} 
                    width={100}
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #ffffff10', borderRadius: '8px' }}
                  />
                  <Bar dataKey="total" radius={[0, 4, 4, 0]} barSize={20}>
                    {rankingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Top Performance</h4>
              {rankingData.slice(0, 3).map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      i === 0 ? 'bg-amber-500/20 text-amber-500' : 
                      i === 1 ? 'bg-slate-300/20 text-slate-300' : 
                      'bg-orange-600/20 text-orange-600'
                    }`}>
                      {i + 1}º
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{item.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">Pago: R$ {item.paid.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-400">R$ {item.total.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">Total</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MasterComissoes;
