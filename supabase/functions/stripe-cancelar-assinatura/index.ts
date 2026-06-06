import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { requireRole } from "../_shared/auth.ts";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // SECURITY: admin/master only
  const _auth = await requireRole(req, ["admin", "master_admin"]);
  if (_auth.response) return new Response(_auth.response.body, { status: _auth.response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { cliente_id } = await req.json();

    if (!cliente_id) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "cliente_id é obrigatório" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // 1. Buscar na tabela assinaturas o registro onde cliente_id = o valor recebido e status diferente de "cancelado"
    const { data: assinatura, error: errorAssinatura } = await supabase
      .from("assinaturas")
      .select("id, stripe_subscription_id")
      .eq("cliente_id", cliente_id)
      .neq("status", "cancelado")
      .maybeSingle();

    if (errorAssinatura) throw errorAssinatura;

    // 2. Se não encontrar nenhum registro ativo
    if (!assinatura || !assinatura.stripe_subscription_id) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "Nenhuma assinatura ativa encontrada para este cliente" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // 3. Com o stripe_subscription_id encontrado, chamar a API do Stripe
    const stripeResponse = await fetch(`https://api.stripe.com/v1/subscriptions/${assinatura.stripe_subscription_id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const stripeData = await stripeResponse.json();

    if (!stripeResponse.ok) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: stripeData.error?.message || "Erro no Stripe" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // 4. Se o Stripe retornar sucesso: atualizar na tabela assinaturas
    const { error: updateAssinaturaError } = await supabase
      .from("assinaturas")
      .update({ status: "cancelado", data_proxima_cobranca: null })
      .eq("id", assinatura.id);

    if (updateAssinaturaError) throw updateAssinaturaError;

    // 5. Atualizar o campo status do cliente para "cancelado" na tabela clientes
    const { error: updateClienteError } = await supabase
      .from("clientes")
      .update({ status: "cancelado" })
      .eq("id", cliente_id);

    if (updateClienteError) throw updateClienteError;

    // 6. Buscar na tabela linhas o registro onde cliente_id = o valor recebido e status = "ativa"
    const { data: linha, error: errorLinha } = await supabase
      .from("linhas")
      .select("id")
      .eq("cliente_id", cliente_id)
      .eq("status", "ativa")
      .maybeSingle();

    if (errorLinha) throw errorLinha;

    if (linha) {
      const { error: updateLinhaError } = await supabase
        .from("linhas")
        .update({ cliente_id: null, status: "disponivel", data_ativacao: null })
        .eq("id", linha.id);

      if (updateLinhaError) throw updateLinhaError;
    }

    // 7. Retornar sucesso
    return new Response(
      JSON.stringify({ sucesso: true, mensagem: "Assinatura cancelada com sucesso" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Erro no cancelamento:", error);
    return new Response(
      JSON.stringify({ sucesso: false, mensagem: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
