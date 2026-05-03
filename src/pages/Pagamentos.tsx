import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Search, Filter, Calendar, Receipt } from "lucide-react";

type Pagamento = {
  id: string;
  valor: number;
  status: string;
  pago_em: string | null;
  vencimento: string;
  is_primeira: boolean;
  clientes: {
    nome: string;
  };
};

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dt = (d: string | null) => d ? new Date(d).toLocaleDateString("pt-BR") : "—";

export default function Pagamentos() {
  const { user } = useAuth();
  const [items, setItems] = useState<Pagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<string>("all");

  const load = async () => {
    if (!user) return;
    setLoading(true);
    
    let query = supabase
      .from("cobrancas")
      .select("id, valor, status, pago_em, vencimento, is_primeira, clientes(nome)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter as any);
    }

    if (periodFilter === "current_month") {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      query = query.gte("created_at", firstDay);
    }

    const { data } = await query;
    setItems((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user, statusFilter, periodFilter]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Financeiro</p>
          <h1 className="mt-1 text-3xl font-bold">Histórico de Pagamentos</h1>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
                <SelectItem value="pago">Pagos</SelectItem>
                <SelectItem value="atrasado">Atrasados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo o período</SelectItem>
                <SelectItem value="current_month">Mês Atual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Pago em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">Carregando...</TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Nenhum pagamento encontrado para os filtros selecionados.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.clientes.nome}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {p.is_primeira ? "Primeira" : "Recorrente"}
                      </Badge>
                    </TableCell>
                    <TableCell>{fmt(Number(p.valor))}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={p.status === "pago" ? "default" : p.status === "atrasado" ? "destructive" : "secondary"}
                        className={p.status === "pago" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                      >
                        {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{dt(p.vencimento)}</TableCell>
                    <TableCell>{dt(p.pago_em)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
