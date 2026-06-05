import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Smartphone } from "lucide-react";
import { QueryError } from "@/components/QueryError";

type Chip = {
  id: string;
  iccid: string;
  numero_linha: string | null;
  operadora: string;
  status: string;
  representante_id: string | null;
  lote_id: string | null;
  produto_id: string | null;
  data_entrada: string | null;
  data_envio: string | null;
  data_ativacao: string | null;
  observacoes: string | null;
};

type Lote = {
  id: string;
  nome: string;
  operadora: string;
  quantidade_total: number;
  quantidade_disponivel: number;
  data_recebimento: string | null;
  observacoes: string | null;
};

type Kit = {
  id: string;
  representante_id: string;
  tipo_kit: string;
  quantidade_prevista: number;
  quantidade_enviada: number;
  operadora_prioritaria: string;
  status: string;
  motivo_bloqueio: string | null;
  endereco_entrega: string | null;
  codigo_rastreio: string | null;
  data_solicitacao: string | null;
  data_aprovacao: string | null;
  data_envio: string | null;
  data_recebimento: string | null;
};

type Movimentacao = {
  id: string;
  chip_id: string;
  representante_id: string | null;
  cliente_id: string | null;
  tipo_movimentacao: string;
  status_anterior: string | null;
  status_novo: string | null;
  descricao: string | null;
  criado_por: string | null;
  created_at: string;
};

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleString("pt-BR") : "—";

const statusBadge = (status: string) => {
  const s = (status || "").toLowerCase();
  const map: Record<string, string> = {
    disponivel: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    reservado: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    enviado: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    com_representante: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    ativado_cliente: "bg-primary/20 text-primary border-primary/30",
    perdido: "bg-red-500/20 text-red-300 border-red-500/30",
    devolvido: "bg-muted text-muted-foreground border-border",
  };
  const cls = map[s] || "bg-muted text-muted-foreground border-border";
  return <Badge className={cls} variant="outline">{status || "—"}</Badge>;
};

const kitStatusBadge = (status: string) => {
  const s = (status || "").toLowerCase();
  const map: Record<string, string> = {
    pendente: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    aprovado: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    enviado: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    recebido: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    bloqueado: "bg-red-500/20 text-red-300 border-red-500/30",
    cancelado: "bg-muted text-muted-foreground border-border",
  };
  const cls = map[s] || "bg-muted text-muted-foreground border-border";
  return <Badge className={cls} variant="outline">{status || "—"}</Badge>;
};

const truncId = (id: string | null) =>
  id ? `${id.slice(0, 8)}…` : "—";

