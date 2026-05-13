import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const formatMonth = (monthStr: string) => {
  const [year, month] = monthStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  const formatted = date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1).replace(".", "");
};

const getTipoLabel = (tipo: string) => {
  const labels: Record<string, string> = {
    ativacao: "Ativação",
    recorrencia_direta: "Recorrência direta",
    recorrencia_indireta: "Recorrência indireta",
    bonus: "Bônus",
  };
  return labels[tipo] || tipo;
};

type ItemComissao = {
  id: string;
  tipo: string;
  valor: number;
  clientes: {
    nome: string;
  } | null;
};

type ComissaoMensal = {
  id: string;
  mes_referencia: string;
  valor_total: number;
  valor_ativacoes: number;
  valor_recorrencia_direta: number;
  valor_recorrencia_indireta: number;
  status: string;
};

export default function Ganhos() {
  const { user } = useAuth();
  const [comissao, setComissao] = useState<ComissaoMensal | null>(null);
  const [historico, setHistorico] = useState<ComissaoMensal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<ComissaoMensal | null>(null);
  const [items, setItems] = useState<ItemComissao[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    if (!user) return;

    const mesAtual = new Date().toISOString().substring(0, 7); // YYYY-MM

    const fetchData = async () => {
      // Fetch current month summary
      const { data: currentData, error: currentError } = await supabase
        .from("comissoes_mensais")
        .select("id, mes_referencia, valor_total, valor_ativacoes, valor_recorrencia_direta, valor_recorrencia_indireta, status")
        .eq("representante_id", user.id)
        .eq("mes_referencia", mesAtual)
        .maybeSingle();

      if (currentError) {
        console.error("Erro ao buscar comissões do mês:", currentError);
      }
      setComissao(currentData as ComissaoMensal | null);

      // Fetch last 6 months history
      const { data: historyData, error: historyError } = await supabase
        .from("comissoes_mensais")
        .select("id, mes_referencia, valor_total, valor_ativacoes, valor_recorrencia_direta, valor_recorrencia_indireta, status")
        .eq("representante_id", user.id)
        .order("mes_referencia", { ascending: false })
        .limit(6);

      if (historyError) {
        console.error("Erro ao buscar histórico de comissões:", historyError);
      }
      setHistorico((historyData as ComissaoMensal[]) || []);
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const fetchDetails = async (comissaoId: string) => {
    setLoadingItems(true);
    const { data, error } = await supabase
      .from("itens_comissao")
      .select(`
        id,
        tipo,
        valor,
        clientes (
          nome
        )
      `)
      .eq("comissao_id", comissaoId)
      .order("tipo", { ascending: true })
      .order("valor", { ascending: false });

    if (error) {
      console.error("Erro ao buscar itens da comissão:", error);
    } else {
      setItems(data as any[]);
    }
    setLoadingItems(false);
  };

  const stats = {
    valor_total: comissao?.valor_total || 0,
    valor_ativacoes: comissao?.valor_ativacoes || 0,
    valor_recorrencia_direta: comissao?.valor_recorrencia_direta || 0,
    valor_recorrencia_indireta: comissao?.valor_recorrencia_indireta || 0,
    status: comissao?.status || "pendente",
  };

  const totalModal = items.reduce((acc, item) => acc + Number(item.valor), 0);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Ganhos</p>
        <h1 className="mt-1 text-3xl font-bold">Resumo do mês</h1>
      </header>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <Card className="border-primary/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
                  Ganho total do mês
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{fmt(Number(stats.valor_total))}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
                  Ativações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{fmt(Number(stats.valor_ativacoes))}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
                  Recorrência direta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{fmt(Number(stats.valor_recorrencia_direta))}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
                  Recorrência indireta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{fmt(Number(stats.valor_recorrencia_indireta))}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
                  Status do repasse
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge 
                  variant={stats.status === "pago" ? "default" : "outline"}
                  className={stats.status === "pago" ? "bg-green-500 hover:bg-green-600 text-white" : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"}
                >
                  {stats.status === "pago" ? "pago" : "pendente"}
                </Badge>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Histórico de extratos</CardTitle>
            </CardHeader>
            <CardContent>
              {historico.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum extrato disponível ainda.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mês</TableHead>
                      <TableHead>Ativações</TableHead>
                      <TableHead>Recorrência direta</TableHead>
                      <TableHead>Recorrência indireta</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historico.map((item) => (
                      <TableRow key={item.mes_referencia}>
                        <TableCell className="font-medium">{formatMonth(item.mes_referencia)}</TableCell>
                        <TableCell>{fmt(Number(item.valor_ativacoes))}</TableCell>
                        <TableCell>{fmt(Number(item.valor_recorrencia_direta))}</TableCell>
                        <TableCell>{fmt(Number(item.valor_recorrencia_indireta))}</TableCell>
                        <TableCell className="font-bold text-primary">{fmt(Number(item.valor_total))}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={item.status === "pago" ? "default" : "outline"}
                            className={item.status === "pago" ? "bg-green-500 hover:bg-green-600 text-white" : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"}
                          >
                            {item.status === "pago" ? "pago" : "pendente"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setSelectedMonth(item);
                                  fetchDetails(item.id);
                                }}
                              >
                                Ver detalhes
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>
                                  Extrato detalhado — {item && formatMonth(item.mes_referencia)}
                                </DialogTitle>
                              </DialogHeader>
                              <div className="py-4">
                                {loadingItems ? (
                                  <div className="flex justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                  </div>
                                ) : items.length === 0 ? (
                                  <p className="text-center text-muted-foreground py-8">
                                    Nenhum item detalhado encontrado.
                                  </p>
                                ) : (
                                  <div className="max-h-[60vh] overflow-auto">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Cliente</TableHead>
                                          <TableHead>Tipo</TableHead>
                                          <TableHead className="text-right">Valor</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {items.map((it) => (
                                          <TableRow key={it.id}>
                                            <TableCell>{it.clientes?.nome || "Cliente removido"}</TableCell>
                                            <TableCell>{getTipoLabel(it.tipo)}</TableCell>
                                            <TableCell className="text-right">{fmt(Number(it.valor))}</TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center justify-between border-t pt-4">
                                <div className="text-sm font-bold">
                                  Total: <span className="text-primary">{fmt(totalModal)}</span>
                                </div>
                                <DialogTrigger asChild>
                                  <Button variant="secondary">Fechar</Button>
                                </DialogTrigger>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

