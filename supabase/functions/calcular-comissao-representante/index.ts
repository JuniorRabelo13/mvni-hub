import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { representante_id, mes_referencia, simulate, diretos: simDiretos, indiretos: simIndiretos } = await req.json();

    if (simulate) {
      const VALOR_ATIVACAO = 85.00;
      const VALOR_RECORRENCIA_DIRETA = 20.00;
      const multIndireto = (simDiretos || 0) > 40 ? 10.00 : 5.00;
      
      const v_ativ = (simDiretos || 0) * VALOR_ATIVACAO; // Simulador de Dashboard foca em ativações imediatas
      const v_rec_dir = (simDiretos || 0) * VALOR_RECORRENCIA_DIRETA;
      const v_rec_ind = (simIndiretos || 0) * multIndireto;
      
      return new Response(
        JSON.stringify({
          sucesso: true,
          dados: {
            valor_ativacoes: v_ativ,
            valor_recorrencia_direta: v_rec_dir,
            valor_recorrencia_indireta: v_rec_ind,
            valor_bonus: 0,
            valor_total: v_rec_dir + v_rec_ind,
            direct_active_count: simDiretos,
            indirect_active_count: simIndiretos
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!representante_id || !mes_referencia) {
      throw new Error("representante_id e mes_referencia são obrigatórios");
    }

    const [year, month] = mes_referencia.split("-").map(Number);
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

    // Carregar catálogo de produtos ativos (para suporte multi-produto)
    // Linha celular permanece como produto padrão; assinaturas sem produto_id ou com slug 'linha-celular' usam regra atual.
    const { data: produtos } = await supabase
      .from("produtos")
      .select("id, slug, status, comissao_ativacao, comissao_recorrente");

    const produtosMap = new Map<string, any>();
    let linhaCelularId: string | null = null;
    (produtos || []).forEach((p: any) => {
      produtosMap.set(p.id, p);
      if (p.slug === "linha-celular") linhaCelularId = p.id;
    });

    // Helpers — regra da linha celular preservada (R$ 85 ativação / R$ 20 recorrente / R$ 5-10 indireto)
    const LC_ATIVACAO = 85.00;
    const LC_RECORRENTE = 20.00;
    const isLinhaCelular = (pid: string | null | undefined) =>
      !pid || (linhaCelularId && pid === linhaCelularId);

    const getAtivacaoValor = (pid: string | null | undefined): number => {
      if (isLinhaCelular(pid)) return LC_ATIVACAO;
      const p = produtosMap.get(pid as string);
      if (!p || p.status !== "ativo" || p.comissao_ativacao == null) return 0;
      return Number(p.comissao_ativacao);
    };
    const getRecorrenteValor = (pid: string | null | undefined): number => {
      if (isLinhaCelular(pid)) return LC_RECORRENTE;
      const p = produtosMap.get(pid as string);
      if (!p || p.status !== "ativo" || p.comissao_recorrente == null) return 0;
      return Number(p.comissao_recorrente);
    };

    // 1. Assinaturas ativas diretas (com produto_id quando existir)
    const { data: directActiveClients, error: directError } = await supabase
      .from("assinaturas")
      .select(`
        id,
        cliente_id,
        produto_id,
        clientes!inner (
          id,
          nome,
          user_id
        )
      `)
      .eq("status", "ativo")
      .eq("clientes.user_id", representante_id);

    if (directError) throw directError;
    const directActiveCount = directActiveClients?.length || 0;

    // 2. Clientes para ativação direta (criados no mês) — sem produto_id na tabela clientes hoje, assume linha celular
    const { data: activations, error: actError } = await supabase
      .from("clientes")
      .select("id, nome")
      .eq("user_id", representante_id)
      .gte("created_at", startDate)
      .lte("created_at", endDate);

    if (actError) throw actError;

    // 3. Representantes indicados (filhos diretos)
    const { data: subReps, error: subError } = await supabase
      .from("usuarios")
      .select("id")
      .eq("indicado_por", representante_id);

    if (subError) throw subError;
    const subRepIds = subReps?.map(r => r.id) || [];

    let indirectActiveClients: any[] = [];
    if (subRepIds.length > 0) {
      const { data: indClients, error: indError } = await supabase
        .from("assinaturas")
        .select(`
          id,
          cliente_id,
          produto_id,
          clientes!inner (
            id,
            nome,
            user_id
          )
        `)
        .eq("status", "ativo")
        .in("clientes.user_id", subRepIds);

      if (indError) throw indError;
      indirectActiveClients = indClients || [];
    }

    // Cálculos — Ativação (linha celular hoje, multi-produto preparado)
    const valor_ativacoes = activations.reduce(
      (sum: number) => sum + LC_ATIVACAO, // clientes sem produto_id → linha celular
      0
    );

    // Recorrência direta — por produto
    const valor_recorrencia_direta = (directActiveClients || []).reduce(
      (sum: number, s: any) => sum + getRecorrenteValor(s.produto_id),
      0
    );

    // Bônus indireto preserva regra atual: R$ 5 (<=40 diretos) ou R$ 10 (>40 diretos), aplicável a assinaturas de linha celular.
    const multiplicadorIndireto = directActiveCount > 40 ? 10.00 : 5.00;
    const valor_recorrencia_indireta = indirectActiveClients.reduce((sum: number, s: any) => {
      if (isLinhaCelular(s.produto_id)) return sum + multiplicadorIndireto;
      // Outros produtos: usar comissao_recorrente do catálogo (sem bônus indireto adicional)
      return sum + getRecorrenteValor(s.produto_id);
    }, 0);
    const valor_bonus = 0.00;
    const valor_total = valor_ativacoes + valor_recorrencia_direta + valor_recorrencia_indireta + valor_bonus;

    // 4. Upsert em comissoes_mensais
    const { data: comissao, error: comError } = await supabase
      .from("comissoes_mensais")
      .upsert({
        representante_id,
        mes_referencia,
        valor_total,
        status: "pendente",
        updated_at: new Date().toISOString()
      }, { onConflict: "representante_id, mes_referencia" })
      .select()
      .single();

    if (comError) throw comError;

    // 5. Inserir itens detalhados (limpar antigos primeiro)
    await supabase
      .from("itens_comissao")
      .delete()
      .eq("comissao_id", comissao.id);

    const itensToInsert: any[] = [];

    // Itens de ativação (linha celular hoje)
    activations.forEach((a: any) => {
      itensToInsert.push({
        comissao_id: comissao.id,
        representante_id,
        cliente_id: a.id,
        produto_id: linhaCelularId,
        tipo: "ativacao",
        valor: LC_ATIVACAO,
        mes_referencia
      });
    });

    // Itens de recorrência direta — valor por produto
    directActiveClients.forEach((c: any) => {
      itensToInsert.push({
        comissao_id: comissao.id,
        representante_id,
        cliente_id: c.cliente_id,
        produto_id: c.produto_id ?? linhaCelularId,
        tipo: "recorrencia_direta",
        valor: getRecorrenteValor(c.produto_id),
        mes_referencia
      });
    });

    // Itens de recorrência indireta
    indirectActiveClients.forEach((c: any) => {
      const valor = isLinhaCelular(c.produto_id)
        ? multiplicadorIndireto
        : getRecorrenteValor(c.produto_id);
      itensToInsert.push({
        comissao_id: comissao.id,
        representante_id,
        cliente_id: c.cliente_id,
        produto_id: c.produto_id ?? linhaCelularId,
        tipo: "recorrencia_indireta",
        valor,
        mes_referencia
      });
    });

    if (itensToInsert.length > 0) {
      const { error: insError } = await supabase
        .from("itens_comissao")
        .insert(itensToInsert);

      if (insError) throw insError;
    }


    return new Response(
      JSON.stringify({
        sucesso: true,
        dados: {
          valor_ativacoes,
          valor_recorrencia_direta,
          valor_recorrencia_indireta,
          valor_bonus,
          valor_total,
          direct_active_count: directActiveCount,
          indirect_active_count: indirectActiveClients.length
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Erro no calculo de comissao:", error);
    return new Response(
      JSON.stringify({ sucesso: false, mensagem: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
