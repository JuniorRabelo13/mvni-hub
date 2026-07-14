// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, stripe-signature",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const STRIPE_KEY = Deno.env.get("STRIPE_SECRET_KEY");
  const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET_MVNO");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (!STRIPE_KEY || !WEBHOOK_SECRET) {
    return new Response("stripe_not_configured", { status: 500, headers: corsHeaders });
  }

  const stripe = new Stripe(STRIPE_KEY, { apiVersion: "2024-06-20" });
  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("missing signature", { status: 400, headers: corsHeaders });

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(raw, signature, WEBHOOK_SECRET);
  } catch (e: any) {
    console.error("webhook signature error:", e?.message);
    return new Response(`invalid signature: ${e?.message}`, { status: 400, headers: corsHeaders });
  }

  const service = createClient(SUPABASE_URL, SERVICE);

  try {
    // Idempotência: registrar event id
    const { data: seen } = await service
      .from("processed_events")
      .select("id")
      .eq("event_id", event.id)
      .maybeSingle();
    if (seen) return new Response("already processed", { status: 200, headers: corsHeaders });

    if (
      event.type === "payment_intent.succeeded" ||
      event.type === "payment_intent.payment_failed" ||
      event.type === "payment_intent.canceled"
    ) {
      const pi = event.data.object as Stripe.PaymentIntent;
      // Somente PIX MVNO
      const source = pi.metadata?.source;
      if (source !== "mvno_pix") {
        return new Response("ignored (not mvno_pix)", { status: 200, headers: corsHeaders });
      }

      const { data: pag } = await service
        .from("mvno_pagamentos")
        .select("id, fatura_id, status")
        .eq("provider_intent_id", pi.id)
        .maybeSingle();

      if (!pag) {
        console.warn("pagamento not found for intent", pi.id);
        return new Response("pagamento not found", { status: 200, headers: corsHeaders });
      }

      if (event.type === "payment_intent.succeeded" && pag.status !== "confirmado") {
        await service
          .from("mvno_pagamentos")
          .update({ status: "confirmado", paid_at: new Date().toISOString() })
          .eq("id", pag.id);

        await service
          .from("mvno_faturas")
          .update({ status: "paga", pago_em: new Date().toISOString() })
          .eq("id", pag.fatura_id);
      } else if (event.type === "payment_intent.payment_failed") {
        await service
          .from("mvno_pagamentos")
          .update({ status: "falhou" })
          .eq("id", pag.id);
      } else if (event.type === "payment_intent.canceled") {
        await service
          .from("mvno_pagamentos")
          .update({ status: "cancelado" })
          .eq("id", pag.id);
      }
    }

    await service.from("processed_events").insert({ event_id: event.id, source: "mvno_pix" });
    return new Response("ok", { status: 200, headers: corsHeaders });
  } catch (e: any) {
    console.error("mvno-pix-webhook error:", e);
    return new Response(`error: ${e?.message}`, { status: 500, headers: corsHeaders });
  }
});
