// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createHmac } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-hub-signature, x-pagarme-signature",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const WEBHOOK_SECRET = Deno.env.get("PAGARME_WEBHOOK_SECRET");

  if (!WEBHOOK_SECRET) {
    return new Response("pagarme_webhook_not_configured", { status: 500, headers: corsHeaders });
  }

  const raw = await req.text();

  // Assinatura HMAC-SHA256 do body (Pagar.me envia em x-hub-signature: sha256=<hex>)
  const sigHeader =
    req.headers.get("x-hub-signature") ??
    req.headers.get("x-pagarme-signature") ??
    "";
  const provided = sigHeader.startsWith("sha256=") ? sigHeader.slice(7) : sigHeader;
  const expected = createHmac("sha256", WEBHOOK_SECRET).update(raw).digest("hex");
  const okSig =
    provided.length === expected.length &&
    // constant-time compare
    provided.split("").reduce((acc, c, i) => acc | (c.charCodeAt(0) ^ expected.charCodeAt(i)), 0) === 0;

  if (!okSig) {
    console.warn("pagarme webhook: invalid signature");
    return new Response("invalid_signature", { status: 401, headers: corsHeaders });
  }

  let event: any;
  try { event = JSON.parse(raw); } catch { return new Response("bad_json", { status: 400, headers: corsHeaders }); }

  const service = createClient(SUPABASE_URL, SERVICE);
  const eventId: string = event?.id ?? `${event?.type}-${Date.now()}`;

  // Idempotência
  const { data: seen } = await service
    .from("processed_events")
    .select("id")
    .eq("event_id", eventId)
    .maybeSingle();
  if (seen) return new Response("already_processed", { status: 200, headers: corsHeaders });

  const type: string = event?.type ?? "";
  const chargeObj = event?.data ?? {};
  // Em eventos "charge.*" data é a própria charge; em "order.*" tem data.charges[0]
  const charge = chargeObj?.charges?.[0] ?? chargeObj;
  const gatewayTxId: string | null = charge?.id ?? null;
  const chargeStatus: string = charge?.status ?? "";

  try {
    if (gatewayTxId) {
      const { data: pag } = await service
        .from("mvno_pagamentos")
        .select("id, fatura_id, status")
        .eq("gateway_transaction_id", gatewayTxId)
        .maybeSingle();

      if (pag) {
        const nowIso = new Date().toISOString();

        if (type === "charge.paid" || chargeStatus === "paid") {
          if (pag.status !== "confirmado") {
            await service
              .from("mvno_pagamentos")
              .update({
                status: "confirmado",
                paid_at: nowIso,
                processed_at: nowIso,
                gateway_status: chargeStatus || "paid",
                payload: event,
              })
              .eq("id", pag.id);

            await service
              .from("mvno_faturas")
              .update({ status: "paga", pago_em: nowIso })
              .eq("id", pag.fatura_id);

            await service.from("mvno_audit_logs").insert({
              action: "pagamento_confirmado",
              entity: "mvno_pagamentos",
              entity_id: pag.id,
              metadata: { gateway: "pagarme", event_id: eventId, transaction_id: gatewayTxId },
            }).select().maybeSingle().then(() => null).catch(() => null);
          }
        } else if (type === "charge.payment_failed" || chargeStatus === "failed") {
          await service.from("mvno_pagamentos")
            .update({ status: "falhou", processed_at: nowIso, gateway_status: chargeStatus || "failed", payload: event })
            .eq("id", pag.id);
        } else if (type === "charge.canceled" || chargeStatus === "canceled") {
          await service.from("mvno_pagamentos")
            .update({ status: "cancelado", processed_at: nowIso, gateway_status: chargeStatus || "canceled", payload: event })
            .eq("id", pag.id);
        } else {
          await service.from("mvno_pagamentos")
            .update({ gateway_status: chargeStatus || type, payload: event })
            .eq("id", pag.id);
        }
      } else {
        console.warn("pagamento not found for gateway tx", gatewayTxId);
      }
    }

    await service.from("processed_events").insert({ event_id: eventId, source: "pagarme_pix" });
    return new Response("ok", { status: 200, headers: corsHeaders });
  } catch (e: any) {
    console.error("mvno-pagarme-webhook error:", e);
    return new Response(`error: ${e?.message}`, { status: 500, headers: corsHeaders });
  }
});
