import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.2";

// HMAC-SHA256 helper for webhook signature validation
async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type"); // dlr ou mo

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
    }

    // Read raw body to verify HMAC before parsing
    const rawBody = await req.text();
    const signature =
      req.headers.get("X-Webhook-Signature") ||
      req.headers.get("x-webhook-signature") ||
      "";

    // Global webhook secret (fallback) used for all inbound webhook traffic
    const globalSecret = Deno.env.get("SMS_WEBHOOK_SECRET") || "";

    // Parse payload after we have the raw body
    let payload: Record<string, unknown> = {};
    try { payload = JSON.parse(rawBody); } catch { payload = {}; }

    // SECURITY: signature is REQUIRED. We try the global secret first; for MO we
    // also try the per-user webhook_secret looked up by MSISDN.
    let verified = false;
    if (signature && globalSecret) {
      const expected = await hmacSha256Hex(globalSecret, rawBody);
      if (expected === signature) verified = true;
    }

    let resolvedUserId: string | null = null;

    if (type === "mo" && !verified) {
      const msisdn = (payload as any).msisdn;
      if (msisdn && signature) {
        // Find user by recipient mapping (sms_messages history) and try per-user secret
        const { data: lastMsg } = await supabase
          .from("sms_messages")
          .select("user_id")
          .eq("telefone", msisdn)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (lastMsg?.user_id) {
          const { data: settings } = await supabase
            .from("sms_settings")
            .select("webhook_secret")
            .eq("user_id", lastMsg.user_id)
            .maybeSingle();
          if (settings?.webhook_secret) {
            const expected = await hmacSha256Hex(settings.webhook_secret, rawBody);
            if (expected === signature) {
              verified = true;
              resolvedUserId = lastMsg.user_id;
            }
          }
        }
      }
    }

    if (!verified) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }

    if (type === "dlr") {
      const { subid, status } = payload as any;
      const mappedStatus = status === "0" ? "delivered" : "failed";
      await supabase.from("sms_messages")
        .update({ status: mappedStatus, updated_at: new Date().toISOString() })
        .eq("provider_id", subid);
    } else if (type === "mo") {
      const { msisdn, message } = payload as any;
      // SECURITY: NEVER trust user_id from payload body. Resolve from MSISDN.
      if (!resolvedUserId) {
        const { data: lastMsg } = await supabase
          .from("sms_messages")
          .select("user_id")
          .eq("telefone", msisdn)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        resolvedUserId = lastMsg?.user_id ?? null;
      }
      if (!resolvedUserId) {
        return new Response(JSON.stringify({ error: "Unknown recipient" }), { status: 400, headers: { "Content-Type": "application/json" } });
      }
      await supabase.from("sms_messages").insert({
        user_id: resolvedUserId,
        telefone: msisdn,
        mensagem: message,
        direcao: "inbound",
        status: "delivered",
      });
    }

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
});
