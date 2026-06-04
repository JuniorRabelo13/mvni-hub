import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Package, CheckCircle2, Clock, TrendingUp, Wallet, Loader2 } from "lucide-react";
import { QueryError } from "@/components/QueryError";

type Produto = {
  id: string;
  slug: string;
  nome: string;
  descricao_comercial: string | null;
  status: "ativo" | "preparado" | "inativo" | string;
  produto_principal: boolean;
  valor_mensal: number | null;
  custo_operacional: number | null;
  comissao_ativacao: number | null;
  comissao_recorrente: number | null;
};

const fmt = (n: number | null | undefined) =>
  (Number(n) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const statusBadge = (status: string) => {
  if (status === "ativo")
    return <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">Ativo</Badge>;
  if (status === "preparado")
    return <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">Preparado</Badge>;
  return <Badge variant="outline" className="text-muted-foreground">Inativo</Badge>;
};

export default function MasterProdutos() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["master-produtos-expansao"],
    queryFn: async () => {
      const { data: produtos, error: pErr } = await supabase
        .from("produtos" as any)
        .select("*")
        .order("produto_principal", { ascending: false })
        .order("status", { ascending: true });
      if (pErr) throw pErr;

      const list = (produtos || []) as unknown as Produto[];
      const linhaCelular = list.find((p) => p.slug === "linha-celular");
      const linhaCelularId = linhaCelular?.id ?? null;

      // Contagens por produto via assinaturas (produto_id)
      const { data: assinaturas } = await supabase
        .from("assinaturas")
        .select("produto_id, status");

      const contagem: Record<string, number> = {};
      (assinaturas || []).forEach((a: any) => {
        if (a.status && a.status !== "ativa" && a.status !== "active") return;
        const pid = a.produto_id ?? linhaCelularId;
        if (!pid) return;
        contagem[pid] = (contagem[pid] || 0) + 1;
      });

      // Comissão por produto via itens_comissao
      const { data: itens } = await supabase
        .from("itens_comissao")
        .select("produto_id, valor");

      const comissaoAcum: Record<string, number> = {};
      (itens || []).forEach((i: any) => {
        const pid = i.produto_id ?? linhaCelularId;
        if (!pid) return;
        comissaoAcum[pid] = (comissaoAcum[pid] || 0) + Number(i.valor || 0);
      });

      return { produtos: list, contagem, comissaoAcum };
    },
  });

  const kpis = useMemo(() => {
    const produtos = data?.produtos || [];
    const contagem = data?.contagem || {};
    const ativos = produtos.filter((p) => p.status === "ativo");
    const preparados = produtos.filter((p) => p.status === "preparado");

    let receitaMensal = 0;
    let comissaoMensal = 0;
    ativos.forEach((p) => {
      const qtd = contagem[p.id] || 0;
      receitaMensal += qtd * Number(p.valor_mensal || 0);
      comissaoMensal += qtd * Number(p.comissao_recorrente || 0);
    });

    return {
      total: produtos.length,
      ativos: ativos.length,
      preparados: preparados.length,
      receitaMensal,
      comissaoMensal,
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <QueryError error={error as Error} onRetry={refetch} />;
  }

  const produtos = data?.produtos || [];
  const contagem = data?.contagem || {};
  const comissaoAcum = data?.comissaoAcum || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Expansão de Produtos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Catálogo real de produtos recorrentes — visualização somente leitura.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-muted-foreground">Ativos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{kpis.ativos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-muted-foreground">Preparados</CardTitle>
            <Clock className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">{kpis.preparados}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-muted-foreground">Receita Mensal Est.</CardTitle>
            <Wallet className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(kpis.receitaMensal)}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Apenas produtos ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-muted-foreground">Comissão Mensal Est.</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(kpis.comissaoMensal)}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Recorrente · ativos</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Catálogo de Produtos</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Principal</TableHead>
                <TableHead className="text-right">Mensal</TableHead>
                <TableHead className="text-right">Custo Op.</TableHead>
                <TableHead className="text-right">Margem</TableHead>
                <TableHead className="text-right">Com. Ativação</TableHead>
                <TableHead className="text-right">Com. Recorrente</TableHead>
                <TableHead className="text-right">Assinaturas</TableHead>
                <TableHead className="text-right">Receita</TableHead>
                <TableHead className="text-right">Comissão Acum.</TableHead>
                <TableHead>Implantação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {produtos.map((p) => {
                const preparado = p.status === "preparado";
                const qtd = contagem[p.id] || 0;
                const receita = qtd * Number(p.valor_mensal || 0);
                const margem =
                  p.valor_mensal != null && p.custo_operacional != null
                    ? Number(p.valor_mensal) - Number(p.custo_operacional)
                    : null;
                const comAcum = comissaoAcum[p.id] || 0;

                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-medium">{p.nome}</div>
                      {p.descricao_comercial && (
                        <div className="text-xs text-muted-foreground">{p.descricao_comercial}</div>
                      )}
                    </TableCell>
                    <TableCell>{statusBadge(p.status)}</TableCell>
                    <TableCell>
                      {p.produto_principal ? (
                        <Badge className="bg-primary/20 text-primary border-primary/30">Sim</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Não</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {p.valor_mensal != null ? fmt(p.valor_mensal) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      {p.custo_operacional != null ? fmt(p.custo_operacional) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      {margem != null ? fmt(margem) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      {p.comissao_ativacao != null ? fmt(p.comissao_ativacao) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      {p.comissao_recorrente != null ? fmt(p.comissao_recorrente) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      {preparado && qtd === 0 ? (
                        <span className="text-xs text-muted-foreground">Sem dados ainda</span>
                      ) : (
                        qtd
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {preparado && receita === 0 ? (
                        <span className="text-xs text-muted-foreground">Sem dados ainda</span>
                      ) : (
                        fmt(receita)
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {preparado && comAcum === 0 ? (
                        <span className="text-xs text-muted-foreground">Sem dados ainda</span>
                      ) : (
                        fmt(comAcum)
                      )}
                    </TableCell>
                    <TableCell>
                      {preparado ? (
                        <span className="text-xs text-amber-300">Aguardando lançamento</span>
                      ) : p.status === "ativo" ? (
                        <span className="text-xs text-emerald-300">Em operação</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Inativo</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {produtos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={12} className="text-center text-muted-foreground py-8">
                    Nenhum produto cadastrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
