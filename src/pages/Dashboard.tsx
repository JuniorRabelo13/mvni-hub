import { useEffect, useState, useMemo, lazy, Suspense } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Users, Wallet, Activity, TrendingUp, ArrowRight, Network, Calculator, Info, RefreshCcw, AlertCircle, Loader2 } from "lucide-react";
import { sanitize } from "@/lib/sanitize";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { trackEvent } from "@/lib/posthog";

// Lazy loading for future chart components if added
const ChartFallback = () => <Skeleton className="h-[300px] w-full" />;

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
  const [diretos, setDiretos] = useState<number>(10);
  const [indiretos, setIndiretos] = useState<number>(0);
  const [calculandoSimulacao, setCalculandoSimulacao] = useState(false);
  const [simulacaoReal, setSimulacaoReal] = useState<Record<string, unknown> | null>(null);

  // ETAPA 1: Estado do pagamento de cadastro
  const [cadastroPagoEm, setCadastroPagoEm] = useState<string | null | undefined>(undefined);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Toast de checkout cancelado (retorno do Stripe)
  useEffect(() => {
    if (searchParams.get("checkout") === "canceled") {
      toast.info("Checkout cancelado. Quando quiser, retome a ativação por aqui.");
      searchParams.delete("checkout");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);



  // ETAPA 1: Consulta cadastro_pago_em do usuário atual
  useEffect(() => {
    if (!user) return;
    const checkCadastroPago = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("usuarios")
          .select("cadastro_pago_em")
          .eq("id", user.id)
          .maybeSingle();
        if (error) {
          console.error("[DASHBOARD] Erro ao verificar cadastro_pago_em:", error);
          setCadastroPagoEm(null);
          return;
        }
        setCadastroPagoEm(data?.cadastro_pago_em ?? null);
      } catch (err) {
        console.error("[DASHBOARD] Erro inesperado ao verificar cadastro:", err);
        setCadastroPagoEm(null);
      }
    };
    checkCadastroPago();
  }, [user]);

  // ETAPA 1: Handler do botão de ativar cadastro
  const handleAtivarCadastro = async () => {
    setLoadingCheckout(true);
    setCheckoutError(null);
    try {
      const { data, error } = await supabase.functions.invoke(
        "stripe-checkout-cadastro-representante"
      );
      if (error) throw new Error(error.message || "Erro ao iniciar checkout");
      if (!data?.url) throw new Error("URL de checkout não retornada");
      window.location.assign(data.url);
    } catch (err: any) {
      const msg = err?.message || "Erro ao conectar com o servidor. Tente novamente.";
      setCheckoutError(msg);
      toast.error(msg);
    } finally {
      setLoadingCheckout(false);
    }
  };

  const fetchSimulacao = async (numDiretos: number, numIndiretos: number) => {
    setCalculandoSimulacao(true);
    try {
      const { data, error } = await supabase.functions.invoke('calcular-comissao-representante', {
        body: {
          simulate: true,
          diretos: numDiretos,
          indiretos: numIndiretos
        }
      });
      if (error) throw error;
      setSimulacaoReal(data.dados);
    } catch (err) {
      console.error("Erro ao simular:", err);
    } finally {
      setCalculandoSimulacao(false);
    }
  };

  const fetchSimulacaoReal = async (numDiretos: number, numIndiretos: number) => {
    setCalculandoSimulacao(true);
    try {
      const { data, error } = await supabase.functions.invoke('calcular-comissao-representante', {
        body: {
          simulate: true,
          diretos: numDiretos,
          indiretos: numIndiretos
        }
      });
      if (error) throw error;
      setSimulacaoReal(data.dados);
    } catch (err) {
      console.error("Erro ao simular:", err);
    } finally {
      setCalculandoSimulacao(false);
    }
  };

  const simulacao = useMemo(() => {
    // REGRAS OFICIAIS SINCRONIZADAS COM O BACKEND
    const VALOR_ATIVACAO = 80.00;
    const VALOR_RECORRENCIA_DIRETA = 20.00;
    const MULTIPLICADOR_INDIRETO = diretos > 40 ? 10.00 : 5.00;

    const comissaoAtivacao = diretos * VALOR_ATIVACAO;
    const ganhoRecorrenteDireto = diretos * VALOR_RECORRENCIA_DIRETA;
    const ganhoIndireto = indiretos * MULTIPLICADOR_INDIRETO;
    const total = ganhoRecorrenteDireto + ganhoIndireto;

    return {
      comissaoAtivacao,
      ganhoRecorrenteDireto,
      ganhoIndireto,
      total,
      valorPorIndireto: MULTIPLICADOR_INDIRETO,
      faixa: diretos > 40 ? "Acima de 41 associados (Bônus R$ 10)" : (diretos >= 21 ? "Comissão da rede de 21 a 40 associados" : "Abaixo de 21 associados")
    };
  }, [diretos, indiretos]);

  useEffect(() => {

    if (!user) return;
    const load = async () => {
      trackEvent('dashboard_view');
      try {
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
      } catch (err) {
        console.error("[DASHBOARD] Error loading data:", err);
      } finally {
        setLoading(false);
      }
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

      {/* ETAPA 1: Card de ativação de cadastro — exibido apenas quando cadastro_pago_em for null */}
      {cadastroPagoEm === null && (
        <Card className="relative overflow-hidden border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent shadow-[0_0_40px_-15px_rgba(245,158,11,0.35)]">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-500/20 blur-3xl" />
          <CardHeader className="relative">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-amber-500/15 p-2 ring-1 ring-amber-500/30">
                  <AlertCircle className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <CardTitle className="text-amber-300">Ative seu cadastro de representante</CardTitle>
                  <CardDescription className="mt-1 text-sm text-muted-foreground">
                    Pagamento único que libera todo o painel operacional.
                  </CardDescription>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Taxa de ativação</p>
                <p className="text-3xl font-bold text-amber-300">R$ 99,90</p>
                <p className="text-[10px] text-muted-foreground">pagamento único</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative space-y-4">
            <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400" /> Cadastro ilimitado de clientes e linhas</li>
              <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400" /> CRM completo e funil de vendas</li>
              <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400" /> Comissões multinível recorrentes</li>
              <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400" /> App mobile (PWA) incluído</li>
            </ul>
            {checkoutError && (
              <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {checkoutError}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button
                size="lg"
                className="bg-amber-500 font-bold text-black hover:bg-amber-400"
                onClick={handleAtivarCadastro}
                disabled={loadingCheckout}
              >
                {loadingCheckout ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Abrindo checkout seguro…
                  </>
                ) : (
                  <>
                    Ativar meu cadastro
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                Pagamento processado pela Stripe. Ativação automática após a confirmação.
              </p>
            </div>
          </CardContent>
        </Card>
      )}


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
                <TrendingUp className="h-4 w-4 text-primary" /> R$ 80 por venda + R$ 20/mês recorrente
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
          <p>• Cada nova ativação gera R$ 80 imediatos.</p>
          <p>• Cada associado ativo gera R$ 20/mês recorrente.</p>
          <p>• Bônus Indireto: De 21 até 40 associados diretos, você ganha R$ 5 por cada associado indireto.</p>
          <p>• Bônus Indireto Elite: Acima de 40 associados diretos, o bônus indireto dobra para R$ 10 por associado.</p>
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
                onChange={(e) => {
                  const val = Math.max(0, parseInt(e.target.value) || 0);
                  setDiretos(val);
                  trackEvent('simulacao_comissao', { diretos: val, indiretos });
                  if (val >= 21 && indiretos === 0) {
                    setIndiretos(val * 5);
                  }
                }}
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
              <p className="text-[10px] text-primary italic mt-1">Estimativa automática baseada em média mínima de 5 associados por membro da sua rede.</p>
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

            <div className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[10px] uppercase tracking-widest text-primary font-bold">GANHO IMEDIATO DE ATIVAÇÃO</p>
                  <Badge className="bg-gradient-gold text-[8px] h-4 px-1.5 border-none font-bold text-primary-foreground uppercase">Recebimento único</Badge>
                </div>
                <p className="text-2xl font-black text-white">{fmt(simulacao.comissaoAtivacao)}</p>
                <p className="text-[9px] text-primary/70 italic mt-1 font-medium">
                  Pagamento único recebido na entrada de novos associados diretos.
                </p>
              </div>
              <p className="text-[9px] text-primary/70 uppercase font-medium text-right max-w-[120px]">
                Pagamento imediato por novas ativações
              </p>
            </div>

            <div className="grid gap-4 pt-4 border-t border-white/5 sm:grid-cols-5">
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Indicações Diretas</p>
                <p className="text-lg font-semibold transition-all duration-300 animate-in fade-in zoom-in-95">
                  {diretos} associados diretos
                </p>
              </div>
              <div className="space-y-1 relative pr-4 sm:border-r border-white/5">
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">GANHO IMEDIATO DE ATIVAÇÃO</p>
                  <Badge className="bg-gradient-gold text-[7px] h-3.5 w-fit px-1 border-none font-bold text-primary-foreground uppercase leading-none">Recebimento único</Badge>
                </div>
                <p className="text-lg font-semibold transition-all duration-300 animate-in fade-in zoom-in-95">
                  {fmt(simulacao.comissaoAtivacao)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Recorrente Direto</p>
                <p className="text-lg font-semibold transition-all duration-300 animate-in fade-in zoom-in-95">
                  {fmt(simulacao.ganhoRecorrenteDireto)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Bônus Indireto</p>
                <p className="text-lg font-semibold transition-all duration-300 animate-in fade-in zoom-in-95">
                  {fmt(simulacao.ganhoIndireto)}
                </p>
              </div>
              <div className="space-y-1 pt-2 sm:pt-0 sm:text-right border-t sm:border-t-0 sm:border-l border-white/5 sm:pl-4">
                <p className="text-[10px] text-primary uppercase tracking-widest font-bold">GANHO RECORRENTE MENSAL</p>
                <p className="text-3xl font-black text-gradient-gold transition-all duration-300 animate-in fade-in zoom-in-95">
                  {fmt(simulacao.total)}
                </p>
                <p className="text-[9px] text-primary/70 italic mt-1 font-medium">
                  Valor previsto para entrar todos os meses com a rede ativa.
                </p>
              </div>
            </div>

            <div className="mt-6 p-6 rounded-2xl bg-zinc-900/60 border border-primary/20 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-1">Ganho Anual Estimado</p>
                <p className="text-4xl font-black text-white transition-all duration-300 animate-in fade-in zoom-in-95">
                  {fmt(simulacao.total * 12)}
                </p>
                <div className="mt-2 space-y-1">
                  <p className="text-[10px] text-muted-foreground font-medium">
                    Projeção de faturamento total acumulado em 12 meses
                  </p>
                  <p className="text-[11px] text-primary/80 font-bold italic">
                    Em 12 meses sua rede pode ultrapassar: <span className="text-white">{fmt(simulacao.total * 12)}</span>
                  </p>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-primary/5 p-4 border border-primary/10">
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              As comissões de ativação são pagamentos únicos. Os ganhos recorrentes são gerados mensalmente enquanto os associados permanecerem ativos.
            </p>
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-blue-500/5 p-4 border border-blue-500/10">
            <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-blue-400/80 leading-relaxed">
              Esta é uma simulação baseada em associados ativos e adimplentes. Os ganhos reais podem variar conforme o pagamento das mensalidades pelos membros da sua rede.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center pt-4">
        <Button
          className="bg-gradient-gold text-primary-foreground font-bold py-6 px-8 text-lg hover:opacity-90 transition-all shadow-gold-sm rounded-full"
          onClick={() => {
            document.getElementById('cadastro-sessao')?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          Quero alcançar esse faturamento
        </Button>
      </div>

      <div id="cadastro-sessao">
        <Card>
          <CardHeader>
            <CardTitle>Simulador de Ganhos da Rede</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="diretos-rede">Quantidade de associados diretos</Label>
              <Input
                id="diretos-rede"
                type="number"
                min="0"
                value={diretos}
                onChange={(e) => {
                  const val = Math.max(0, parseInt(e.target.value) || 0);
                  setDiretos(val);
                  if (val >= 21) {
                    setIndiretos(val * 5);
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
        }
