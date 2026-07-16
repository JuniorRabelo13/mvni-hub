// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "unauthorized" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const PAGARME_API_KEY = Deno.env.get("PAGARME_API_KEY");
    const PAGARME_BASE_URL = Deno.env.get("PAGARME_BASE_URL") ?? "https://api.pagar.me/core/v5";
    if (!PAGARME_API_KEY) return json({ error: "pagarme_not_configured" }, 500);

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

    // RLS assegura ownership
    const { data: fatura, error: fatErr } = await userClient
      .from("mvno_faturas")
      .select("id, cliente_id, linha_id, valor, vencimento, status, competencia, linha:mvno_linhas(numero)")
      .eq("id", faturaId)
      .maybeSingle();

    if (fatErr) return json({ error: "db_error", details: fatErr.message }, 500);
    if (!fatura) return json({ error: "fatura_not_found_or_forbidden" }, 404);
    if (fatura.status === "paga") return json({ error: "fatura_ja_paga" }, 409);

    const service = createClient(SUPABASE_URL, SERVICE);

    // Reaproveita PIX pendente ainda válido
    const { data: existente } = await service
      .from("mvno_pagamentos")
      .select("*")
      .eq("fatura_id", faturaId)
      .eq("status", "pendente")
      .eq("gateway", "pagarme")
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
        provider_intent_id: existente.gateway_transaction_id ?? existente.provider_intent_id,
      });
    }

    const amountCents = Math.round(Number(fatura.valor) * 100);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    // Buscar cliente (nome/documento) para payload do Pagar.me
    const { data: cliente } = await service
      .from("clientes")
      .select("nome, cpf, email")
      .eq("id", fatura.cliente_id)
      .maybeSingle();

    const customerName = cliente?.nome || user.email || "Cliente MVNO";
    const customerDoc = (cliente?.cpf || "").replace(/\D/g, "");
    const customerEmail = cliente?.email || user.email || "";

    const orderPayload = {
      items: [
        {
          amount: amountCents,
          description: `Fatura MVNO ${String(fatura.competencia ?? "").slice(0, 7)} - Linha ${(fatura as any).linha?.numero ?? "-"}`,
          quantity: 1,
        },
      ],
      customer: {
        name: customerName,
        email: customerEmail,
        type: "individual",
        ...(customerDoc && customerDoc.length >= 11
          ? { document: customerDoc, document_type: "cpf" }
          : {}),
      },
      payments: [
        {
          payment_method: "pix",
          pix: {
            expires_at: expiresAt.toISOString(),
            additional_information: [
              { name: "Fatura", value: fatura.id },
            ],
          },
        },
      ],
      metadata: {
        fatura_id: fatura.id,
        cliente_id: fatura.cliente_id ?? "",
        linha_id: fatura.linha_id ?? "",
        user_id: user.id,
        source: "mvno_pix",
      },
    };

    const basic = btoa(`${PAGARME_API_KEY}:`);
    const pmRes = await fetch(`${PAGARME_BASE_URL}/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${basic}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderPayload),
    });

    const pmJson = await pmRes.json().catch(() => ({}));
    if (!pmRes.ok) {
      console.error("pagarme error:", pmRes.status, pmJson);
      return json({ error: "pagarme_error", status: pmRes.status, details: pmJson }, 502);
    }

    const charge = (pmJson.charges ?? [])[0] ?? {};
    const lastTx = charge?.last_transaction ?? {};
    const qr_code: string | null = lastTx?.qr_code ?? null;                 // copia-e-cola (BR code)
    const qr_code_url: string | null = lastTx?.qr_code_url ?? null;         // URL da imagem
    const tx_expires_at: string | null = lastTx?.expires_at ?? expiresAt.toISOString();
    const transactionId: string = charge?.id ?? pmJson?.id;

    const { data: pag, error: pagErr } = await service
      .from("mvno_pagamentos")
      .insert({
        fatura_id: fatura.id,
        cliente_id: fatura.cliente_id,
        linha_id: fatura.linha_id,
        provider: "pagarme_pix",
        provider_intent_id: transactionId,
        gateway: "pagarme",
        gateway_transaction_id: transactionId,
        gateway_status: charge?.status ?? "pending",
        valor: Number(fatura.valor),
        status: "pendente",
        pix_qr_code_base64: qr_code_url,
        pix_copia_e_cola: qr_code,
        expires_at: tx_expires_at,
        payload: pmJson,
        metadata: { user_id: user.id, competencia: fatura.competencia },
      })
      .select("*")
      .single();

    if (pagErr) return json({ error: "insert_error", details: pagErr.message }, 500);

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
      pix_copia_e_cola: qr_code,
      pix_qr_code_base64: qr_code_url,
      expires_at: tx_expires_at,
      valor: Number(pag.valor),
      provider_intent_id: transactionId,
    });
  } catch (e: any) {
    console.error("mvno-pagarme-pix-criar error:", e);
    return json({ error: "internal_error", details: e?.message }, 500);
  }
});
