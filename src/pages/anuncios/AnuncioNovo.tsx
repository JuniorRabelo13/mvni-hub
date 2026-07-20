import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowRight, ImageIcon, Loader2, MapPin, Calendar, DollarSign } from "lucide-react";

type Posicao = "dashboard_topo" | "dashboard_lateral" | "tela_vendas" | "painel_ganhos";

const POSICOES_LABEL: Record<Posicao, string> = {
  dashboard_topo: "Dashboard — Topo",
  dashboard_lateral: "Dashboard — Lateral",
  tela_vendas: "Tela de Vendas",
  painel_ganhos: "Painel de Ganhos",
};

export default function AnuncioNovo() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [titulo, setTitulo] = useState("");
  const [imagem, setImagem] = useState("");
  const [link, setLink] = useState("");
  const [posicao, setPosicao] = useState<Posicao | "">("");
  const [dias, setDias] = useState<number>(7);
  const [submitting, setSubmitting] = useState(false);

  const { data: precos } = useQuery({
    queryKey: ["anuncios_precos"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("anuncios_precos").select("posicao, valor_por_dia").eq("ativo", true);
      if (error) throw error;
      return data as Array<{ posicao: Posicao; valor_por_dia: number }>;
    },
  });

  const { data: preco } = useQuery({
    queryKey: ["preco-calc", posicao, dias],
    queryFn: async () => {
      if (!posicao || dias < 1) return 0;
      const { data, error } = await (supabase as any).rpc("calcular_preco_anuncio", { p_posicao: posicao, p_dias: dias });
      if (error) throw error;
      return Number(data ?? 0);
    },
    enabled: !!posicao && dias > 0,
  });

  const canContinue1 = titulo.trim().length > 2 && link.trim().length > 5;
  const canContinue2 = !!posicao;
  const canContinue3 = !!posicao && dias > 0 && (preco ?? 0) > 0;

  async function iniciarPagamento() {
    if (!user) { toast.error("Você precisa estar autenticado."); return; }
    if (!canContinue3) return;
    setSubmitting(true);
    try {
      // 1. Cria o anúncio como rascunho
      const { data: created, error: adErr } = await (supabase as any)
        .from("anuncios")
        .insert({
          criado_por: user.id,
          titulo,
          imagem_url: imagem || null,
          link_destino: link,
          posicao,
          dias_contratados: dias,
          status: "rascunho",
        })
        .select("id")
        .single();
      if (adErr) throw adErr;

      // 2. Chama edge function para checkout Stripe
      const { data, error } = await supabase.functions.invoke("criar-checkout-anuncio", {
        body: { anuncio_id: created.id, dias, posicao },
      });
      if (error) throw error;
      const url = (data as any)?.url;
      if (!url) throw new Error("URL de checkout não retornada");
      window.location.href = url;
    } catch (e: any) {
      toast.error(e.message ?? "Falha ao iniciar o pagamento");
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Publicidade</p>
        <h1 className="mt-1 text-3xl font-bold">Criar novo anúncio</h1>
        <p className="text-muted-foreground text-sm mt-1">Escolha o posicionamento, defina a duração e pague com cartão de crédito. Todo anúncio passa por aprovação antes de ir ao ar.</p>
      </div>

      <div className="flex items-center gap-2 text-xs">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className={`flex-1 h-1 rounded-full ${n <= step ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader><CardTitle>1. Criativo</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Aprenda a triplicar sua rede em 30 dias" />
            </div>
            <div>
              <Label>URL da imagem (opcional)</Label>
              <Input value={imagem} onChange={(e) => setImagem(e.target.value)} placeholder="https://..." />
              {imagem && (
                <div className="mt-3 rounded-md border border-border overflow-hidden max-w-sm">
                  <img src={imagem} alt="Preview" className="w-full h-32 object-cover" />
                </div>
              )}
            </div>
            <div>
              <Label>Link de destino</Label>
              <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />
            </div>
            <div className="flex justify-end">
              <Button disabled={!canContinue1} onClick={() => setStep(2)}>Continuar <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader><CardTitle>2. Posicionamento</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {precos?.map((p) => (
              <button
                key={p.posicao}
                onClick={() => setPosicao(p.posicao)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${posicao === p.posicao ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="font-semibold">{POSICOES_LABEL[p.posicao]}</span>
                  </div>
                  <span className="text-sm font-mono">R$ {Number(p.valor_por_dia).toFixed(2)}/dia</span>
                </div>
              </button>
            )) ?? <Skeleton className="h-20" />}
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}>Voltar</Button>
              <Button disabled={!canContinue2} onClick={() => setStep(3)}>Continuar <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader><CardTitle>3. Duração e preço</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Dias de exibição</Label>
              <Input type="number" min={1} max={365} value={dias} onChange={(e) => setDias(Math.max(1, Number(e.target.value) || 1))} />
            </div>
            <Card className="bg-primary/5 border-primary/30">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-muted-foreground font-bold tracking-widest">Total</p>
                  <h2 className="text-3xl font-bold mt-1">R$ {(preco ?? 0).toFixed(2)}</h2>
                  <p className="text-xs text-muted-foreground mt-1">{dias} {dias === 1 ? "dia" : "dias"} em {posicao && POSICOES_LABEL[posicao as Posicao]}</p>
                </div>
                <DollarSign className="h-10 w-10 text-primary/60" />
              </CardContent>
            </Card>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(2)}>Voltar</Button>
              <Button disabled={!canContinue3} onClick={() => setStep(4)}>Continuar <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader><CardTitle>4. Pagamento</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg border border-border space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Título</span><span className="font-medium">{titulo}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Posição</span><span className="font-medium">{posicao && POSICOES_LABEL[posicao as Posicao]}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Dias</span><span className="font-medium">{dias}</span></div>
              <div className="flex justify-between border-t border-border pt-2 mt-2"><span className="font-bold">Total</span><span className="font-bold text-primary">R$ {(preco ?? 0).toFixed(2)}</span></div>
            </div>
            <p className="text-xs text-muted-foreground">Após o pagamento aprovado, seu anúncio entra em fila de aprovação manual pela equipe MVNI antes de ir ao ar.</p>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(3)} disabled={submitting}>Voltar</Button>
              <Button onClick={iniciarPagamento} disabled={submitting}>
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Aguarde</> : <>Pagar com cartão</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
