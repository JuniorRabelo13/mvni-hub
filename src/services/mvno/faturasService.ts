import { supabase } from "@/integrations/supabase/client";
import { getClienteIdsForUser } from "./clienteScope";

export async function listMinhasFaturas(userId: string, linhaId?: string) {
  const clienteIds = await getClienteIdsForUser(userId);
  if (clienteIds.length === 0) return [];
  let q = supabase
    .from("mvno_faturas")
    .select(`*, linha:mvno_linhas(id, numero)`)
    .in("cliente_id", clienteIds)
    .order("competencia", { ascending: false });
  if (linhaId) q = q.eq("linha_id", linhaId);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function getFaturaById(faturaId: string) {
  const { data, error } = await supabase
    .from("mvno_faturas")
    .select(
      `*, linha:mvno_linhas(id, numero, operadora:operadoras(nome), plano:planos_mvno(nome)),
       itens:mvno_fatura_itens(*)`,
    )
    .eq("id", faturaId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getFaturaSignedUrl(pdfPath: string, expiresIn = 300) {
  const { data, error } = await supabase.storage
    .from("mvno-faturas-cliente")
    .createSignedUrl(pdfPath, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}
