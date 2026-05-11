import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, Filter, TrendingUp, Wallet, Clock, Users, ArrowUpRight, ArrowDownRight, Award } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const MasterComissoes = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const kpis = [
    { title: "Comissões Geradas", value: "R$ 45.820,00", icon: TrendingUp, color: "text-emerald-400", trend: "+12.5%", trendUp: true },
    { title: "Pagamentos Pendentes", value: "R$ 8.450,00", icon: Clock, color: "text-amber-400", trend: "-2.1%", trendUp: false },
    { title: "Bônus Indiretos", value: "R$ 3.210,00", icon: Award, color: "text-purple-400", trend: "+5.4%", trendUp: true },
    { title: "Recorrência Mensal", value: "R$ 15.600,00", icon: Wallet, color: "text-blue-400", trend: "+8.2%", trendUp: true },
  ];

  const rankingData = [
    { name: "João Silva", total: 12500, paid: 10000, color: "#10b981" },
    { name: "Maria Oliveira", total: 9800, paid: 8500, color: "#3b82f6" },
    { name: "Ricardo Santos", total: 7200, paid: 6000, color: "#8b5cf6" },
    { name: "Ana Costa", total: 5400, paid: 5400, color: "#f59e0b" },
    { name: "Pedro Rocha", total: 4100, paid: 3200, color: "#ef4444" },
  ];

  const recentCommissions = [
    { id: 1, user: "João Silva", type: "Direta", amount: 450.0, status: "Pago", date: "Hoje, 14:20", client: "Empresa ABC" },
    { id: 2, user: "Maria Oliveira", type: "Indireta", amount: 125.0, status: "Pendente", date: "Hoje, 11:05", client: "Loja XYZ" },
    { id: 3, user: "Ricardo Santos", type: "Bônus", amount: 1000.0, status: "Pago", date: "Ontem, 18:45", client: "Meta Batida" },
    { id: 4, user: "João Silva", type: "Recorrente", amount: 89.9, status: "Pendente", date: "Ontem, 09:15", client: "SaaS Premium" },
    { id: 5, user: "Ana Costa", type: "Direta", amount: 210.0, status: "Cancelado", date: "10 Mai, 16:30", client: "Devolução" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pago": return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">Pago</Badge>;
      case "Pendente": return <Badge variant="outline" className="text-amber-400 border-amber-400/50">Pendente</Badge>;
      case "Cancelado": return <Badge variant="destructive">Cancelado</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

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
                <TabsTrigger value="recorrentes">Recorrentes</TabsTrigger>
              </TabsList>
              
              <TabsContent value="todas" className="mt-0">
                <div className="rounded-md border border-white/10 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-white/5">
                      <TableRow className="border-white/10 hover:bg-transparent">
                        <TableHead className="text-white">Parceiro</TableHead>
                        <TableHead className="text-white">Tipo</TableHead>
                        <TableHead className="text-white">Cliente/Ref</TableHead>
                        <TableHead className="text-white">Valor</TableHead>
                        <TableHead className="text-white">Status</TableHead>
                        <TableHead className="text-white">Data</TableHead>
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
                          <TableCell className="text-muted-foreground text-sm">{item.date}</TableCell>
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
              <CardTitle>Ranking Financeiro</CardTitle>
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
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Top 3 Performance</h4>
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
                      <p className="text-xs text-muted-foreground">Pago: R$ {item.paid.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-400">R$ {item.total.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">Total Gerado</p>
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
