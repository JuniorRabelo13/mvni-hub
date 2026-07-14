import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getPagamentoById } from "@/services/mvno/pagamentosService";

export type MvnoPagamento = {
  id: string;
  fatura_id: string;
  cliente_id: string | null;
  linha_id: string | null;
  provider: string;
  provider_intent_id: string | null;
  valor: number;
  status: "pendente" | "confirmado" | "expirado" | "cancelado" | "falhou";
  pix_qr_code_base64: string | null;
  pix_copia_e_cola: string | null;
  expires_at: string | null;
  paid_at: string | null;
  metadata: any;
  created_at: string;
};

export function useMeusPagamentos() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["mvno", "meus-pagamentos", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<MvnoPagamento[]> => {
      const { data: clientes } = await supabase.from("clientes").select("id").eq("user_id", user!.id);
      const ids = (clientes ?? []).map((c: any) => c.id);
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from("mvno_pagamentos")
        .select("*")
        .in("cliente_id", ids)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as MvnoPagamento[];
    },
  });
}

export function usePagamento(pagamentoId: string | undefined, polling = false) {
  return useQuery({
    queryKey: ["mvno", "pagamento", pagamentoId],
    enabled: !!pagamentoId,
    queryFn: async () => (await getPagamentoById(pagamentoId!)) as MvnoPagamento | null,
    refetchInterval: polling ? 5000 : false,
  });
}
