import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Wallet, Activity, TrendingUp, ArrowRight, Network } from "lucide-react";
import { sanitize } from "@/lib/sanitize";

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type Stats = {
  clientesAtivos: number;
  linhasAtivas: number;
  ganhoMes: number;
  ganhoTotal: number;
  indicados: number;
};

export default function Dashboard() {
  const { user, effectiveUser } = useAuth();
  const [s, setS] = useState<Stats>({ clientesAtivos: 0, linhasAtivas: 0, ganhoMes: 0, ganhoTotal: 0, indicados: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);

      const [clientes, linhas, comMes, comTotal, indic] = await Promise.all([
        supabase.from("clientes").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("ativo", true),
        supabase.from("linhas").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "ativa"),
        supabase.from("comissoes").select("valor").eq("user_id", user.id).gte("created_at", inicioMes.toISOString()),
        supabase.from("comissoes").select("valor").eq("user_id", user.id),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("indicador_id", user.id),
      ]);

      const stats = {
        clientesAtivos: clientes.count ?? 0,
        linhasAtivas: linhas.count ?? 0,
        ganhoMes: (comMes.data ?? []).reduce((a, b) => a + Number(b.valor), 0),
        ganhoTotal: (comTotal.data ?? []).reduce((a, b) => a + Number(b.valor), 0),
        indicados: indic.count ?? 0,
      };

      setS(sanitize(stats, "dashboard", user.id));
      setLoading(false);
    };
    load();
  }, [user]);

  const cards = [
    { label: "Ganho do mês", value: fmt(s.ganhoMes), icon: Wallet, highlight: true },
    { label: "Clientes ativos", value: s.clientesAtivos, icon: Users },
    { label: "Linhas ativas", value: s.linhasAtivas, icon: Activity },
    { label: "Indicados diretos", value: s.indicados, icon: Network },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Painel</p>
          <h1 className="mt-1 text-3xl font-bold md:text-4xl">
            Sua operação em <span className="text-gradient-gold">tempo real</span>
          </h1>
        </div>
        <Button asChild>
          <Link to="/clientes">
            Cadastrar cliente <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </header>

      {/* Hero saldo */}
      <Card className="overflow-hidden border-primary/30 bg-gradient-noir shadow-gold">
        <CardContent className="p-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Ganho acumulado</p>
              <p className="mt-2 text-5xl font-bold text-gradient-gold md:text-6xl">
                {loading ? "—" : fmt(s.ganhoTotal)}
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-primary" /> R$ 85 por venda + R$ 20/mês recorrente
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Este mês</p>
              <p className="mt-2 text-3xl font-semibold">{fmt(s.ganhoMes)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, highlight }) => (
          <Card key={label} className={highlight ? "border-primary/40" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {label}
              </CardTitle>
              <Icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{loading ? "—" : value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quanto mais você ativa, mais você ganha</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• Cada venda real (cobrança paga) gera <strong className="text-primary">R$ 85</strong> imediatos.</p>
          <p>• Cada cliente que continua pagando gera <strong className="text-primary">R$ 20/mês</strong>.</p>
          <p>• Sem cadastro vazio, sem multinível — só venda real conta.</p>
        </CardContent>
      </Card>
    </div>
  );
}
