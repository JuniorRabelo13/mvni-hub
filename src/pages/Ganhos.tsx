import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Comissao = { id: string; tipo: string; valor: number; created_at: string; cliente_id: string };
const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Ganhos() {
  const { effectiveUser: user } = useAuth();
  const [items, setItems] = useState<Comissao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("comissoes")
      .select("id, tipo, valor, created_at, cliente_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setItems((data as any) ?? []);
        setLoading(false);
      });
  }, [user]);

  const total = items.reduce((a, b) => a + Number(b.valor), 0);
  const venda = items.filter((i) => i.tipo === "venda").reduce((a, b) => a + Number(b.valor), 0);
  const recor = items.filter((i) => i.tipo === "recorrencia").reduce((a, b) => a + Number(b.valor), 0);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Ganhos</p>
        <h1 className="mt-1 text-3xl font-bold">Suas comissões</h1>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-primary/40">
          <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Total acumulado</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-gradient-gold">{fmt(total)}</p></CardContent>
        </Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Vendas (R$ 85)</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{fmt(venda)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Recorrência (R$ 20)</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{fmt(recor)}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Histórico</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma comissão ainda. Confirme o pagamento de um cliente para gerar a primeira.</p>
          ) : (
            items.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-3 py-2 text-sm">
                <div className="flex items-center gap-3">
                  <Badge variant={c.tipo === "venda" ? "default" : "outline"}>{c.tipo}</Badge>
                  <span className="text-muted-foreground">{new Date(c.created_at).toLocaleString("pt-BR")}</span>
                </div>
                <span className="font-semibold text-primary">+ {fmt(Number(c.valor))}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
