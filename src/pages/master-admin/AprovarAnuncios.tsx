import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Check, X, ExternalLink } from "lucide-react";

export default function AprovarAnuncios() {
  const qc = useQueryClient();
  const [rejeitando, setRejeitando] = useState<any>(null);
  const [motivo, setMotivo] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["anuncios-pendentes"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("anuncios")
        .select("id, titulo, imagem_url, link_destino, posicao, dias_contratados, valor_pago, criado_por, created_at, stripe_payment_id")
        .eq("status", "pendente_aprovacao")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });

  const aprovar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).rpc("aprovar_anuncio", { p_anuncio_id: id });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Anúncio aprovado"); qc.invalidateQueries({ queryKey: ["anuncios-pendentes"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const rejeitar = useMutation({
    mutationFn: async ({ id, motivo, payment_id }: { id: string; motivo: string; payment_id?: string | null }) => {
      const { error } = await (supabase as any).rpc("rejeitar_anuncio", { p_anuncio_id: id, p_motivo: motivo });
      if (error) throw error;
      // Estorno best-effort
      if (payment_id) {
        try {
          await supabase.functions.invoke("stripe-anuncio-refund", { body: { payment_intent_id: payment_id } });
        } catch (_) { /* logado pela função */ }
      }
    },
    onSuccess: () => { toast.success("Anúncio rejeitado e estorno solicitado"); qc.invalidateQueries({ queryKey: ["anuncios-pendentes"] }); setRejeitando(null); setMotivo(""); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Publicidade</p>
        <h1 className="mt-1 text-3xl font-bold">Aprovação de Anúncios</h1>
        <p className="text-muted-foreground text-sm mt-1">Anúncios aguardando revisão antes de irem ao ar.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}</div>
      ) : (data?.length ?? 0) === 0 ? (
        <Card><CardContent className="p-10 text-center text-muted-foreground">Nenhum anúncio pendente.</CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {data!.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-5 flex flex-wrap items-center gap-4">
                {a.imagem_url ? (
                  <img src={a.imagem_url} alt={a.titulo} className="w-32 h-20 rounded object-cover border border-border" />
                ) : (
                  <div className="w-32 h-20 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs">sem imagem</div>
                )}
                <div className="flex-1 min-w-[200px]">
                  <div className="font-semibold">{a.titulo}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {a.posicao} • {a.dias_contratados} dias • R$ {Number(a.valor_pago ?? 0).toFixed(2)}
                  </div>
                  <a href={a.link_destino} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1">
                    {a.link_destino} <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => aprovar.mutate(a.id)} disabled={aprovar.isPending}>
                    <Check className="h-4 w-4 mr-1" /> Aprovar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setRejeitando(a)}>
                    <X className="h-4 w-4 mr-1" /> Rejeitar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!rejeitando} onOpenChange={(v) => { if (!v) { setRejeitando(null); setMotivo(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rejeitar anúncio</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Motivo da rejeição</label>
            <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Explique brevemente para o anunciante..." rows={4} />
            <p className="text-xs text-muted-foreground">O pagamento será estornado automaticamente.</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setRejeitando(null); setMotivo(""); }}>Cancelar</Button>
            <Button variant="destructive" disabled={motivo.trim().length < 3 || rejeitar.isPending} onClick={() => rejeitar.mutate({ id: rejeitando.id, motivo, payment_id: rejeitando.stripe_payment_id })}>
              Confirmar rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
