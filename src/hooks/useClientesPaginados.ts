import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { sanitize } from "@/lib/sanitize";

export type Cliente = {
  id: string;
  nome: string;
  cpf: string | null;
  telefone: string | null;
  email: string | null;
  ativo: boolean;
  created_at: string;
  plano_id: string | null;
  planos: { nome: string; valor: number } | null;
  linhas: { id: string; status: string; msisdn: string | null; activated_at: string | null; deactivated_at: string | null }[];
  cobrancas: { id: string; status: string; valor: number; vencimento: string; paid_at: string | null; created_at: string }[];
  assinaturas?: { status: string }[];
};


export type FiltrosClientes = {
  query?: string;
  status?: "todos" | "ativos" | "inadimplentes" | "suspensos" | "vencendo_hoje";
};

export function useClientesPaginados(
  userId: string | undefined,
  page: number,
  pageSize: number,
  filtros: FiltrosClientes
) {
  const queryClient = useQueryClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const query = useQuery({
    queryKey: ["clientes", userId, page, pageSize, filtros],
    queryFn: async () => {
      if (!userId) return { data: [], count: 0 };

      let supabaseQuery = supabase
        .from("clientes")
        .select(
          "id, nome, cpf, telefone, email, ativo, created_at, plano_id, planos(nome, valor), linhas(id,status,msisdn,activated_at,deactivated_at), cobrancas(id,status,valor,vencimento,paid_at,created_at), assinaturas(status)",
          { count: "exact" }
        )
        .eq("user_id", userId);

      if (filtros.status === "ativos") {
        supabaseQuery = supabaseQuery.eq("ativo", true);
      } else if (filtros.status === "suspensos") {
        supabaseQuery = supabaseQuery.eq("ativo", false);
      }

      if (filtros.query) {
        const q = `%${filtros.query}%`;
        supabaseQuery = supabaseQuery.or(`nome.ilike.${q},cpf.ilike.${q},telefone.ilike.${q}`);
      }

      const { data, count, error } = await supabaseQuery
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      const sanitizedData = sanitize((data as any) ?? [], "clientes_list", userId) as Cliente[];

      return {
        data: sanitizedData,
        count: count || 0,
      };
    },
    enabled: !!userId,
  });

  const prefetchNextPage = async () => {
    if (query.data && page * pageSize < query.data.count) {
      const nextPage = page + 1;
      await queryClient.prefetchQuery({
        queryKey: ["clientes", userId, nextPage, pageSize, filtros],
        queryFn: async () => {
          const nextFrom = (nextPage - 1) * pageSize;
          const nextTo = nextFrom + pageSize - 1;
          
          let supabaseQuery = supabase
            .from("clientes")
            .select(
              "id, nome, cpf, telefone, email, ativo, created_at, plano_id, planos(nome, valor), linhas(id,status,msisdn,activated_at,deactivated_at), cobrancas(id,status,valor,vencimento,paid_at,created_at), assinaturas(status)"
            )
            .eq("user_id", userId!);

          if (filtros.status === "ativos") supabaseQuery = supabaseQuery.eq("ativo", true);
          if (filtros.status === "suspensos") supabaseQuery = supabaseQuery.eq("ativo", false);
          if (filtros.query) {
            const q = `%${filtros.query}%`;
            supabaseQuery = supabaseQuery.or(`nome.ilike.${q},cpf.ilike.${q},telefone.ilike.${q}`);
          }

          const { data } = await supabaseQuery
            .order("created_at", { ascending: false })
            .range(nextFrom, nextTo);

          return {
            data: sanitize((data as any) ?? [], "clientes_list", userId!) as Cliente[],
          };
        },
      });
    }
  };

  return { ...query, prefetchNextPage };
}
