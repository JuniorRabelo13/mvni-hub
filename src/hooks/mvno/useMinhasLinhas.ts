import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type MvnoLinha = {
  id: string;
  numero: string;
  iccid: string | null;
  imsi: string | null;
  status: string;
  ativada_em: string | null;
  proximo_vencimento: string | null;
  valor_mensal: number;
  observacoes: string | null;
  cliente_id: string | null;
  operadora_id: string | null;
  plano_id: string | null;
  created_at: string;
  updated_at: string;
  operadora?: { id: string; nome: string; slug: string; cor: string | null } | null;
  plano?: {
    id: string;
    nome: string;
    valor_mensal: number;
    franquia_dados_mb: number;
    sms_incluidos: number;
    minutos_incluidos: number;
  } | null;
};

async function fetchMinhasLinhas(userId: string): Promise<MvnoLinha[]> {
  // Discover cliente_ids linked to current user via clientes.user_id
  const { data: clientes, error: cErr } = await supabase
    .from("clientes")
    .select("id")
    .eq("user_id", userId);
  if (cErr) throw cErr;

  const clienteIds = (clientes ?? []).map((c: any) => c.id);
  if (clienteIds.length === 0) return [];

  const { data, error } = await supabase
    .from("mvno_linhas")
    .select(
      `id, numero, iccid, imsi, status, ativada_em, proximo_vencimento, valor_mensal, observacoes,
       cliente_id, operadora_id, plano_id, created_at, updated_at,
       operadora:operadoras(id, nome, slug, cor),
       plano:planos_mvno(id, nome, valor_mensal, franquia_dados_mb, sms_incluidos, minutos_incluidos)`,
    )
    .in("cliente_id", clienteIds)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as MvnoLinha[];
}

export function useMinhasLinhas() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["mvno", "minhas-linhas", user?.id],
    queryFn: () => fetchMinhasLinhas(user!.id),
    enabled: !!user?.id,
  });
}

export function useLinha(linhaId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["mvno", "linha", linhaId, user?.id],
    enabled: !!linhaId && !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mvno_linhas")
        .select(
          `id, numero, iccid, imsi, status, ativada_em, proximo_vencimento, valor_mensal, observacoes,
           cliente_id, operadora_id, plano_id, created_at, updated_at,
           operadora:operadoras(id, nome, slug, cor, logo_url),
           plano:planos_mvno(id, nome, descricao, valor_mensal, franquia_dados_mb, sms_incluidos, minutos_incluidos)`,
        )
        .eq("id", linhaId!)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });
}
