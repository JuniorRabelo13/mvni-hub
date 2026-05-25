import { useEffect, useState, useMemo } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { toast } from "sonner";
import { trackEvent } from "@/lib/posthog";
import { Plus, CheckCircle2, Clock, Loader2, QrCode, Search, X, ChevronLeft, ChevronRight, History, ChevronDown, ChevronUp, Check, AlertTriangle, Activity, TrendingUp, Users, Wallet, AlertCircle, BarChart3, Mail, Phone, Hash, Calendar, PhoneCall, CreditCard, Sparkles } from "lucide-react";
import { PixPaymentDialog } from "@/components/PixPaymentDialog";
import { sanitize } from "@/lib/sanitize";
import { useClientesPaginados, type Cliente } from "@/hooks/useClientesPaginados";
import { PaginacaoControles } from "@/components/PaginacaoControles";
import { Skeleton } from "@/components/ui/skeleton";
import { SeletorPlano } from "@/components/SeletorPlano";
import { TimelineAuditoria } from "@/components/TimelineAuditoria";
import { maskCPF, maskPhone } from "@/lib/mask";

const clienteSchema = z.object({
  nome: z.string().trim().min(2).max(80),
  cpf: z.string().trim().max(20).optional(),
  telefone: z.string().trim().max(20).optional(),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  msisdn: z.string().trim().max(20).optional(),
});

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Clientes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedPagamento, setSelectedPagamento] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "ativos" | "inadimplentes" | "suspensos" | "vencendo_hoje">("todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [expandedTimeline, setExpandedTimeline] = useState<string | null>(null);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [isActivatingRecurring, setIsActivatingRecurring] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [recurringValue, setRecurringValue] = useState("99,90");
  const [recurringDay, setRecurringDay] = useState("5");
  const [recurringError, setRecurringError] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleActivateRecurring = async () => {
    if (!selectedCliente) return;
    setIsActivatingRecurring(true);
    setRecurringError("");

    try {
      // 1. Criar cliente no Stripe
      const { data: stripeCustomer, error: stripeError } = await supabase.functions.invoke('stripe-criar-cliente', {
        body: {
          cliente_id: selectedCliente.id,
          nome: selectedCliente.nome,
          email: selectedCliente.email,
          telefone: selectedCliente.telefone
        }
      });

      if (stripeError) throw new Error(stripeError.message || "Erro ao criar cliente no Stripe");
      if (!stripeCustomer?.stripe_customer_id) throw new Error("ID do cliente Stripe não retornado");

      // 2. Criar assinatura (backend agora força o valor oficial de R$ 99,90)
      const { error: subscriptionError } = await supabase.functions.invoke('stripe-criar-assinatura', {
        body: {
          cliente_id: selectedCliente.id,
          stripe_customer_id: stripeCustomer.stripe_customer_id,
          dia_vencimento: parseInt(recurringDay)
        }
      });

      if (subscriptionError) throw new Error(subscriptionError.message || "Erro ao criar assinatura");

      toast.success("Cobrança recorrente ativada com sucesso");
      trackEvent('ativacao_recorrente', { cliente_id: selectedCliente.id });
      setShowRecurringModal(false);
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
    } catch (error: any) {
      setRecurringError(error.message);
    } finally {
      setIsActivatingRecurring(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!selectedCliente) return;
    setIsCancelling(true);

    try {
      const { data, error } = await supabase.functions.invoke('stripe-cancelar-assinatura', {
        body: { cliente_id: selectedCliente.id }
      });

      if (error) throw error;
      if (!data.sucesso) throw new Error(data.mensagem);

      toast.success("Assinatura cancelada com sucesso");
      setShowCancelModal(false);
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      // Para recarregar a seção do cliente atualizado
      queryClient.invalidateQueries({ queryKey: ["clientes", selectedCliente.id] });
      // Fechamos o detalhe para forçar recarregamento na próxima abertura, 
      // ou apenas confiamos no invalidate que atualizará a lista.
      setSelectedCliente(null);

    } catch (error: any) {
      toast.error(error.message || "Erro ao cancelar assinatura");
    } finally {
      setIsCancelling(false);
    }
  };


  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("clientes-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "clientes", filter: `user_id=eq.${user.id}` }, () => {
          queryClient.invalidateQueries({ queryKey: ["clientes", user.id] });
        })
      .on("postgres_changes", { event: "*", schema: "public", table: "pagamentos", filter: `user_id=eq.${user.id}` }, () => {
          queryClient.invalidateQueries({ queryKey: ["clientes", user.id] });
        })
      .on("postgres_changes", { event: "*", schema: "public", table: "linhas", filter: `user_id=eq.${user.id}` }, () => {
          queryClient.invalidateQueries({ queryKey: ["clientes", user.id] });
        })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const { data: paginatedData, isLoading, prefetchNextPage } = useClientesPaginados(user?.id, currentPage, pageSize, { query, status: statusFilter });
  const items = paginatedData?.data || [];
  const totalCount = paginatedData?.count || 0;

  useEffect(() => {
    prefetchNextPage();
  }, [currentPage, items, prefetchNextPage]);

  const { data: allItemsForMetrics = [] } = useQuery({
    queryKey: ["clientes-metrics", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("clientes").select("id, ativo, assinaturas(status, valor), pagamentos(status, valor, data_vencimento)").eq("user_id", user.id);
      return data || [];
    },
    enabled: !!user,
  });

  const metrics = useMemo(() => {
    let mrr = 0;
    let totalRevenue = 0;
    let overdueRevenue = 0;
    const activeClients = allItemsForMetrics.filter((c: any) => c.ativo);
    const today = new Date().toISOString().slice(0, 10);
    
    allItemsForMetrics.forEach((c: any) => {
      // MRR: soma dos valores das assinaturas com status "ativo"
      (c.assinaturas as any[])?.forEach(ass => {
        if (ass.status === "ativo") mrr += Number(ass.valor || 0);
        // Inadimplência: soma dos valores das assinaturas com status "inadimplente"
        else if (ass.status === "inadimplente") overdueRevenue += Number(ass.valor || 0);
      });

      // Receita total: soma dos pagamentos com status "pago"
      (c.pagamentos as any[])?.forEach(pag => {
        if (pag.status === "pago") totalRevenue += Number(pag.valor || 0);
      });
    });

    const activeCount = activeClients.length;
    const averageTicket = activeCount > 0 ? mrr / activeCount : 0;
    return { mrr, totalRevenue, overdueRevenue, activeCount, averageTicket };
  }, [allItemsForMetrics]);

  const filtered = items;

  const createClienteMutation = useMutation({
    mutationFn: async (values: z.infer<typeof clienteSchema>) => {
      if (!user) throw new Error("Usuário não autenticado");
      const { data: cli, error: e1 } = await supabase.from("clientes").insert({ user_id: user.id, nome: values.nome, cpf: values.cpf ?? null, telefone: values.telefone ?? null, email: values.email || null }).select().single();
      if (e1 || !cli) throw new Error("Falha ao criar cliente");
      const { data: linha, error: e2 } = await supabase.from("linhas").insert({ user_id: user.id, cliente_id: cli.id, msisdn: values.msisdn ?? null }).select().single();
      if (e2 || !linha) throw new Error("Falha ao criar linha");
      return cli;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      trackEvent('cadastro_cliente_dashboard', { name: variables.nome });
      trackEvent('ativacao_linha', { msisdn: variables.msisdn });
      setOpen(false);
      toast.success("Cliente cadastrado! Cobrança gerada (pendente).");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = { nome: fd.get("nome") as string, cpf: (fd.get("cpf") as string) || undefined, telefone: (fd.get("telefone") as string) || undefined, email: (fd.get("email") as string) || undefined, msisdn: (fd.get("msisdn") as string) || undefined };
    const parsed = clienteSchema.safeParse(data);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    createClienteMutation.mutate(parsed.data);
  };

  const pagarComPix = (pagamentoId: string) => setSelectedPagamento(pagamentoId);

  const getHealthScore = (cliente: Cliente) => {
    let score = 100;
    const today = new Date().toISOString().slice(0, 10);
    const pagamentos = cliente.pagamentos || [];
    const pendentesAtrasadas = pagamentos.filter(c => c.status === "falhou" && c.data_vencimento < today);
    score -= pendentesAtrasadas.length * 30;
    const pagas = pagamentos.filter(c => c.status === "pago");
    if (pagas.length > 0) score += Math.min(pagas.length * 5, 20);
    else if (pagamentos.length > 0) score -= 10;
    if (!cliente.ativo) score -= 50;
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
              <Button type="submit" className="w-full" disabled={createClienteMutation.isPending}>{createClienteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Cadastrar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-primary/5 border-primary/20"><CardContent className="p-4 flex flex-col gap-1"><div className="flex items-center gap-2 text-muted-foreground"><TrendingUp className="h-4 w-4 text-primary" /><span className="text-[10px] uppercase font-bold tracking-wider">MRR</span></div><span className="text-xl font-bold">{fmt(metrics.mrr)}</span></CardContent></Card>
        <Card><CardContent className="p-4 flex flex-col gap-1"><div className="flex items-center gap-2 text-muted-foreground"><Wallet className="h-4 w-4 text-emerald-500" /><span className="text-[10px] uppercase font-bold tracking-wider">Receita Total</span></div><span className="text-xl font-bold">{fmt(metrics.totalRevenue)}</span></CardContent></Card>
        <Card><CardContent className="p-4 flex flex-col gap-1"><div className="flex items-center gap-2 text-muted-foreground"><AlertCircle className="h-4 w-4 text-red-500" /><span className="text-[10px] uppercase font-bold tracking-wider">Inadimplência</span></div><span className="text-xl font-bold text-red-500">{fmt(metrics.overdueRevenue)}</span></CardContent></Card>
        <Card><CardContent className="p-4 flex flex-col gap-1"><div className="flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4 text-blue-500" /><span className="text-[10px] uppercase font-bold tracking-wider">Ativos</span></div><span className="text-xl font-bold">{metrics.activeCount}</span></CardContent></Card>
        <Card className="col-span-2 md:col-span-1"><CardContent className="p-4 flex flex-col gap-1"><div className="flex items-center gap-2 text-muted-foreground"><BarChart3 className="h-4 w-4 text-amber-500" /><span className="text-[10px] uppercase font-bold tracking-wider">Ticket Médio</span></div><span className="text-xl font-bold">{fmt(metrics.averageTicket)}</span></CardContent></Card>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {[{ id: "todos", label: "Todos" }, { id: "ativos", label: "Ativos" }, { id: "inadimplentes", label: "Inadimplentes" }, { id: "suspensos", label: "Suspensos" }, { id: "vencendo_hoje", label: "Vencendo Hoje" }].map((f) => (
            <Button key={f.id} variant={statusFilter === f.id ? "default" : "outline"} size="sm" onClick={() => { setStatusFilter(f.id as any); setCurrentPage(1); }} className="h-8 rounded-full px-4 text-xs font-medium">{f.label}</Button>
          ))}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" value={query} onChange={(e) => { setQuery(e.target.value); setCurrentPage(1); }} placeholder="Buscar por nome, telefone, CPF ou linha…" className="pl-9 pr-9" aria-label="Buscar clientes" />
          {query && (<button type="button" onClick={() => { setQuery(""); setCurrentPage(1); }} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground" aria-label="Limpar busca"><X className="h-4 w-4" /></button>)}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>
      ) : totalCount === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Nenhum cliente encontrado.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3">
            {items.map((c) => {
              const pendentes = c.pagamentos?.filter((x) => x.status === "falhou") ?? [];
              const linhasAtivas = c.linhas?.filter((l) => l.status === "ativa").length ?? 0;
              return (
                <Card key={c.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedCliente(c)}>
                  <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                    <div><CardTitle className="text-lg">{c.nome}</CardTitle><p className="text-xs text-muted-foreground">{c.telefone ? maskPhone(c.telefone) : c.cpf ? maskCPF(c.cpf) : "—"}</p></div>
                    <div className="flex flex-wrap gap-2">
            {(() => { const health = getHealthScore(c); return (<div className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${health.bg} ${health.color}`}><Activity className="h-3 w-3" />{health.label} ({health.score}%)</div>); })()}
                      {c.assinaturas?.[0]?.status && (
                        <Badge 
                          variant="secondary" 
                          className={
                            c.assinaturas[0].status === 'ativo' ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-none' :
                            c.assinaturas[0].status === 'inadimplente' ? 'bg-red-500 hover:bg-red-600 text-white border-none' :
                            c.assinaturas[0].status === 'suspenso' ? 'bg-amber-500 hover:bg-amber-600 text-white border-none' :
                            c.assinaturas[0].status === 'cancelado' ? 'bg-gray-500 hover:bg-gray-600 text-white border-none' :
                            ''
                          }
                        >
                          {c.assinaturas[0].status.charAt(0).toUpperCase() + c.assinaturas[0].status.slice(1)}
                        </Badge>
                      )}
                      <Badge variant="outline">{linhasAtivas} linha(s)</Badge>
                      <Badge variant={c.ativo ? "default" : "secondary"}>{c.ativo ? "Ativo" : "Inativo"}</Badge>

                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setExpandedTimeline(expandedTimeline === c.id ? null : c.id); }}><History className="h-4 w-4" /></Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4" onClick={(e) => e.stopPropagation()}>
                    {pendentes.map((p) => (
                      <div key={p.id} className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                        <span className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-muted-foreground" /> {fmt(Number(p.valor))} • venc. {new Date(p.data_vencimento).toLocaleDateString("pt-BR")}</span>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => pagarComPix(p.id)}><QrCode className="h-3.5 w-3.5" /> Pagar com PIX</Button>
                      </div>
                    ))}
                    {pendentes.length === 0 && <p className="text-xs text-muted-foreground">Sem cobranças pendentes.</p>}
                    {expandedTimeline === c.id && (
                      <div className="mt-4 space-y-3 border-t border-border pt-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Linha do Tempo</p>
                        <div className="space-y-4">
                          {(() => {
                            const events = [
                              ...(c.pagamentos?.map(pag => ({ date: pag.created_at, title: `Pagamento gerado: ${fmt(Number(pag.valor))}`, type: "cobranca", status: pag.status })) ?? []),
                              ...(c.pagamentos?.filter(pag => pag.data_pagamento).map(pag => ({ date: pag.data_pagamento!, title: `Pagamento confirmado: ${fmt(Number(pag.valor))}`, type: "pagamento", status: "pago" })) ?? []),
                              ...(c.linhas?.filter(l => l.activated_at).map(l => ({ date: l.activated_at!, title: "Linha ativada", type: "ativacao", status: "sucesso" })) ?? []),
                              ...(c.linhas?.filter(l => l.deactivated_at).map(l => ({ date: l.deactivated_at!, title: "Linha suspensa/desativada", type: "suspensao", status: "alerta" })) ?? []),
                              { date: c.created_at, title: "Cliente cadastrado", type: "cadastro", status: "info" }
                            ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                            return events.map((ev, i) => (
                              <div key={i} className="relative flex gap-3 pl-4">
                                <div className="absolute left-0 top-1.5 h-full w-[1px] bg-border last:h-2" />
                                <div className={`absolute left-[-4px] top-1.5 h-2 w-2 rounded-full ${ev.type === "pagamento" ? "bg-emerald-500" : ev.type === "suspensao" ? "bg-red-500" : ev.type === "ativacao" ? "bg-blue-500" : "bg-muted-foreground"}`} />
                                <div className="flex flex-col"><span className="text-sm font-medium">{ev.title}</span><span className="text-[10px] text-muted-foreground">{new Date(ev.date).toLocaleString("pt-BR")}</span></div>
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
          <PaginacaoControles currentPage={currentPage} pageSize={pageSize} totalItems={totalCount} onPageChange={setCurrentPage} onPageSizeChange={(newSize) => { setPageSize(newSize); setCurrentPage(1); }} />
        </div>
      )}
      <PixPaymentDialog pagamentoId={selectedPagamento} onOpenChange={(open) => !open && setSelectedPagamento(null)} onSuccess={() => queryClient.invalidateQueries({ queryKey: ["clientes"] })} />
      <Sheet open={!!selectedCliente} onOpenChange={(open) => !open && setSelectedCliente(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          {selectedCliente && (
            <>
              <SheetHeader className="pb-6 border-b">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">{selectedCliente.nome.charAt(0)}</div>
                  <div>
                    <SheetTitle className="text-xl">{selectedCliente.nome}</SheetTitle>
                    <SheetDescription>Detalhes completos do cliente</SheetDescription>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Badge variant={selectedCliente.ativo ? "default" : "secondary"}>{selectedCliente.ativo ? "Ativo" : "Inativo"}</Badge>
                  {(() => { const health = getHealthScore(selectedCliente); return (<Badge variant="outline" className={`${health.color} ${health.bg} border-none`}>Score: {health.score}%</Badge>); })()}
                  {selectedCliente.planos && (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-none flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> Plano: {selectedCliente.planos.nome}
                    </Badge>
                  )}
                </div>
              </SheetHeader>
              <div className="py-6 space-y-8">
                <section className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Gestão de Plano</span>
                    {(!selectedCliente.assinaturas || !selectedCliente.assinaturas.some(a => a.status === 'ativo')) && (
                      <Dialog open={showRecurringModal} onOpenChange={setShowRecurringModal}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="bg-[#D4AF37] hover:bg-[#B8962E] text-white">Ativar cobrança recorrente</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Ativar cobrança recorrente</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="recurringValue">Valor mensal (R$)</Label>
                              <Input 
                                id="recurringValue" 
                                value="99,90" 
                                disabled
                                className="bg-zinc-900/50"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="recurringDay">Dia de vencimento</Label>
                              <Input 
                                id="recurringDay" 
                                type="number" 
                                min={1} 
                                max={28} 
                                value={recurringDay} 
                                onChange={(e) => setRecurringDay(e.target.value)}
                              />
                            </div>
                            {recurringError && (
                              <p className="text-sm text-red-500">{recurringError}</p>
                            )}
                            <div className="flex justify-end gap-3 pt-4">
                              <Button variant="outline" onClick={() => setShowRecurringModal(false)}>Cancelar</Button>
                              <Button 
                                className="bg-[#D4AF37] hover:bg-[#B8962E] text-white" 
                                onClick={handleActivateRecurring}
                                disabled={isActivatingRecurring}
                              >
                                {isActivatingRecurring ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processando...
                                  </>
                                ) : "Confirmar"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </h3>
                  <SeletorPlano clienteId={selectedCliente.id} planoAtualId={selectedCliente.plano_id || undefined} />
                </section>
                <section className="space-y-4"><h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Users className="h-4 w-4" /> Dados Cadastrais</h3><div className="grid gap-3"><div className="flex items-center gap-3 text-sm p-3 rounded-lg bg-muted/30"><Hash className="h-4 w-4 text-muted-foreground" /><div><p className="text-[10px] uppercase font-bold text-muted-foreground">CPF</p><p className="font-medium">{selectedCliente.cpf ? maskCPF(selectedCliente.cpf) : "Não informado"}</p></div></div><div className="flex items-center gap-3 text-sm p-3 rounded-lg bg-muted/30"><Phone className="h-4 w-4 text-muted-foreground" /><div><p className="text-[10px] uppercase font-bold text-muted-foreground">Telefone</p><p className="font-medium">{selectedCliente.telefone ? maskPhone(selectedCliente.telefone) : "Não informado"}</p></div></div><div className="flex items-center gap-3 text-sm p-3 rounded-lg bg-muted/30"><Calendar className="h-4 w-4 text-muted-foreground" /><div><p className="text-[10px] uppercase font-bold text-muted-foreground">Desde</p><p className="font-medium">{new Date(selectedCliente.created_at).toLocaleDateString("pt-BR")}</p></div></div></div></section>
                <section className="space-y-4"><h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2"><PhoneCall className="h-4 w-4" /> Linhas e Conectividade</h3><div className="space-y-2">{selectedCliente.linhas?.map(linha => (<div key={linha.id} className="flex items-center justify-between p-3 rounded-lg border border-border"><div className="flex items-center gap-3"><div className={`h-2 w-2 rounded-full ${linha.status === 'ativa' ? 'bg-emerald-500' : 'bg-red-500'}`} /><div><p className="text-sm font-bold">{linha.msisdn || "Sem número"}</p><p className="text-[10px] text-muted-foreground uppercase tracking-tight">{linha.status}</p></div></div>{linha.activated_at && (<span className="text-[10px] text-muted-foreground">Ativada em {new Date(linha.activated_at).toLocaleDateString("pt-BR")}</span>)}</div>))}</div></section>
                <section className="space-y-4"><h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2"><CreditCard className="h-4 w-4" /> Histórico Financeiro</h3><div className="space-y-3">{selectedCliente.pagamentos?.sort((a, b) => new Date(b.data_vencimento).getTime() - new Date(a.data_vencimento).getTime()).map(pag => (<div key={pag.id} className="p-3 rounded-lg bg-muted/30 flex items-center justify-between border-l-4 border-l-border" style={{ borderLeftColor: pag.status === 'pago' ? '#10b981' : '#f59e0b' }}><div><p className="text-sm font-bold">{fmt(Number(pag.valor))}</p><p className="text-[10px] text-muted-foreground">Venc. {new Date(pag.data_vencimento).toLocaleDateString("pt-BR")}</p></div><Badge variant={pag.status === 'pago' ? 'default' : 'outline'} className={pag.status === 'pago' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>{pag.status.charAt(0).toUpperCase() + pag.status.slice(1)}</Badge></div>))}</div><TimelineAuditoria clienteId={selectedCliente.id} /></section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
