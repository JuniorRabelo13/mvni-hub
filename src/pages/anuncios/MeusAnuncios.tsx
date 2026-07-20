import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Plus, Eye, MousePointerClick } from "lucide-react";

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  rascunho: { label: "Rascunho", className: "bg-muted text-muted-foreground" },
  pendente_aprovacao: { label: "Aguardando aprovação", className: "bg-amber-500/10 text-amber-500 border-amber-500/30" },
  aprovado: { label: "Aprovado", className: "bg-blue-500/10 text-blue-500 border-blue-500/30" },
  ativo: { label: "No ar", className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" },
  rejeitado: { label: "Rejeitado", className: "bg-red-500/10 text-red-500 border-red-500/30" },
  encerrado: { label: "Encerrado", className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30" },
};

export default function MeusAnuncios() {
  const { user } = useAuth();

  const { data: anuncios, isLoading } = useQuery({
    queryKey: ["meus-anuncios", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("anuncios")
        .select("id, titulo, imagem_url, posicao, status, data_inicio, data_fim, dias_contratados, valor_pago, created_at")
        .eq("criado_por", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: eventos } = useQuery({
    queryKey: ["meus-anuncios-eventos", (anuncios ?? []).map((a) => a.id).join(",")],
    enabled: !!anuncios?.length,
    queryFn: async () => {
      const ids = anuncios!.map((a) => a.id);
      const { data, error } = await (supabase as any)
        .from("anuncios_eventos")
        .select("anuncio_id, tipo")
        .in("anuncio_id", ids);
      if (error) throw error;
      const acc: Record<string, { impressao: number; clique: number }> = {};
      (data as any[]).forEach((e) => {
        acc[e.anuncio_id] ??= { impressao: 0, clique: 0 };
        if (e.tipo === "impressao") acc[e.anuncio_id].impressao++;
        if (e.tipo === "clique") acc[e.anuncio_id].clique++;
      });
      return acc;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Publicidade</p>
          <h1 className="mt-1 text-3xl font-bold">Meus Anúncios</h1>
          <p className="text-muted-foreground text-sm mt-1">Acompanhe status, impressões e cliques.</p>
        </div>
        <Button asChild>
          <Link to="/anuncios/criar"><Plus className="h-4 w-4 mr-2" /> Novo anúncio</Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : (anuncios?.length ?? 0) === 0 ? (
        <Card><CardContent className="p-10 text-center text-muted-foreground">Você ainda não criou nenhum anúncio.</CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {anuncios!.map((a) => {
            const s = STATUS_LABEL[a.status] ?? STATUS_LABEL.rascunho;
            const ev = eventos?.[a.id] ?? { impressao: 0, clique: 0 };
            return (
              <Card key={a.id}>
                <CardContent className="p-5 flex flex-wrap items-center gap-4">
                  {a.imagem_url ? (
                    <img src={a.imagem_url} alt={a.titulo} className="w-24 h-16 rounded object-cover border border-border" />
                  ) : (
                    <div className="w-24 h-16 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs">sem imagem</div>
                  )}
                  <div className="flex-1 min-w-[200px]">
                    <div className="font-semibold">{a.titulo}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {a.posicao} • {a.dias_contratados} dias {a.valor_pago ? `• R$ ${Number(a.valor_pago).toFixed(2)}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Eye className="h-3.5 w-3.5" /> <span className="font-mono">{ev.impressao}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MousePointerClick className="h-3.5 w-3.5" /> <span className="font-mono">{ev.clique}</span>
                    </div>
                    <Badge variant="outline" className={s.className}>{s.label}</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
