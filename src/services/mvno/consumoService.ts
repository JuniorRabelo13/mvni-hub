import { supabase } from "@/integrations/supabase/client";
import { getLinhaIdsForUser } from "./clienteScope";

export async function listConsumos(userId: string, linhaId?: string) {
  const ids = linhaId ? [linhaId] : await getLinhaIdsForUser(userId);
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("mvno_consumos")
    .select("*")
    .in("linha_id", ids)
    .order("competencia", { ascending: false })
    .limit(180);
  if (error) throw error;
  return data ?? [];
}

export async function listHistoricoLinha(linhaId: string) {
  const { data, error } = await supabase
    .from("mvno_linha_historico")
    .select("*")
    .eq("linha_id", linhaId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listHistoricoTodas(userId: string) {
  const ids = await getLinhaIdsForUser(userId);
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("mvno_linha_historico")
    .select("*, linha:mvno_linhas(id, numero)")
    .in("linha_id", ids)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data ?? [];
}
