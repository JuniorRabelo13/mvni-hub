import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const formatMonth = (monthStr: string) => {
  const [year, month] = monthStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  const formatted = date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1).replace(".", "");
};

type ComissaoMensal = {
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

  useEffect(() => {
    if (!user) return;

    const mesAtual = new Date().toISOString().substring(0, 7); // YYYY-MM

    const fetchData = async () => {
      // Fetch current month summary
      const { data: currentData, error: currentError } = await supabase
        .from("comissoes_mensais")
        .select("mes_referencia, valor_total, valor_ativacoes, valor_recorrencia_direta, valor_recorrencia_indireta, status")
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
        .select("mes_referencia, valor_total, valor_ativacoes, valor_recorrencia_direta, valor_recorrencia_indireta, status")
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

  const stats = {
    valor_total: comissao?.valor_total || 0,
    valor_ativacoes: comissao?.valor_ativacoes || 0,
    valor_recorrencia_direta: comissao?.valor_recorrencia_direta || 0,
    valor_recorrencia_indireta: comissao?.valor_recorrencia_indireta || 0,
    status: comissao?.status || "pendente",
  };

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
