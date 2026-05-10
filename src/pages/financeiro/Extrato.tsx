import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Wallet, 
  Lock, 
  Calendar, 
  Search, 
  Download, 
  Zap, 
  RefreshCcw, 
  Star, 
  ArrowDown, 
  Info, 
  FileText,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { maskSensitiveInfo } from "@/lib/mask";

const ITEMS_PER_PAGE = 20;

type WalletTransaction = {
  id: string;
  tipo: 'credito_ativacao' | 'credito_recorrencia' | 'credito_bonus' | 'debito_saque' | 'estorno';
  valor: number;
  descricao: string;
  referencia_id: string | null;
  status: 'confirmado' | 'pendente' | 'estornado';
  data_liberacao: string | null;
  created_at: string;
};

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function ExtratoFinanceiro() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [periodo, setPeriodo] = useState("30");
  const [tipoFiltro, setTipoFilter] = useState("todos");
  const [search, setSearch] = useState("");

  // 1. Dados da Wallet (Saldos)
  const { data: wallet } = useQuery({
    queryKey: ["wallet-balance", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // 2. Transações Paginadas
  const { data: transactionData, isLoading } = useQuery({
    queryKey: ["wallet-transactions", user?.id, page, periodo, tipoFiltro, search],
    queryFn: async () => {
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from("transacoes_wallet")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      // Filtro de Período
      if (periodo !== "all") {
        const startDate = subMonths(new Date(), parseInt(periodo) === 30 ? 1 : parseInt(periodo) / 30);
        query = query.gte("created_at", startDate.toISOString());
      }

      // Filtro de Tipo
      if (tipoFiltro === "creditos") {
        query = query.like("tipo", "credito%");
      } else if (tipoFiltro === "debitos") {
        query = query.or("tipo.eq.debito_saque,tipo.eq.estorno");
      } else if (tipoFiltro !== "todos") {
        query = query.eq("tipo", tipoFiltro);
      }

      // Busca por descrição
      if (search) {
        query = query.ilike("descricao", `%${search}%`);
      }

      const { data, count, error } = await query.range(from, to);
      if (error) throw error;

      return { data: data as WalletTransaction[], count: count || 0 };
    },
    enabled: !!user,
  });

  // 3. Exportar CSV
  const handleExport = async () => {
    try {
      const { data, error } = await supabase
        .from("transacoes_wallet")
        .select("created_at, tipo, valor, descricao, status")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const csvRows = [
        ["Data", "Tipo", "Valor", "Descricao", "Status"],
        ...data.map(t => [
          format(parseISO(t.created_at), 'dd/MM/yyyy HH:mm'),
          t.tipo,
          t.valor.toString().replace('.', ','),
          t.descricao,
          t.status
        ])
      ];

      const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.map(e => e.join(";")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `extrato-financeiro-${format(new Date(), 'dd-MM-yyyy')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV exportado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao exportar: " + error.message);
    }
  };

  const getTipoIcon = (tipo: WalletTransaction['tipo']) => {
    switch (tipo) {
      case 'credito_ativacao': return <Zap className="h-4 w-4 text-emerald-500" />;
      case 'credito_recorrencia': return <RefreshCcw className="h-4 w-4 text-emerald-500" />;
      case 'credito_bonus': return <Star className="h-4 w-4 text-amber-500" />;
      case 'debito_saque': return <ArrowDown className="h-4 w-4 text-red-500" />;
      case 'estorno': return <Info className="h-4 w-4 text-red-500" />;
      default: return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const totalPeriodo = useMemo(() => {
    return transactionData?.data.reduce((acc, curr) => acc + Number(curr.valor), 0) || 0;
  }, [transactionData]);

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Extrato Financeiro</h1>
          <p className="text-muted-foreground">Acompanhe cada detalhe das suas movimentações.</p>
        </div>
        <Button onClick={handleExport} variant="outline" className="shrink-0">
          <Download className="h-4 w-4 mr-2" /> Exportar CSV
        </Button>
      </header>

      {/* Cards de Saldo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase text-emerald-600/70 tracking-wider">Saldo Disponível</p>
                <h3 className="text-3xl font-bold text-emerald-600">{fmt(wallet?.saldo_disponivel || 0)}</h3>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-full">
                <Wallet className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold uppercase text-amber-600/70 tracking-wider">Saldo Bloqueado</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger><Info className="h-3 w-3 text-amber-600/50" /></TooltipTrigger>
                      <TooltipContent>Valores em período de carência (segurança contra chargeback/estorno).</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <h3 className="text-3xl font-bold text-amber-600">{fmt(wallet?.saldo_bloqueado || 0)}</h3>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-full">
                <Lock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase text-blue-600/70 tracking-wider">Projeção Futura</p>
                <h3 className="text-3xl font-bold text-blue-600">{fmt(wallet?.saldo_a_liberar || 0)}</h3>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-full">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por descrição..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="60">Últimos 60 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="all">Todo histórico</SelectItem>
            </SelectContent>
          </Select>
          <Select value={tipoFiltro} onValueChange={setTipoFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              <SelectItem value="creditos">Somente Créditos</SelectItem>
              <SelectItem value="debitos">Somente Débitos</SelectItem>
              <SelectItem value="debito_saque">Saques</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Tabela de Transações */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground uppercase text-[10px] tracking-widest">Data</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground uppercase text-[10px] tracking-widest">Tipo</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground uppercase text-[10px] tracking-widest">Descrição</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground uppercase text-[10px] tracking-widest">Status</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground uppercase text-[10px] tracking-widest">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-4 py-4"><Skeleton className="h-10 w-full" /></td>
                  </tr>
                ))
              ) : transactionData?.data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    Nenhuma transação encontrada no período.
                  </td>
                </tr>
              ) : (
                transactionData?.data.map((tx) => (
                  <tr key={tx.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-4 py-4 whitespace-nowrap text-muted-foreground">
                      {format(parseISO(tx.created_at), 'dd/MM/yyyy HH:mm')}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-muted rounded-lg group-hover:bg-background transition-colors">
                          {getTipoIcon(tx.tipo)}
                        </div>
                        <span className="capitalize text-xs font-medium">{tx.tipo.replace('credito_', '').replace('debito_', '').replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-medium text-card-foreground">
                      {maskSensitiveInfo(tx.descricao)}
                      {tx.referencia_id && (
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">REF: {tx.referencia_id.slice(0, 8)}</p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant="outline" className={`text-[10px] font-bold border-none uppercase ${
                        tx.status === 'confirmado' ? 'bg-emerald-500/10 text-emerald-600' :
                        tx.status === 'pendente' ? 'bg-amber-500/10 text-amber-600' :
                        'bg-red-500/10 text-red-600'
                      }`}>
                        {tx.status}
                      </Badge>
                    </td>
                    <td className={`px-4 py-4 text-right font-bold tabular-nums ${tx.valor > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {tx.valor > 0 ? '+' : ''} {fmt(tx.valor)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {transactionData && transactionData.data.length > 0 && (
              <tfoot className="bg-muted/30">
                <tr className="font-bold border-t border-border">
                  <td colSpan={4} className="px-4 py-4 text-right text-muted-foreground">Saldo do Período</td>
                  <td className={`px-4 py-4 text-right tabular-nums ${totalPeriodo >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {totalPeriodo >= 0 ? <TrendingUp className="h-4 w-4 inline mr-2" /> : <TrendingDown className="h-4 w-4 inline mr-2" />}
                    {fmt(totalPeriodo)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Paginação */}
      {transactionData && transactionData.count > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between py-4">
          <p className="text-sm text-muted-foreground">
            Mostrando {((page - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(page * ITEMS_PER_PAGE, transactionData.count)} de {transactionData.count} transações
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={page * ITEMS_PER_PAGE >= transactionData.count}
            >
              Próximo <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