export default function MasterChips() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["master-chips-overview"],
    queryFn: async () => {
      const [chipsRes, lotesRes, kitsRes, movRes] = await Promise.all([
        supabase.from("chip_estoque" as any).select("*").order("created_at", { ascending: false }),
        supabase.from("chip_lotes" as any).select("*").order("created_at", { ascending: false }),
        supabase
          .from("chip_kits_representante" as any)
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("chip_movimentacoes" as any)
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200),
      ]);

      if (chipsRes.error) throw chipsRes.error;
      if (lotesRes.error) throw lotesRes.error;
      if (kitsRes.error) throw kitsRes.error;
      if (movRes.error) throw movRes.error;

      return {
        chips: (chipsRes.data || []) as unknown as Chip[],
        lotes: (lotesRes.data || []) as unknown as Lote[],
        kits: (kitsRes.data || []) as unknown as Kit[],
        movimentacoes: (movRes.data || []) as unknown as Movimentacao[],
      };
    },
  });

  const kpis = useMemo(() => {
    const chips = data?.chips || [];
    const lotes = data?.lotes || [];
    const kits = data?.kits || [];
    const count = (s: string) =>
      chips.filter((c) => (c.status || "").toLowerCase() === s).length;
    const kitCount = (s: string) =>
      kits.filter((k) => (k.status || "").toLowerCase() === s).length;
    return {
      total: chips.length,
      disponiveis: count("disponivel"),
      reservados: count("reservado"),
      enviados: count("enviado"),
      comRep: count("com_representante"),
      ativados: count("ativado_cliente"),
      perdidos: count("perdido"),
      devolvidos: count("devolvido"),
      totalLotes: lotes.length,
      kitsPendentes: kitCount("pendente"),
      kitsAprovados: kitCount("aprovado"),
      kitsEnviados: kitCount("enviado"),
      kitsRecebidos: kitCount("recebido"),
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
    return <QueryError error={error as Error} onRetry={() => refetch()} />;
  }

  const chips = data?.chips || [];
  const lotes = data?.lotes || [];
  const kits = data?.kits || [];
  const movs = data?.movimentacoes || [];

  const KpiCard = ({ label, value }: { label: string; value: number | string }) => (
    <Card>
      <CardContent className="p-4">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold mt-1">{value}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Smartphone className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Controle de Chips</h1>
          <p className="text-sm text-muted-foreground">
            Visão read-only do estoque, lotes, kits e movimentações.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <KpiCard label="Total cadastrados" value={kpis.total} />
        <KpiCard label="Disponíveis" value={kpis.disponiveis} />
        <KpiCard label="Reservados" value={kpis.reservados} />
        <KpiCard label="Enviados" value={kpis.enviados} />
        <KpiCard label="Com representante" value={kpis.comRep} />
        <KpiCard label="Ativados" value={kpis.ativados} />
        <KpiCard label="Perdidos" value={kpis.perdidos} />
        <KpiCard label="Devolvidos" value={kpis.devolvidos} />
        <KpiCard label="Total de lotes" value={kpis.totalLotes} />
        <KpiCard label="Kits pendentes" value={kpis.kitsPendentes} />
        <KpiCard label="Kits aprovados" value={kpis.kitsAprovados} />
        <KpiCard label="Kits enviados" value={kpis.kitsEnviados} />
        <KpiCard label="Kits recebidos" value={kpis.kitsRecebidos} />
      </div>

      {/* Estoque */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estoque de Chips</CardTitle>
        </CardHeader>
        <CardContent>
          {chips.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nenhum chip cadastrado ainda.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ICCID</TableHead>
                    <TableHead>Linha</TableHead>
                    <TableHead>Operadora</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Representante</TableHead>
                    <TableHead>Lote</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Entrada</TableHead>
                    <TableHead>Envio</TableHead>
                    <TableHead>Ativação</TableHead>
                    <TableHead>Obs.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chips.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">{c.iccid}</TableCell>
                      <TableCell>{c.numero_linha || "—"}</TableCell>
                      <TableCell>{c.operadora}</TableCell>
                      <TableCell>{statusBadge(c.status)}</TableCell>
                      <TableCell className="text-xs">{truncId(c.representante_id)}</TableCell>
                      <TableCell className="text-xs">{truncId(c.lote_id)}</TableCell>
                      <TableCell className="text-xs">{truncId(c.produto_id)}</TableCell>
                      <TableCell className="text-xs">{fmtDate(c.data_entrada)}</TableCell>
                      <TableCell className="text-xs">{fmtDate(c.data_envio)}</TableCell>
                      <TableCell className="text-xs">{fmtDate(c.data_ativacao)}</TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">
                        {c.observacoes || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lotes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lotes</CardTitle>
        </CardHeader>
        <CardContent>
          {lotes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nenhum lote cadastrado ainda.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Operadora</TableHead>
                    <TableHead>Qtd. total</TableHead>
                    <TableHead>Qtd. disponível</TableHead>
                    <TableHead>Recebimento</TableHead>
                    <TableHead>Obs.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lotes.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>{l.nome}</TableCell>
                      <TableCell>{l.operadora}</TableCell>
                      <TableCell>{l.quantidade_total}</TableCell>
                      <TableCell>{l.quantidade_disponivel}</TableCell>
                      <TableCell className="text-xs">{fmtDate(l.data_recebimento)}</TableCell>
                      <TableCell className="text-xs max-w-[280px] truncate">
                        {l.observacoes || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Kits */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kits de Representantes</CardTitle>
        </CardHeader>
        <CardContent>
          {kits.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nenhum kit criado ainda.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Representante</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Prev.</TableHead>
                    <TableHead>Enviada</TableHead>
                    <TableHead>Operadora</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Bloqueio</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead>Rastreio</TableHead>
                    <TableHead>Solicitação</TableHead>
                    <TableHead>Aprovação</TableHead>
                    <TableHead>Envio</TableHead>
                    <TableHead>Recebimento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kits.map((k) => (
                    <TableRow key={k.id}>
                      <TableCell className="text-xs">{truncId(k.representante_id)}</TableCell>
                      <TableCell>{k.tipo_kit}</TableCell>
                      <TableCell>{k.quantidade_prevista}</TableCell>
                      <TableCell>{k.quantidade_enviada}</TableCell>
                      <TableCell>{k.operadora_prioritaria}</TableCell>
                      <TableCell>{kitStatusBadge(k.status)}</TableCell>
                      <TableCell className="text-xs max-w-[160px] truncate">
                        {k.motivo_bloqueio || "—"}
                      </TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">
                        {k.endereco_entrega || "—"}
                      </TableCell>
                      <TableCell className="text-xs">{k.codigo_rastreio || "—"}</TableCell>
                      <TableCell className="text-xs">{fmtDate(k.data_solicitacao)}</TableCell>
                      <TableCell className="text-xs">{fmtDate(k.data_aprovacao)}</TableCell>
                      <TableCell className="text-xs">{fmtDate(k.data_envio)}</TableCell>
                      <TableCell className="text-xs">{fmtDate(k.data_recebimento)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Movimentações */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Movimentações</CardTitle>
        </CardHeader>
        <CardContent>
          {movs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nenhuma movimentação registrada ainda.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Chip</TableHead>
                    <TableHead>Representante</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Status anterior</TableHead>
                    <TableHead>Status novo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Criado por</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movs.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="text-xs">{fmtDate(m.created_at)}</TableCell>
                      <TableCell>{m.tipo_movimentacao}</TableCell>
                      <TableCell className="text-xs">{truncId(m.chip_id)}</TableCell>
                      <TableCell className="text-xs">{truncId(m.representante_id)}</TableCell>
                      <TableCell className="text-xs">{truncId(m.cliente_id)}</TableCell>
                      <TableCell className="text-xs">{m.status_anterior || "—"}</TableCell>
                      <TableCell className="text-xs">{m.status_novo || "—"}</TableCell>
                      <TableCell className="text-xs max-w-[260px] truncate">
                        {m.descricao || "—"}
                      </TableCell>
                      <TableCell className="text-xs">{truncId(m.criado_por)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
