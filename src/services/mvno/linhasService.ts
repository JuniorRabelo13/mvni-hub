import { supabase } from "@/integrations/supabase/client";
import { getClienteIdsForUser } from "./clienteScope";

const LINHA_SELECT = `id, numero, iccid, imsi, status, ativada_em, proximo_vencimento, valor_mensal, observacoes,
  cliente_id, operadora_id, plano_id, created_at, updated_at,
  operadora:operadoras(id, nome, slug, cor, logo_url),
  plano:planos_mvno(id, nome, descricao, valor_mensal, franquia_dados_mb, sms_incluidos, minutos_incluidos)`;

export async function listMinhasLinhas(userId: string) {
  const clienteIds = await getClienteIdsForUser(userId);
  if (clienteIds.length === 0) return [];
  const { data, error } = await supabase
    .from("mvno_linhas")
    .select(LINHA_SELECT)
    .in("cliente_id", clienteIds)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getLinhaById(linhaId: string) {
  const { data, error } = await supabase
    .from("mvno_linhas")
    .select(LINHA_SELECT)
    .eq("id", linhaId)
    .maybeSingle();
  if (error) throw error;
  return data;
}
