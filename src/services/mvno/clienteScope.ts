import { supabase } from "@/integrations/supabase/client";

/**
 * Resolve os cliente_ids vinculados ao usuário autenticado.
 * Toda camada de serviços da Central do Cliente parte daqui para garantir
 * ownership + RLS. Nunca expor dados de terceiros.
 */
export async function getClienteIdsForUser(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("clientes")
    .select("id")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((r: any) => r.id);
}

export async function getLinhaIdsForUser(userId: string): Promise<string[]> {
  const clienteIds = await getClienteIdsForUser(userId);
  if (clienteIds.length === 0) return [];
  const { data, error } = await supabase
    .from("mvno_linhas")
    .select("id")
    .in("cliente_id", clienteIds);
  if (error) throw error;
  return (data ?? []).map((r: any) => r.id);
}
