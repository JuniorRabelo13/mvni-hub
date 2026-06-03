import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Phone, Mail, Calendar, TrendingUp, MessageSquare, CheckCircle2, Loader2 } from "lucide-react";

type LeadStatus = "novo" | "em_contato" | "em_negociacao" | "convertido" | "perdido";
type InteractionType = "ligacao" | "mensagem" | "reuniao" | "email" | "nota" | "outro";

interface Lead {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  origem: string | null;
  status: LeadStatus;
  valor_mensal_estimado: number | null;
  comissao_ativacao_estimada: number | null;
  comissao_recorrente_estimada: number | null;
  proximo_contato_em: string | null;
  observacao: string | null;
  cliente_id: string | null;
  convertido_em: string | null;
  created_at: string;
}

interface Interaction {
  id: string;
  lead_id: string;
  tipo: InteractionType;
  descricao: string;
  created_at: string;
}

const STATUS_LABELS: Record<LeadStatus, string> = {
  novo: "Novos",
  em_contato: "Em contato",
  em_negociacao: "Em negociação",
  convertido: "Convertidos",
  perdido: "Perdidos",
};

const STATUS_COLORS: Record<LeadStatus, string> = {
  novo: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  em_contato: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  em_negociacao: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  convertido: "bg-green-500/10 text-green-400 border-green-500/30",
  perdido: "bg-red-500/10 text-red-400 border-red-500/30",
};

const FUNNEL_ORDER: LeadStatus[] = ["novo", "em_contato", "em_negociacao", "convertido", "perdido"];

