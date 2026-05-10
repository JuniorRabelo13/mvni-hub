import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { sanitize } from "@/lib/sanitize";

export type Cliente = {
  id: string;
  nome: string;
  cpf: string | null;
  telefone: string | null;
  ativo: boolean;
  created_at: string;
  linhas: { id: string; status: string; msisdn: string | null; activated_at: string | null; deactivated_at: string | null }[];
  cobrancas: { id: string; status: string; valor: number; vencimento: string; paid_at: string | null; created_at: string }[];
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
          "id, nome, cpf, telefone, ativo, created_at, linhas(id,status,msisdn,activated_at,deactivated_at), cobrancas(id,status,valor,vencimento,paid_at,created_at)",
          { count: "exact" }
        )
        .eq("user_id", userId);

      // Filtros Server-side básicos
      if (filtros.status === "ativos") {
        supabaseQuery = supabaseQuery.eq("ativo", true);
      } else if (filtros.status === "suspensos") {
        supabaseQuery = supabaseQuery.eq("ativo", false);
      }

      // Filtro de busca (se houver query, idealmente usar search index ou filtros ILIKE)
      if (filtros.query) {
        const q = `%${filtros.query}%`;
        supabaseQuery = supabaseQuery.or(`nome.ilike.${q},cpf.ilike.${q},telefone.ilike.${q}`);
      }

      const { data, count, error } = await supabaseQuery
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      // Note: filtros complexos como 'inadimplentes' ou 'vencendo_hoje' podem exigir lógica mais avançada
      // ou tabelas auxiliares/views no Supabase para paginação eficiente.
      // Aqui estamos mantendo a compatibilidade com a estrutura atual.

      const sanitizedData = sanitize((data as any) ?? [], "clientes_list", userId) as Cliente[];

      return {
        data: sanitizedData,
        count: count || 0,
      };
    },
    enabled: !!userId,
  });

  // Prefetch da próxima página
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
              "id, nome, cpf, telefone, ativo, created_at, linhas(id,status,msisdn,activated_at,deactivated_at), cobrancas(id,status,valor,vencimento,paid_at,created_at)"
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
