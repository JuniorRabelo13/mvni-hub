import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

async function clienteIdsFor(userId: string): Promise<string[]> {
  const { data, error } = await supabase.from("clientes").select("id").eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((r: any) => r.id);
}

async function linhaIdsForUser(userId: string): Promise<string[]> {
  const cids = await clienteIdsFor(userId);
  if (cids.length === 0) return [];
  const { data, error } = await supabase.from("mvno_linhas").select("id").in("cliente_id", cids);
  if (error) throw error;
  return (data ?? []).map((r: any) => r.id);
}

export function useConsumo(linhaId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["mvno", "consumo", user?.id, linhaId ?? "all"],
    enabled: !!user?.id,
    queryFn: async () => {
      const ids = linhaId ? [linhaId] : await linhaIdsForUser(user!.id);
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from("mvno_consumos")
        .select("*")
        .in("linha_id", ids)
        .order("competencia", { ascending: false })
        .limit(180);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useHistoricoLinha(linhaId: string | undefined) {
  return useQuery({
    queryKey: ["mvno", "historico", linhaId],
    enabled: !!linhaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mvno_linha_historico")
        .select("*")
        .eq("linha_id", linhaId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useHistoricoTodasLinhas() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["mvno", "historico-all", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const ids = await linhaIdsForUser(user!.id);
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from("mvno_linha_historico")
        .select("*, linha:mvno_linhas(id, numero)")
        .in("linha_id", ids)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
}
