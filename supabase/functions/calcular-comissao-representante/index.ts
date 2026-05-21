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

    const { representante_id, mes_referencia } = await req.json();

    if (!representante_id || !mes_referencia) {
      throw new Error("representante_id e mes_referencia são obrigatórios");
    }

    const [year, month] = mes_referencia.split("-").map(Number);
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

    // 1. Contar clientes diretos ativos para definir o multiplicador indireto
    const { data: directActiveClients, error: directError } = await supabase
      .from("assinaturas")
      .select(`
        id,
        cliente_id,
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

    // 2. Clientes para ativação direta (criados no mês)
    const { data: activations, error: actError } = await supabase
      .from("clientes")
      .select("id, nome")
      .eq("user_id", representante_id)
      .gte("created_at", startDate)
      .lte("created_at", endDate);

    if (actError) throw actError;

    // 3. Clientes para recorrência indireta
    // Buscar representantes indicados (filhos diretos)
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

    // Cálculos
    const valor_ativacoes = activations.length * 85.00;
    const valor_recorrencia_direta = directActiveCount * 20.00;
    
    const multiplicadorIndireto = directActiveCount > 40 ? 10.00 : 5.00;
    const valor_recorrencia_indireta = indirectActiveClients.length * multiplicadorIndireto;
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

    const itensToInsert = [];

    // Itens de ativação
    activations.forEach(a => {
      itensToInsert.push({
        comissao_id: comissao.id,
        representante_id,
        cliente_id: a.id,
        tipo: "ativacao",
        valor: 85.00,
        mes_referencia
      });
    });

    // Itens de recorrência direta
    directActiveClients.forEach(c => {
      itensToInsert.push({
        comissao_id: comissao.id,
        representante_id,
        cliente_id: c.cliente_id,
        tipo: "recorrencia_direta",
        valor: 20.00,
        mes_referencia
      });
    });

    // Itens de recorrência indireta
    indirectActiveClients.forEach(c => {
      itensToInsert.push({
        comissao_id: comissao.id,
        representante_id,
        cliente_id: c.cliente_id,
        tipo: "recorrencia_indireta",
        valor: multiplicadorIndireto,
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
