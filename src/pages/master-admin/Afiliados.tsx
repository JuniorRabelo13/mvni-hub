import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  TrendingUp, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Trophy,
  AlertCircle,
  UserMinus,
  DollarSign,
  Activity
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function MasterAfiliados() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string>("total_revenue");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { data: affiliates, isLoading } = useQuery({
    queryKey: ["master-affiliates-report"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_master_affiliates_report');
      if (error) throw error;
      return data as any[];
    }
  });

  const filteredAffiliates = affiliates?.filter(a => 
    a.affiliate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.affiliate_email.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    const factor = sortOrder === "asc" ? 1 : -1;
    return (a[sortField] > b[sortField] ? 1 : -1) * factor;
  });

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Ecossistema de Parceiros</p>
          <h1 className="mt-1 text-3xl font-bold md:text-4xl">
            Ranking de <span className="text-gradient-gold">Afiliados Master</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Análise de performance, retenção e saúde da rede de parceiros.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-xs font-bold uppercase backdrop-blur-sm">
          <Trophy className="h-3 w-3 text-amber-500" /> Top Performance
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60 bg-zinc-950/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Afiliados</p>
              <Users className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">{affiliates?.length || 0}</h2>
            <p className="text-[10px] text-muted-foreground mt-1">Parceiros ativos no sistema</p>
          </CardContent>
        </Card>
        
        <Card className="border-border/60 bg-zinc-950/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Recorrência Total</p>
              <Activity className="h-4 w-4 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold">
              {fmt(affiliates?.reduce((acc, curr) => acc + (curr.monthly_recurring || 0), 0) || 0)}
            </h2>
            <p className="text-[10px] text-muted-foreground mt-1">MRR gerado pela rede</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-zinc-950/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Churn Médio</p>
              <UserMinus className="h-4 w-4 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold">0.00%</h2>
            <p className="text-[10px] text-muted-foreground mt-1">Taxa de cancelamento global</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-zinc-950/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Inadimplência</p>
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold">
              {(affiliates?.reduce((acc, curr) => acc + (curr.overdue_rate || 0), 0) / (affiliates?.length || 1)).toFixed(2)}%
            </h2>
            <p className="text-[10px] text-muted-foreground mt-1">Média ponderada da rede</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20 bg-zinc-950/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
          <CardTitle className="text-xl font-bold">Listagem de Performance</CardTitle>
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar parceiro..."
                className="pl-9 bg-zinc-900/50 border-zinc-800"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="border-zinc-800">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-zinc-800/50">
            <Table>
              <TableHeader className="bg-zinc-900/30">
                <TableRow className="hover:bg-transparent border-zinc-800">
                  <TableHead className="w-[250px]">Afiliado</TableHead>
                  <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => toggleSort('total_clients')}>
                    <div className="flex items-center gap-1">Clientes <ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => toggleSort('total_revenue')}>
                    <div className="flex items-center gap-1">Receita Total <ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => toggleSort('monthly_recurring')}>
                    <div className="flex items-center gap-1">Recorrência <ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => toggleSort('overdue_rate')}>
                    <div className="flex items-center gap-1">Inadimplência <ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => toggleSort('churn_rate')}>
                    <div className="flex items-center gap-1">Churn <ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAffiliates?.map((a, index) => (
                  <TableRow key={a.affiliate_id} className="border-zinc-800/50 hover:bg-zinc-900/20 group">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        {index < 3 && <Trophy className={cn("h-4 w-4 shrink-0", index === 0 ? "text-amber-400" : index === 1 ? "text-zinc-400" : "text-amber-700")} />}
                        <div className="flex flex-col">
                          <span className="text-sm group-hover:text-primary transition-colors">{a.affiliate_name}</span>
                          <span className="text-[10px] text-muted-foreground">{a.affiliate_email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                        {a.total_clients} clientes
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{fmt(a.total_revenue)}</TableCell>
                    <TableCell className="font-mono text-xs text-emerald-400">{fmt(a.monthly_recurring)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className={cn("h-full transition-all", a.overdue_rate > 10 ? "bg-red-500" : "bg-amber-500")} 
                            style={{ width: `${Math.min(a.overdue_rate, 100)}%` }} 
                          />
                        </div>
                        <span className="text-[10px] font-bold">{a.overdue_rate}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-[10px] text-muted-foreground">{a.churn_rate}%</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredAffiliates?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      Nenhum afiliado encontrado para sua busca.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
