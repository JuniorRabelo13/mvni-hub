import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Consumo = {
  id: string;
  linha_id: string;
  competencia: string;
  dados_mb?: number | string | null;
  sms_qtd?: number | string | null;
  minutos_qtd?: number | string | null;
};

function num(v: unknown) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function ConsumptionCharts({ consumos }: { consumos: Consumo[] }) {
  const porMes = useMemo(() => {
    const map = new Map<string, { mes: string; dadosGB: number; sms: number; minutos: number }>();
    for (const c of consumos) {
      const k = (c.competencia ?? "").slice(0, 7);
      if (!k) continue;
      const cur = map.get(k) ?? { mes: k, dadosGB: 0, sms: 0, minutos: 0 };
      cur.dadosGB += num(c.dados_mb) / 1024;
      cur.sms += num(c.sms_qtd);
      cur.minutos += num(c.minutos_qtd);
      map.set(k, cur);
    }
    return Array.from(map.values())
      .sort((a, b) => (a.mes < b.mes ? -1 : 1))
      .slice(-12)
      .map((r) => ({ ...r, dadosGB: Number(r.dadosGB.toFixed(2)) }));
  }, [consumos]);

  const porDia = useMemo(() => {
    const map = new Map<string, { dia: string; dadosGB: number }>();
    for (const c of consumos) {
      const k = (c.competencia ?? "").slice(0, 10);
      if (!k) continue;
      const cur = map.get(k) ?? { dia: k, dadosGB: 0 };
      cur.dadosGB += num(c.dados_mb) / 1024;
      map.set(k, cur);
    }
    return Array.from(map.values())
      .sort((a, b) => (a.dia < b.dia ? -1 : 1))
      .slice(-30)
      .map((r) => ({ ...r, dadosGB: Number(r.dadosGB.toFixed(2)) }));
  }, [consumos]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="bg-card/60 border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Consumo mensal</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={porMes}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="dadosGB" name="Dados (GB)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="sms" name="SMS" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="minutos" name="Minutos" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-card/60 border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Consumo diário (dados)</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={porDia}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="dia" stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="dadosGB"
                name="Dados (GB)"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
