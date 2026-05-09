import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Wallet, Activity, TrendingUp, ArrowRight, Network, Calculator, Info } from "lucide-react";
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
  const [diretos, setDiretos] = useState<number>(0);
  const [indiretos, setIndiretos] = useState<number>(0);

  const simulacao = useMemo(() => {
    const ganhoRecorrenteDireto = diretos * 20;
    
    let valorPorIndireto = 0;
    let faixa = "Abaixo de 21 associados";
    
    if (diretos >= 21 && diretos <= 40) {
      valorPorIndireto = 5;
      faixa = "21 a 40 associados (Bônus R$ 5)";
    } else if (diretos >= 41) {
      valorPorIndireto = 10;
      faixa = "Acima de 41 associados (Bônus R$ 10)";
    }
    
    const ganhoIndireto = indiretos * valorPorIndireto;
    const total = ganhoRecorrenteDireto + ganhoIndireto;
    
    return {
      ganhoRecorrenteDireto,
      ganhoIndireto,
      total,
      valorPorIndireto,
      faixa
    };
  }, [diretos, indiretos]);

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
          <p>• Cada venda real (cobrança paga) gera R$ 85 imediatos.</p>
          <p>• Cada cliente ativo gera R$ 20/mês recorrente.</p>
          <p>• De 21 até 40 associados ativos na rede, você ganha R$ 5 por cada novo associado indireto.</p>
          <p>• Sem cadastro vazio, sem multinível — só venda real conta.</p>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-zinc-950/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <CardTitle>Simulador de Ganhos Mensais</CardTitle>
          </div>
          <CardDescription>
            Simule seu potencial de faturamento conforme o crescimento da sua rede.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="diretos" className="text-xs uppercase tracking-widest text-muted-foreground">
                Associados Diretos (Ativos)
              </Label>
              <Input
                id="diretos"
                type="number"
                min="0"
                value={diretos}
                onChange={(e) => setDiretos(Math.max(0, parseInt(e.target.value) || 0))}
                className="bg-zinc-900/50"
              />
              <p className="text-[10px] text-muted-foreground">Gera R$ 20/mês cada.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="indiretos" className="text-xs uppercase tracking-widest text-muted-foreground">
                Associados Indiretos (Rede)
              </Label>
              <Input
                id="indiretos"
                type="number"
                min="0"
                value={indiretos}
                onChange={(e) => setIndiretos(Math.max(0, parseInt(e.target.value) || 0))}
                className="bg-zinc-900/50"
              />
              <p className="text-[10px] text-muted-foreground">Gera bônus conforme sua faixa de diretos.</p>
            </div>
          </div>

          <div className="rounded-2xl bg-zinc-900/40 p-6 border border-white/5">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Faixa de Bonificação</p>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${simulacao.valorPorIndireto > 0 ? 'bg-primary' : 'bg-zinc-700'}`} />
                  <p className="text-sm font-bold text-white">{simulacao.faixa}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Valor por Indireto</p>
                <p className="text-xl font-bold text-primary">{fmt(simulacao.valorPorIndireto)}</p>
              </div>
            </div>

            <div className="grid gap-4 pt-4 border-t border-white/5 sm:grid-cols-3">
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Recorrente Direto</p>
                <p className="text-lg font-semibold">{fmt(simulacao.ganhoRecorrenteDireto)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Bônus Indireto</p>
                <p className="text-lg font-semibold">{fmt(simulacao.ganhoIndireto)}</p>
              </div>
              <div className="space-y-1 pt-2 sm:pt-0 sm:text-right border-t sm:border-t-0 sm:border-l border-white/5 sm:pl-4">
                <p className="text-[10px] text-primary uppercase tracking-widest font-bold">Total Estimado Mensal</p>
                <p className="text-3xl font-black text-gradient-gold">{fmt(simulacao.total)}</p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-blue-500/5 p-4 border border-blue-500/10">
            <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-blue-400/80 leading-relaxed">
              Esta é uma simulação baseada em associados ativos e adimplentes. Os ganhos reais podem variar conforme o pagamento das mensalidades pelos membros da sua rede.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

