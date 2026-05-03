import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Users, Activity, Wallet, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Profile = { id: string; nome: string; indicador_id: string | null; status: string };
type Stats = { clientesAtivos: number; linhasAtivas: number; ganhoMes: number };

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type Filter = "todos" | "ativos" | "inativos" | "pagantes";

export default function Estrutura() {
  const { effectiveUser: user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [stats, setStats] = useState<Record<string, Stats>>({});
  const [pagantes, setPagantes] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<Filter>("todos");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // Pega todos os profiles (RLS permite leitura para autenticados — necessário para árvore)
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, nome, indicador_id, status");
      setProfiles((profs as Profile[]) ?? []);
      setExpanded(new Set([user.id]));

      const inicioMes = new Date();
      inicioMes.setDate(1); inicioMes.setHours(0, 0, 0, 0);

      const [clientesRes, linhasRes, comRes] = await Promise.all([
        supabase.from("clientes").select("user_id").eq("ativo", true),
        supabase.from("linhas").select("user_id").eq("status", "ativa"),
        supabase.from("comissoes").select("user_id, valor").gte("created_at", inicioMes.toISOString()),
      ]);

      const acc: Record<string, Stats> = {};
      const ensure = (id: string) => (acc[id] ??= { clientesAtivos: 0, linhasAtivas: 0, ganhoMes: 0 });
      (clientesRes.data ?? []).forEach((r: any) => ensure(r.user_id).clientesAtivos++);
      (linhasRes.data ?? []).forEach((r: any) => ensure(r.user_id).linhasAtivas++);
      (comRes.data ?? []).forEach((r: any) => (ensure(r.user_id).ganhoMes += Number(r.valor)));
      setStats(acc);

      // pagantes = quem tem ao menos 1 cobrança paga
      const { data: pagas } = await supabase.from("cobrancas").select("user_id").eq("status", "pago");
      setPagantes(new Set((pagas ?? []).map((p: any) => p.user_id)));
      setLoading(false);
    };
    load();
  }, [user]);

  const childrenOf = useMemo(() => {
    const m = new Map<string | null, Profile[]>();
    profiles.forEach((p) => {
      const arr = m.get(p.indicador_id) ?? [];
      arr.push(p);
      m.set(p.indicador_id, arr);
    });
    return m;
  }, [profiles]);

  const matches = (p: Profile) => {
    if (filter === "ativos") return p.status === "ativo";
    if (filter === "inativos") return p.status === "inativo";
    if (filter === "pagantes") return pagantes.has(p.id);
    return true;
  };

  // Total recursivo da rede (para metric cards do topo, da raiz = usuário atual)
  const totals = useMemo(() => {
    const t = { users: 0, linhas: 0, ganhoMes: 0 };
    const visit = (id: string) => {
      const s = stats[id];
      t.users++;
      if (s) { t.linhas += s.linhasAtivas; t.ganhoMes += s.ganhoMes; }
      (childrenOf.get(id) ?? []).forEach((c) => visit(c.id));
    };
    if (user) (childrenOf.get(user.id) ?? []).forEach((c) => visit(c.id));
    return t;
  }, [childrenOf, stats, user]);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const copyLink = () => {
    if (!user) return;
    const url = `${window.location.origin}/auth?ref=${user.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link de indicação copiado!");
  };

  const renderNode = (p: Profile, depth: number): JSX.Element | null => {
    if (!matches(p)) return null;
    const kids = childrenOf.get(p.id) ?? [];
    const isOpen = expanded.has(p.id);
    const s = stats[p.id] ?? { clientesAtivos: 0, linhasAtivas: 0, ganhoMes: 0 };
    return (
      <div key={p.id} className="space-y-2">
        <div
          className={cn(
            "group flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-primary/40",
            p.id === user?.id && "border-primary/50 bg-primary/5",
          )}
          style={{ marginLeft: depth * 16 }}
        >
          <button
            type="button"
            onClick={() => toggle(p.id)}
            disabled={kids.length === 0}
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded transition-transform",
              kids.length > 0 ? "hover:bg-muted" : "opacity-30",
              isOpen && "rotate-90",
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {p.nome} {p.id === user?.id && <span className="text-xs text-primary">(você)</span>}
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {s.clientesAtivos} ativos</span>
              <span className="inline-flex items-center gap-1"><Activity className="h-3 w-3" /> {s.linhasAtivas} linhas</span>
              <span className="inline-flex items-center gap-1 text-primary"><Wallet className="h-3 w-3" /> {fmt(s.ganhoMes)}/mês</span>
            </div>
          </div>
          <Badge variant={p.status === "ativo" ? "default" : "secondary"} className="shrink-0">
            {p.status}
          </Badge>
        </div>
        {isOpen && kids.length > 0 && (
          <div className="space-y-2 border-l border-border/60" style={{ marginLeft: depth * 16 + 12 }}>
            {kids.map((k) => renderNode(k, depth + 1)).filter(Boolean)}
          </div>
        )}
      </div>
    );
  };

  const me = profiles.find((p) => p.id === user?.id);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Estrutura de indicações</p>
          <h1 className="mt-1 text-3xl font-bold">Quem entrou através de você</h1>
        </div>
        <Button variant="outline" onClick={copyLink}>
          <Copy className="h-4 w-4" /> Copiar link de indicação
        </Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Pessoas na sua rede</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{totals.users}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Linhas ativas (rede)</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{totals.linhas}</p></CardContent></Card>
        <Card className="border-primary/40"><CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Ganho da rede (mês)</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-gradient-gold">{fmt(totals.ganhoMes)}</p></CardContent></Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["todos", "ativos", "inativos", "pagantes"] as Filter[]).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
            {f[0].toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Sua árvore</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : me ? (
            renderNode(me, 0)
          ) : (
            <p className="text-sm text-muted-foreground">Sem dados.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
