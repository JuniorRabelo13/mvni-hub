import { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, CheckCircle2, Clock, Loader2, QrCode, Search, X, ChevronLeft, ChevronRight, History, ChevronDown, ChevronUp, Check, AlertTriangle, Activity, TrendingUp, Users, Wallet, AlertCircle, BarChart3 } from "lucide-react";
import { PixPaymentDialog } from "@/components/PixPaymentDialog";
import { sanitize } from "@/lib/sanitize";

const clienteSchema = z.object({
  nome: z.string().trim().min(2).max(80),
  cpf: z.string().trim().max(20).optional(),
  telefone: z.string().trim().max(20).optional(),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  msisdn: z.string().trim().max(20).optional(),
});

type Cliente = {
  id: string;
  nome: string;
  cpf: string | null;
  telefone: string | null;
  ativo: boolean;
  created_at: string;
  linhas: { id: string; status: string; msisdn: string | null; activated_at: string | null; deactivated_at: string | null }[];
  cobrancas: { id: string; status: string; valor: number; vencimento: string; paid_at: string | null; created_at: string }[];
};

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Clientes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedCobranca, setSelectedCobranca] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "ativos" | "inadimplentes" | "suspensos" | "vencendo_hoje">("todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedTimeline, setExpandedTimeline] = useState<string | null>(null);
  const itemsPerPage = 20;

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("clientes-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "clientes",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["clientes", user.id] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cobrancas",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["clientes", user.id] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "linhas",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["clientes", user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["clientes", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("clientes")
        .select("id, nome, cpf, telefone, ativo, created_at, linhas(id,status,msisdn,activated_at,deactivated_at), cobrancas(id,status,valor,vencimento,paid_at,created_at)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      return sanitize((data as any) ?? [], "clientes_list", user.id) as Cliente[];
    },
    enabled: !!user,
  });

  const createClienteMutation = useMutation({
    mutationFn: async (values: z.infer<typeof clienteSchema>) => {
      if (!user) throw new Error("Usuário não autenticado");
      
      const { data: cli, error: e1 } = await supabase
        .from("clientes")
        .insert({
          user_id: user.id,
          nome: values.nome,
          cpf: values.cpf ?? null,
          telefone: values.telefone ?? null,
          email: values.email || null,
        })
        .select()
        .single();
        
      if (e1 || !cli) throw new Error("Falha ao criar cliente");

      const { data: linha, error: e2 } = await supabase
        .from("linhas")
        .insert({ user_id: user.id, cliente_id: cli.id, msisdn: values.msisdn ?? null })
        .select()
        .single();
        
      if (e2 || !linha) throw new Error("Falha ao criar linha");

      const venc = new Date();
      venc.setDate(venc.getDate() + 7);
      
      const { error: e3 } = await supabase.from("cobrancas").insert({
        user_id: user.id,
        cliente_id: cli.id,
        linha_id: linha.id,
        vencimento: venc.toISOString().slice(0, 10),
        is_primeira: true,
      });
      
      if (e3) throw new Error("Falha ao criar cobrança");
      
      return cli;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      setOpen(false);
      toast.success("Cliente cadastrado! Cobrança gerada (pendente).");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [query, statusFilter]);

  const normalize = (s: string | null | undefined) =>
    (s ?? "").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const onlyDigits = (s: string | null | undefined) => (s ?? "").toString().replace(/\D/g, "");

  const filtered = useMemo(() => {
    let result = items;
    const today = new Date().toISOString().slice(0, 10);
    
    if (statusFilter === "ativos") {
      result = result.filter(c => c.ativo);
    } else if (statusFilter === "inadimplentes") {
      result = result.filter(c => c.cobrancas?.some(p => p.status === "pendente" && p.vencimento < today));
    } else if (statusFilter === "suspensos") {
      result = result.filter(c => !c.ativo);
    } else if (statusFilter === "vencendo_hoje") {
      result = result.filter(c => c.cobrancas?.some(p => p.status === "pendente" && p.vencimento === today));
    }

    const q = query.trim();
    if (!q) return result;
    const qn = normalize(q);
    const qd = onlyDigits(q);
    return result.filter((c) => {
      if (normalize(c.nome).includes(qn)) return true;
      if (qd && onlyDigits(c.cpf).includes(qd)) return true;
      if (qd && onlyDigits(c.telefone).includes(qd)) return true;
      if (qd && c.linhas?.some((l) => onlyDigits(l.msisdn).includes(qd))) return true;
      return false;
    });
  }, [items, query, statusFilter]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      nome: fd.get("nome") as string,
      cpf: (fd.get("cpf") as string) || undefined,
      telefone: (fd.get("telefone") as string) || undefined,
      email: (fd.get("email") as string) || undefined,
      msisdn: (fd.get("msisdn") as string) || undefined,
    };
    
    const parsed = clienteSchema.safeParse(data);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    
    createClienteMutation.mutate(parsed.data);
  };

  const pagarComPix = (cobrancaId: string) => {
    setSelectedCobranca(cobrancaId);
  };

  const metrics = useMemo(() => {
    const active = items.filter(c => c.ativo);
    const mrr = active.length * 99.90;
    
    let totalRevenue = 0;
    let overdueRevenue = 0;
    const today = new Date().toISOString().slice(0, 10);
    
    items.forEach(c => {
      c.cobrancas?.forEach(cob => {
        if (cob.status === "pago") {
          totalRevenue += Number(cob.valor);
        } else if (cob.status === "pendente" && cob.vencimento < today) {
          overdueRevenue += Number(cob.valor);
        }
      });
    });

    const activeCount = active.length;
    const averageTicket = activeCount > 0 ? mrr / activeCount : 0;

    return {
      mrr,
      totalRevenue,
      overdueRevenue,
      activeCount,
      averageTicket
    };
  }, [items]);

  const paginatedItems = useMemo(() => {
    return filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filtered, currentPage]);

  const getHealthScore = (cliente: Cliente) => {
    let score = 100;
    const today = new Date().toISOString().slice(0, 10);
    const cobrancas = cliente.cobrancas || [];
    
    // Impacto de atrasos e pendências
    const pendentesAtrasadas = cobrancas.filter(c => c.status === "pendente" && c.vencimento < today);
    score -= pendentesAtrasadas.length * 30;
    
    // Impacto de histórico de pagamentos
    const pagas = cobrancas.filter(c => c.status === "pago");
    if (pagas.length > 0) {
      score += Math.min(pagas.length * 5, 20); // Recompensa por recorrência
    } else if (cobrancas.length > 0) {
      score -= 10; // Penalidade por nunca ter pago
    }
    
    // Estado atual do cliente
    if (!cliente.ativo) score -= 50;
    
    // Normalizar entre 0 e 100
    score = Math.max(0, Math.min(100, score));
    
    if (score >= 80) return { label: "Saudável", color: "text-emerald-500", bg: "bg-emerald-500/10", score };
    if (score >= 50) return { label: "Risco Moderado", color: "text-amber-500", bg: "bg-amber-500/10", score };
    return { label: "Risco de Churn", color: "text-red-500", bg: "bg-red-500/10", score };
  };

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Sua carteira</p>
          <h1 className="mt-1 text-3xl font-bold">Clientes</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4" /> Novo cliente</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Cadastrar cliente</DialogTitle></DialogHeader>
            <form onSubmit={onSubmit} className="space-y-3">
              <div className="space-y-1.5"><Label htmlFor="nome">Nome</Label><Input id="nome" name="nome" required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label htmlFor="cpf">CPF</Label><Input id="cpf" name="cpf" /></div>
                <div className="space-y-1.5"><Label htmlFor="telefone">Telefone</Label><Input id="telefone" name="telefone" /></div>
              </div>
              <div className="space-y-1.5"><Label htmlFor="email">E-mail</Label><Input id="email" name="email" type="email" /></div>
              <div className="space-y-1.5"><Label htmlFor="msisdn">Linha (MSISDN)</Label><Input id="msisdn" name="msisdn" placeholder="11999999999" /></div>
              <p className="text-xs text-muted-foreground">Plano R$ 99,90 — comissão de R$ 85 ao confirmar pagamento.</p>
              <Button type="submit" className="w-full" disabled={createClienteMutation.isPending}>
                {createClienteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Cadastrar
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-[10px] uppercase font-bold tracking-wider">MRR</span>
            </div>
            <span className="text-xl font-bold">{fmt(metrics.mrr)}</span>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wallet className="h-4 w-4 text-emerald-500" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Receita Total</span>
            </div>
            <span className="text-xl font-bold">{fmt(metrics.totalRevenue)}</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Inadimplência</span>
            </div>
            <span className="text-xl font-bold text-red-500">{fmt(metrics.overdueRevenue)}</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Ativos</span>
            </div>
            <span className="text-xl font-bold">{metrics.activeCount}</span>
          </CardContent>
        </Card>

        <Card className="col-span-2 md:col-span-1">
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <BarChart3 className="h-4 w-4 text-amber-500" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Ticket Médio</span>
            </div>
            <span className="text-xl font-bold">{fmt(metrics.averageTicket)}</span>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {[
            { id: "todos", label: "Todos" },
            { id: "ativos", label: "Ativos" },
            { id: "inadimplentes", label: "Inadimplentes" },
            { id: "suspensos", label: "Suspensos" },
            { id: "vencendo_hoje", label: "Vencendo Hoje" },
          ].map((f) => (
            <Button
              key={f.id}
              variant={statusFilter === f.id ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(f.id as any)}
              className="h-8 rounded-full px-4 text-xs font-medium"
            >
              {f.label}
            </Button>
          ))}
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome, telefone, CPF ou linha…"
            className="pl-9 pr-9"
            aria-label="Buscar clientes"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
              aria-label="Limpar busca"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : items.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">
          Nenhum cliente ainda. Cadastre o primeiro para começar a faturar.
        </CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">
          Nenhum cliente encontrado para "{query}".
        </CardContent></Card>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3">
            {filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((c) => {
              const pendentes = c.cobrancas?.filter((x) => x.status === "pendente") ?? [];
              const linhasAtivas = c.linhas?.filter((l) => l.status === "ativa").length ?? 0;
              return (
                <Card key={c.id}>
                  <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                    <div>
                      <CardTitle className="text-lg">{c.nome}</CardTitle>
                      <p className="text-xs text-muted-foreground">{c.telefone ?? c.cpf ?? "—"}</p>
                    </div>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const health = getHealthScore(c);
                      return (
                        <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${health.bg} ${health.color}`}>
                          <Activity className="h-3 w-3" />
                          {health.label} ({health.score}%)
                        </div>
                      );
                    })()}
                    <Badge variant="outline">{linhasAtivas} linha(s)</Badge>
                    <Badge variant={c.ativo ? "default" : "secondary"}>{c.ativo ? "Ativo" : "Inativo"}</Badge>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={() => setExpandedTimeline(expandedTimeline === c.id ? null : c.id)}
                    >
                      <History className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pendentes.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                      <span className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-muted-foreground" /> {fmt(Number(p.valor))} • venc. {new Date(p.vencimento).toLocaleDateString("pt-BR")}</span>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => pagarComPix(p.id)}>
                        <QrCode className="h-3.5 w-3.5" /> Pagar com PIX
                      </Button>
                    </div>
                  ))}
                  {pendentes.length === 0 && (
                    <p className="text-xs text-muted-foreground">Sem cobranças pendentes.</p>
                  )}

                  {expandedTimeline === c.id && (
                    <div className="mt-4 space-y-3 border-t border-border pt-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Linha do Tempo</p>
                      <div className="space-y-4">
                        {(() => {
                          const events = [
                            ...(c.cobrancas?.map(cob => ({
                              date: cob.created_at,
                              title: `Cobrança gerada: ${fmt(Number(cob.valor))}`,
                              type: "cobranca",
                              status: cob.status
                            })) ?? []),
                            ...(c.cobrancas?.filter(cob => cob.paid_at).map(cob => ({
                              date: cob.paid_at!,
                              title: `Pagamento confirmado: ${fmt(Number(cob.valor))}`,
                              type: "pagamento",
                              status: "pago"
                            })) ?? []),
                            ...(c.linhas?.filter(l => l.activated_at).map(l => ({
                              date: l.activated_at!,
                              title: "Linha ativada",
                              type: "ativacao",
                              status: "sucesso"
                            })) ?? []),
                            ...(c.linhas?.filter(l => l.deactivated_at).map(l => ({
                              date: l.deactivated_at!,
                              title: "Linha suspensa/desativada",
                              type: "suspensao",
                              status: "alerta"
                            })) ?? []),
                            {
                              date: c.created_at,
                              title: "Cliente cadastrado",
                              type: "cadastro",
                              status: "info"
                            }
                          ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                          return events.map((ev, i) => (
                            <div key={i} className="relative flex gap-3 pl-4">
                              <div className="absolute left-0 top-1.5 h-full w-[1px] bg-border last:h-2" />
                              <div className={`absolute left-[-4px] top-1.5 h-2 w-2 rounded-full ${
                                ev.type === "pagamento" ? "bg-emerald-500" : 
                                ev.type === "suspensao" ? "bg-red-500" : 
                                ev.type === "ativacao" ? "bg-blue-500" : "bg-muted-foreground"
                              }`} />
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">{ev.title}</span>
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(ev.date).toLocaleString("pt-BR")}
                                </span>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  )}
                </CardContent>
                </Card>
              );
            })}
          </div>

          {filtered.length > itemsPerPage && (
            <div className="flex items-center justify-between py-2">
              <p className="text-sm text-muted-foreground">
                Mostrando {Math.min(filtered.length, (currentPage - 1) * itemsPerPage + 1)} a {Math.min(filtered.length, currentPage * itemsPerPage)} de {filtered.length} clientes
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filtered.length / itemsPerPage), prev + 1))}
                  disabled={currentPage === Math.ceil(filtered.length / itemsPerPage)}
                >
                  Próximo <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <PixPaymentDialog 
        cobrancaId={selectedCobranca} 
        onOpenChange={(open) => !open && setSelectedCobranca(null)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["clientes"] })}
      />
    </div>
  );
}
