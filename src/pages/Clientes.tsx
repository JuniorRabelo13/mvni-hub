import { useEffect, useState } from "react";
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
import { Plus, CheckCircle2, Clock, Loader2, QrCode, Search, X } from "lucide-react";
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
  linhas: { id: string; status: string; msisdn: string | null }[];
  cobrancas: { id: string; status: string; valor: number; vencimento: string }[];
};

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Clientes() {
  const { user, effectiveUser } = useAuth();
  const [items, setItems] = useState<Cliente[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCobranca, setSelectedCobranca] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const normalize = (s: string | null | undefined) =>
    (s ?? "").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const onlyDigits = (s: string | null | undefined) => (s ?? "").toString().replace(/\D/g, "");

  const filtered = (() => {
    const q = query.trim();
    if (!q) return items;
    const qn = normalize(q);
    const qd = onlyDigits(q);
    return items.filter((c) => {
      if (normalize(c.nome).includes(qn)) return true;
      if (qd && onlyDigits(c.cpf).includes(qd)) return true;
      if (qd && onlyDigits(c.telefone).includes(qd)) return true;
      if (qd && c.linhas?.some((l) => onlyDigits(l.msisdn).includes(qd))) return true;
      return false;
    });
  })();

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("clientes")
      .select("id, nome, cpf, telefone, ativo, created_at, linhas(id,status,msisdn), cobrancas(id,status,valor,vencimento)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    
    setItems(sanitize((data as any) ?? [], "clientes_list", user.id));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const fd = new FormData(e.currentTarget);
    const parsed = clienteSchema.safeParse({
      nome: fd.get("nome"),
      cpf: fd.get("cpf") || undefined,
      telefone: fd.get("telefone") || undefined,
      email: fd.get("email") || undefined,
      msisdn: fd.get("msisdn") || undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSaving(true);
    const { data: cli, error: e1 } = await supabase
      .from("clientes")
      .insert({
        user_id: user.id,
        nome: parsed.data.nome,
        cpf: parsed.data.cpf ?? null,
        telefone: parsed.data.telefone ?? null,
        email: parsed.data.email || null,
      })
      .select()
      .single();
    if (e1 || !cli) {
      setSaving(false);
      toast.error("Falha ao criar cliente");
      return;
    }
    const { data: linha, error: e2 } = await supabase
      .from("linhas")
      .insert({ user_id: user.id, cliente_id: cli.id, msisdn: parsed.data.msisdn ?? null })
      .select()
      .single();
    if (e2 || !linha) {
      setSaving(false);
      toast.error("Falha ao criar linha");
      return;
    }
    const venc = new Date();
    venc.setDate(venc.getDate() + 7);
    await supabase.from("cobrancas").insert({
      user_id: user.id,
      cliente_id: cli.id,
      linha_id: linha.id,
      vencimento: venc.toISOString().slice(0, 10),
      is_primeira: true,
    });
    setSaving(false);
    setOpen(false);
    toast.success("Cliente cadastrado! Cobrança gerada (pendente).");
    load();
  };

  const pagarComPix = (cobrancaId: string) => {
    setSelectedCobranca(cobrancaId);
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
              <Button type="submit" className="w-full" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Cadastrar
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : items.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">
          Nenhum cliente ainda. Cadastre o primeiro para começar a faturar.
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {items.map((c) => {
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
                    <Badge variant="outline">{linhasAtivas} linha(s)</Badge>
                    <Badge variant={c.ativo ? "default" : "secondary"}>{c.ativo ? "Ativo" : "Inativo"}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
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
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <PixPaymentDialog 
        cobrancaId={selectedCobranca} 
        onOpenChange={(open) => !open && setSelectedCobranca(null)}
        onSuccess={load}
      />
    </div>
  );
}
