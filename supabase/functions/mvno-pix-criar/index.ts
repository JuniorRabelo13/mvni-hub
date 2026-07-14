// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "unauthorized" }, 401);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const STRIPE_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_KEY) return json({ error: "stripe_not_configured" }, 500);

    // User-scoped client (respeita RLS na leitura da fatura)
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "unauthorized" }, 401);
    const user = userData.user;

    const body = await req.json().catch(() => ({}));
    const faturaId: string | undefined = body?.fatura_id;
    if (!faturaId || typeof faturaId !== "string") {
      return json({ error: "fatura_id_required" }, 400);
    }

    // Leitura via RLS: se o cliente não tiver acesso, retorna vazio
    const { data: fatura, error: fatErr } = await userClient
      .from("mvno_faturas")
      .select(
        "id, cliente_id, linha_id, valor, vencimento, status, competencia, linha:mvno_linhas(numero)",
      )
      .eq("id", faturaId)
      .maybeSingle();

    if (fatErr) return json({ error: "db_error", details: fatErr.message }, 500);
    if (!fatura) return json({ error: "fatura_not_found_or_forbidden" }, 404);
    if (fatura.status === "paga") {
      return json({ error: "fatura_ja_paga" }, 409);
    }

    const service = createClient(SUPABASE_URL, SERVICE);

    // Reaproveita pagamento pendente ainda válido
    const { data: existente } = await service
      .from("mvno_pagamentos")
      .select("*")
      .eq("fatura_id", faturaId)
      .eq("status", "pendente")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existente && existente.expires_at && new Date(existente.expires_at) > new Date()) {
      return json({
        pagamento_id: existente.id,
        status: existente.status,
        pix_copia_e_cola: existente.pix_copia_e_cola,
        pix_qr_code_base64: existente.pix_qr_code_base64,
        expires_at: existente.expires_at,
        valor: Number(existente.valor),
        provider_intent_id: existente.provider_intent_id,
      });
    }

    const stripe = new Stripe(STRIPE_KEY, { apiVersion: "2024-06-20" });
    const amountCents = Math.round(Number(fatura.valor) * 100);

    // Cria e confirma PaymentIntent PIX em uma etapa
    const intent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "brl",
      payment_method_types: ["pix"],
      payment_method_data: { type: "pix" },
      confirm: true,
      description: `Fatura MVNO ${fatura.competencia?.slice(0, 7)} · Linha ${
        (fatura as any).linha?.numero ?? "-"
      }`,
      metadata: {
        fatura_id: fatura.id,
        cliente_id: fatura.cliente_id ?? "",
        linha_id: fatura.linha_id ?? "",
        user_id: user.id,
        source: "mvno_pix",
      },
    });

    const next: any = (intent as any).next_action?.pix_display_qr_code ?? {};
    const pix_copia_e_cola: string | null = next?.data ?? null;
    const pix_qr_code_base64: string | null = next?.image_url_png ?? next?.image_url_svg ?? null;
    const expires_at = next?.expires_at
      ? new Date(next.expires_at * 1000).toISOString()
      : new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const { data: pag, error: pagErr } = await service
      .from("mvno_pagamentos")
      .insert({
        fatura_id: fatura.id,
        cliente_id: fatura.cliente_id,
        linha_id: fatura.linha_id,
        provider: "stripe_pix",
        provider_intent_id: intent.id,
        valor: Number(fatura.valor),
        status: "pendente",
        pix_qr_code_base64,
        pix_copia_e_cola,
        expires_at,
        metadata: { user_id: user.id, competencia: fatura.competencia },
      })
      .select("*")
      .single();

    if (pagErr) return json({ error: "insert_error", details: pagErr.message }, 500);

    // Marca fatura como processando (visual)
    if (fatura.status !== "processando") {
      await service
        .from("mvno_faturas")
        .update({ status: "processando" })
        .eq("id", fatura.id)
        .eq("status", fatura.status);
    }

    return json({
      pagamento_id: pag.id,
      status: pag.status,
      pix_copia_e_cola: pag.pix_copia_e_cola,
      pix_qr_code_base64: pag.pix_qr_code_base64,
      expires_at: pag.expires_at,
      valor: Number(pag.valor),
      provider_intent_id: pag.provider_intent_id,
    });
  } catch (e: any) {
    console.error("mvno-pix-criar error:", e);
    return json({ error: "internal_error", details: e?.message }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
