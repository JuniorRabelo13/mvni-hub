import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type MvnoFatura = {
  id: string;
  linha_id: string;
  cliente_id: string | null;
  competencia: string;
  valor: number;
  vencimento: string;
  pago_em: string | null;
  status: string;
  pdf_path: string | null;
  metadata: any;
  created_at: string;
  linha?: { id: string; numero: string } | null;
};

async function clienteIdsFor(userId: string): Promise<string[]> {
  const { data, error } = await supabase.from("clientes").select("id").eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((r: any) => r.id);
}

export function useMinhasFaturas(linhaId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["mvno", "minhas-faturas", user?.id, linhaId ?? "all"],
    enabled: !!user?.id,
    queryFn: async (): Promise<MvnoFatura[]> => {
      const ids = await clienteIdsFor(user!.id);
      if (ids.length === 0) return [];
      let q = supabase
        .from("mvno_faturas")
        .select(`*, linha:mvno_linhas(id, numero)`)
        .in("cliente_id", ids)
        .order("competencia", { ascending: false });
      if (linhaId) q = q.eq("linha_id", linhaId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as MvnoFatura[];
    },
  });
}

export function useFatura(faturaId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["mvno", "fatura", faturaId, user?.id],
    enabled: !!faturaId && !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mvno_faturas")
        .select(
          `*, linha:mvno_linhas(id, numero, operadora:operadoras(nome), plano:planos_mvno(nome)),
           itens:mvno_fatura_itens(*)`,
        )
        .eq("id", faturaId!)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });
}