const fmtBRL = (v: number | null | undefined) =>
  (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function CRM() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [openNew, setOpenNew] = useState(false);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [newInteraction, setNewInteraction] = useState<{ tipo: InteractionType; descricao: string }>({
    tipo: "nota",
    descricao: "",
  });

  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    email: "",
    origem: "",
    observacao: "",
    proximo_contato_em: "",
  });

  const loadLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("crm_leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Erro ao carregar leads: " + error.message);
    } else {
      setLeads((data as Lead[]) || []);
    }
    setLoading(false);
  };

  const loadInteractions = async (leadId: string) => {
    const { data, error } = await supabase
      .from("crm_interactions")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false });
    if (!error) setInteractions((data as Interaction[]) || []);
  };

  useEffect(() => {
    loadLeads();
  }, []);

  useEffect(() => {
    if (selected) loadInteractions(selected.id);
  }, [selected?.id]);

  const handleCreate = async () => {
    if (!user) return;
    if (!form.nome.trim()) {
      toast.error("Informe o nome do lead");
      return;
    }
    setCreating(true);
    const { error } = await supabase.from("crm_leads").insert({
      user_id: user.id,
      nome: form.nome.trim(),
      telefone: form.telefone || null,
      email: form.email || null,
      origem: form.origem || null,
      observacao: form.observacao || null,
      proximo_contato_em: form.proximo_contato_em || null,
      status: "novo",
    });
    setCreating(false);
    if (error) {
      toast.error("Erro ao criar lead: " + error.message);
      return;
    }
    toast.success("Lead criado");
    setOpenNew(false);
    setForm({ nome: "", telefone: "", email: "", origem: "", observacao: "", proximo_contato_em: "" });
    loadLeads();
  };

  const updateStatus = async (leadId: string, status: LeadStatus) => {
    const patch: { status: LeadStatus; convertido_em?: string } = { status };
    if (status === "convertido") patch.convertido_em = new Date().toISOString();
    const { error } = await supabase.from("crm_leads").update(patch).eq("id", leadId);
    if (error) {
      toast.error("Erro: " + error.message);
      return;
    }
    toast.success("Status atualizado");
    loadLeads();
    if (selected?.id === leadId) {
      setSelected({ ...selected, status, convertido_em: status === "convertido" ? new Date().toISOString() : selected.convertido_em });
    }
  };

  const addInteraction = async () => {
    if (!user || !selected || !newInteraction.descricao.trim()) return;
    const { error } = await supabase.from("crm_interactions").insert({
      lead_id: selected.id,
      user_id: user.id,
      tipo: newInteraction.tipo,
      descricao: newInteraction.descricao.trim(),
    });
    if (error) {
      toast.error("Erro: " + error.message);
      return;
    }
    setNewInteraction({ tipo: "nota", descricao: "" });
    loadInteractions(selected.id);
  };

  const grouped = useMemo(() => {
    const g: Record<LeadStatus, Lead[]> = {
      novo: [], em_contato: [], em_negociacao: [], convertido: [], perdido: [],
    };
    leads.forEach((l) => g[l.status].push(l));
    return g;
  }, [leads]);

  const totals = useMemo(() => {
    const ativos = leads.filter((l) => l.status !== "perdido" && l.status !== "convertido");
    const potencialAtivacao = ativos.reduce((s, l) => s + Number(l.comissao_ativacao_estimada || 0), 0);
    const potencialRecorrente = ativos.reduce((s, l) => s + Number(l.comissao_recorrente_estimada || 0), 0);
    const convertidos = leads.filter((l) => l.status === "convertido").length;
    return { potencialAtivacao, potencialRecorrente, convertidos, abertos: ativos.length };
  }, [leads]);

  const proximosContatos = useMemo(
    () =>
      leads
        .filter((l) => l.proximo_contato_em && l.status !== "convertido" && l.status !== "perdido")
        .sort((a, b) => new Date(a.proximo_contato_em!).getTime() - new Date(b.proximo_contato_em!).getTime())
        .slice(0, 5),
    [leads]
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">CRM do Representante</h1>
          <p className="text-sm text-muted-foreground">Funil de vendas, leads e oportunidades</p>
        </div>
        <Dialog open={openNew} onOpenChange={setOpenNew}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4" /> Novo Lead</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Lead</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nome *</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Telefone</Label><Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></div>
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              </div>
              <div><Label>Origem</Label><Input placeholder="Indicação, Instagram, WhatsApp..." value={form.origem} onChange={(e) => setForm({ ...form, origem: e.target.value })} /></div>
              <div><Label>Próximo contato</Label><Input type="datetime-local" value={form.proximo_contato_em} onChange={(e) => setForm({ ...form, proximo_contato_em: e.target.value })} /></div>
              <div><Label>Observação</Label><Textarea value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenNew(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={creating}>{creating && <Loader2 className="w-4 h-4 animate-spin" />} Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Leads abertos</div><div className="text-2xl font-bold mt-1">{totals.abertos}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Convertidos</div><div className="text-2xl font-bold mt-1 text-green-400">{totals.convertidos}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Potencial ativação</div><div className="text-2xl font-bold mt-1">{fmtBRL(totals.potencialAtivacao)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Recorrência potencial/mês</div><div className="text-2xl font-bold mt-1">{fmtBRL(totals.potencialRecorrente)}</div></CardContent></Card>
      </div>

      {/* Próximos contatos */}
      {proximosContatos.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calendar className="w-4 h-4" /> Próximos contatos</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {proximosContatos.map((l) => (
              <div key={l.id} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0">
                <span className="font-medium">{l.nome}</span>
                <span className="text-muted-foreground">{new Date(l.proximo_contato_em!).toLocaleString("pt-BR")}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Funil Kanban */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {FUNNEL_ORDER.map((s) => (
            <div key={s} className="bg-card border border-border rounded-lg p-3 min-h-[200px]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">{STATUS_LABELS[s]}</h3>
                <Badge variant="outline" className={STATUS_COLORS[s]}>{grouped[s].length}</Badge>
              </div>
              <div className="space-y-2">
                {grouped[s].map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setSelected(l)}
                    className="w-full text-left p-3 bg-background hover:bg-accent rounded border border-border transition-colors"
                  >
                    <div className="font-medium text-sm truncate">{l.nome}</div>
                    {l.telefone && <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Phone className="w-3 h-3" />{l.telefone}</div>}
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" />{fmtBRL(l.comissao_ativacao_estimada)} + {fmtBRL(l.comissao_recorrente_estimada)}/mês</div>
                  </button>
                ))}
                {grouped[s].length === 0 && <p className="text-xs text-muted-foreground italic">Nenhum lead</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detalhe do lead */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selected.nome}
                  <Badge variant="outline" className={STATUS_COLORS[selected.status]}>{STATUS_LABELS[selected.status]}</Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {selected.telefone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" />{selected.telefone}</div>}
                  {selected.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" />{selected.email}</div>}
                  {selected.origem && <div className="text-muted-foreground">Origem: {selected.origem}</div>}
                  {selected.proximo_contato_em && <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" />{new Date(selected.proximo_contato_em).toLocaleString("pt-BR")}</div>}
                </div>

                <Card className="bg-muted/30">
                  <CardContent className="p-3 text-sm">
                    <div className="font-semibold mb-1 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Potencial de comissão</div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div><div className="text-muted-foreground">Mensalidade</div><div className="font-medium">{fmtBRL(selected.valor_mensal_estimado)}</div></div>
                      <div><div className="text-muted-foreground">Ativação</div><div className="font-medium">{fmtBRL(selected.comissao_ativacao_estimada)}</div></div>
                      <div><div className="text-muted-foreground">Recorrente/mês</div><div className="font-medium">{fmtBRL(selected.comissao_recorrente_estimada)}</div></div>
                    </div>
                  </CardContent>
                </Card>

                {selected.observacao && (
                  <div className="text-sm"><div className="text-xs text-muted-foreground mb-1">Observação</div><p>{selected.observacao}</p></div>
                )}

                <div>
                  <Label className="text-xs">Alterar status</Label>
                  <Select value={selected.status} onValueChange={(v) => updateStatus(selected.id, v as LeadStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FUNNEL_ORDER.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {selected.status !== "convertido" && (
                  <Button className="w-full" onClick={() => updateStatus(selected.id, "convertido")}>
                    <CheckCircle2 className="w-4 h-4" /> Transformar em cliente
                  </Button>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-2"><MessageSquare className="w-4 h-4" /><span className="font-semibold text-sm">Histórico de interações</span></div>
                  <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                    {interactions.length === 0 && <p className="text-xs text-muted-foreground italic">Sem interações ainda</p>}
                    {interactions.map((i) => (
                      <div key={i.id} className="text-sm p-2 bg-muted/30 rounded">
                        <div className="flex justify-between text-xs text-muted-foreground"><span className="uppercase">{i.tipo}</span><span>{new Date(i.created_at).toLocaleString("pt-BR")}</span></div>
                        <p className="mt-1">{i.descricao}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Select value={newInteraction.tipo} onValueChange={(v) => setNewInteraction({ ...newInteraction, tipo: v as InteractionType })}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ligacao">Ligação</SelectItem>
                        <SelectItem value="mensagem">Mensagem</SelectItem>
                        <SelectItem value="reuniao">Reunião</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="nota">Nota</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input placeholder="Descreva a interação..." value={newInteraction.descricao} onChange={(e) => setNewInteraction({ ...newInteraction, descricao: e.target.value })} onKeyDown={(e) => e.key === "Enter" && addInteraction()} />
                    <Button onClick={addInteraction} disabled={!newInteraction.descricao.trim()}>Add</Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
