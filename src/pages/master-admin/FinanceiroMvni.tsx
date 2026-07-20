import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Percent } from "lucide-react";

const fmt = (n: number) => Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function FinanceiroMvni() {
  const now = new Date();
  const [mes, setMes] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);

  const { data, isLoading } = useQuery({
    queryKey: ["mvni-financeiro", mes],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_mvni_financeiro_mensal" as any, { p_mes_referencia: mes });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return (row ?? {}) as any;
    },
  });

  const rec_clientes = Number(data?.receita_clientes ?? 0);
  const rec_operadoras = Number(data?.receita_ativacao_operadoras ?? 0);
  const custo = Number(data?.custo_operadoras ?? 0);
  const com_ativ = Number(data?.comissoes_ativacao_pagas ?? 0);
  const com_rec = Number(data?.comissoes_recorrencia_pagas ?? 0);
  const descontos = Number(data?.descontos_concedidos ?? 0);
  const lucro = Number(data?.lucro_liquido ?? 0);
  const comissoes_total = com_ativ + com_rec;
  const receita_total = rec_clientes + rec_operadoras;

  const chartData = useMemo(() => ([
    { name: "Custo Operadora", value: custo, color: "hsl(24 90% 55%)" },
    { name: "Comissões Parceiros", value: comissoes_total, color: "hsl(280 70% 55%)" },
    { name: "Descontos", value: descontos, color: "hsl(200 70% 55%)" },
    { name: "Lucro Líquido", value: Math.max(lucro, 0), color: "hsl(142 70% 45%)" },
  ].filter(d => d.value > 0)), [custo, comissoes_total, descontos, lucro]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Financeiro MVNI</p>
          <h1 className="mt-1 text-3xl font-bold md:text-4xl">
            Motor <span className="text-gradient-gold">Financeiro</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Resumo mensal consolidado — receita, custos, comissões e lucro líquido.</p>
        </div>
        <div className="flex items-end gap-3">
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Mês de referência</Label>
            <Input type="month" value={mes} onChange={(e) => setMes(e.target.value)} className="w-48 mt-1" />
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : (
        <>
          <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-emerald-400 font-bold">Lucro Líquido do Mês</p>
                  <h2 className="mt-2 text-4xl font-bold md:text-5xl">{fmt(lucro)}</h2>
                  <p className="text-muted-foreground text-sm mt-2">Receita total — custos — comissões — descontos</p>
                </div>
                <div className={`p-4 rounded-2xl ${lucro >= 0 ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
                  {lucro >= 0 ? <TrendingUp className="h-10 w-10 text-emerald-400" /> : <TrendingDown className="h-10 w-10 text-red-400" />}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard title="Receita Clientes" value={fmt(rec_clientes)} icon={DollarSign} accent="text-emerald-400" />
            <MetricCard title="Receita Operadoras" value={fmt(rec_operadoras)} icon={DollarSign} accent="text-emerald-400" />
            <MetricCard title="Custo Operadoras" value={fmt(custo)} icon={TrendingDown} accent="text-amber-400" />
            <MetricCard title="Comissões Pagas" value={fmt(comissoes_total)} icon={Percent} accent="text-purple-400" hint={`Ativação: ${fmt(com_ativ)} • Recorrente: ${fmt(com_rec)}`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-sm font-bold uppercase tracking-wider">Composição do Mês</CardTitle></CardHeader>
              <CardContent className="p-4 h-72">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={90} innerRadius={50} paddingAngle={2}>
                        {chartData.map((d) => (
                          <Cell key={d.name} fill={d.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => fmt(Number(v))} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                    Sem lançamentos financeiros para o mês selecionado.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm font-bold uppercase tracking-wider">Resumo detalhado</CardTitle></CardHeader>
              <CardContent className="p-6 space-y-3 text-sm">
                <Row label="Receita total" value={fmt(receita_total)} strong />
                <Row label="Custo operadoras" value={`- ${fmt(custo)}`} />
                <Row label="Comissões ativação (mês 1)" value={`- ${fmt(com_ativ)}`} />
                <Row label="Comissões recorrentes (mês 2+)" value={`- ${fmt(com_rec)}`} />
                <Row label="Descontos concedidos" value={`- ${fmt(descontos)}`} />
                <div className="border-t border-border pt-3 mt-3">
                  <Row label="Lucro Líquido" value={fmt(lucro)} strong highlight />
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, accent, hint }: { title: string; value: string; icon: any; accent: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
          <Icon className={`h-4 w-4 ${accent}`} />
        </div>
        <h2 className="text-2xl font-bold">{value}</h2>
        {hint && <p className="text-[10px] text-muted-foreground mt-2 leading-snug">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function Row({ label, value, strong, highlight }: { label: string; value: string; strong?: boolean; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`${strong ? "font-semibold" : "text-muted-foreground"}`}>{label}</span>
      <span className={`font-mono ${strong ? "font-bold" : ""} ${highlight ? "text-emerald-400 text-lg" : ""}`}>{value}</span>
    </div>
  );
}
