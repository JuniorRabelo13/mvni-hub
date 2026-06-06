import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireUser } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // 1) Auth: user_id ALWAYS from JWT (never from body)
  const { user, response } = await requireUser(req);
  if (!user) {
    return new Response(response?.body, {
      status: response?.status ?? 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 2) Secrets (never logged)
  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  const priceId = Deno.env.get("STRIPE_PRICE_CADASTRO_REPRESENTANTE");
  if (!stripeSecretKey || !priceId) {
    console.error("checkout-cadastro: missing required secret");
    return jsonResponse({ error: "Configuração de pagamento indisponível" }, 500);
  }

  try {
    // 3) Resolve URLs from request origin (fallback safe)
    const origin =
      req.headers.get("origin") ||
      req.headers.get("referer")?.replace(/\/+$/, "") ||
      "https://app.mvni.hub";
    const success_url = `${origin}/cadastro/sucesso?session_id={CHECKOUT_SESSION_ID}`;
    const cancel_url = `${origin}/cadastro?canceled=1`;

    // 4) Try to reuse existing stripe_customer_id (no duplicate customer)
    let stripeCustomerId: string | null = null;
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );
      const { data: existing } = await supabase
        .from("assinaturas")
        .select("stripe_customer_id")
        .eq("cliente_id", user.id)
        .not("stripe_customer_id", "is", null)
        .limit(1)
        .maybeSingle();
      if (existing?.stripe_customer_id) stripeCustomerId = existing.stripe_customer_id;
    } catch {
      // non-fatal: fall back to customer_email
    }

    // 5) Build Stripe Checkout Session (mode=payment, single charge)
    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set("line_items[0][price]", priceId);
    params.set("line_items[0][quantity]", "1");
    params.append("payment_method_types[]", "card");
    params.set("success_url", success_url);
    params.set("cancel_url", cancel_url);

    if (stripeCustomerId) {
      params.set("customer", stripeCustomerId);
    } else if (user.email) {
      params.set("customer_email", user.email);
    }

    // Metadata on the session
    params.set("metadata[user_id]", user.id);
    params.set("metadata[tipo_cobranca]", "cadastro_representante");
    params.set("metadata[origem]", "mvni_hub");
    // Mirror metadata on the resulting PaymentIntent for webhook reconciliation
    params.set("payment_intent_data[metadata][user_id]", user.id);
    params.set("payment_intent_data[metadata][tipo_cobranca]", "cadastro_representante");
    params.set("payment_intent_data[metadata][origem]", "mvni_hub");

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    if (!stripeRes.ok) {
      // Do not leak secret/body details
      console.error("checkout-cadastro: stripe error", stripeRes.status);
      return jsonResponse({ error: "Falha ao criar checkout" }, 502);
    }

    const session = await stripeRes.json();
    if (!session?.url) {
      console.error("checkout-cadastro: missing session url");
      return jsonResponse({ error: "Falha ao criar checkout" }, 502);
    }

    // 6) Return ONLY the URL (no secrets, no internal IDs)
    return jsonResponse({ url: session.url }, 200);
  } catch (err) {
    console.error("checkout-cadastro: unexpected error", (err as Error).message);
    return jsonResponse({ error: "Falha ao criar checkout" }, 500);
  }
});
