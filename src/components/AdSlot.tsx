import { useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Posicao = "dashboard_topo" | "dashboard_lateral" | "tela_vendas" | "painel_ganhos";

interface AdSlotProps {
  posicao: Posicao;
  className?: string;
}

export function AdSlot({ posicao, className }: AdSlotProps) {
  const { user } = useAuth();
  const impressoRef = useRef<Set<string>>(new Set());

  const today = new Date().toISOString().slice(0, 10);

  const { data: ads } = useQuery({
    queryKey: ["ad-slot", posicao, today],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("anuncios")
        .select("id, titulo, imagem_url, link_destino")
        .eq("status", "ativo")
        .eq("posicao", posicao)
        .lte("data_inicio", today)
        .gte("data_fim", today)
        .limit(1);
      if (error) throw error;
      return (data ?? []) as any[];
    },
    staleTime: 60_000,
  });

  const ad = ads?.[0];

  useEffect(() => {
    if (!ad?.id) return;
    if (impressoRef.current.has(ad.id)) return;
    impressoRef.current.add(ad.id);
    (supabase as any).from("anuncios_eventos").insert({
      anuncio_id: ad.id,
      user_id: user?.id ?? null,
      tipo: "impressao",
    }).then(() => {}, () => {});
  }, [ad?.id, user?.id]);

  if (!ad) return null;

  const handleClick = () => {
    (supabase as any).from("anuncios_eventos").insert({
      anuncio_id: ad.id,
      user_id: user?.id ?? null,
      tipo: "clique",
    }).then(() => {}, () => {});
  };

  return (
    <a
      href={ad.link_destino ?? "#"}
      target="_blank"
      rel="noreferrer sponsored"
      onClick={handleClick}
      className={`block rounded-lg overflow-hidden border border-primary/20 hover:border-primary/60 transition-colors group ${className ?? ""}`}
    >
      {ad.imagem_url ? (
        <div className="relative">
          <img src={ad.imagem_url} alt={ad.titulo} className="w-full h-auto object-cover" />
          <span className="absolute top-1 right-1 text-[9px] font-bold text-white/90 bg-black/50 px-1.5 py-0.5 rounded uppercase tracking-wider">Anúncio</span>
        </div>
      ) : (
        <div className="p-4 bg-primary/5">
          <span className="text-[9px] font-bold text-primary uppercase tracking-wider">Anúncio</span>
          <p className="text-sm font-medium mt-1 group-hover:text-primary transition-colors">{ad.titulo}</p>
        </div>
      )}
    </a>
  );
}
