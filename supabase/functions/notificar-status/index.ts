import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { type, cliente_id, msisdn, status } = await req.json();

    // 1. Buscar dados do cliente e template
    const { data: cliente, error: clientErr } = await supabaseClient
      .from("clientes")
      .select("nome, telefone, notify_whatsapp")
      .eq("id", cliente_id)
      .single();

    if (clientErr || !cliente || !cliente.notify_whatsapp) {
      return new Response(JSON.stringify({ skipped: true, reason: "Client not found or notifications disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const slug = type === "welcome" ? "welcome" : status === "suspensa" ? "suspended" : "reactivated";
    const { data: template } = await supabaseClient
      .from("whatsapp_templates")
      .select("body")
      .eq("slug", slug)
      .single();

    if (!template) throw new Error("Template not found");

    // 2. Substituir variáveis
    let message = template.body
      .replace("{{nome}}", cliente.nome)
      .replace("{{msisdn}}", msisdn || "")
      .replace("{{saas_name}}", "MVNI Hub");

    // 3. Enviar via API de WhatsApp (Exemplo: Z-API ou similar)
    const WHATSAPP_API_URL = Deno.env.get("WHATSAPP_API_URL");
    const WHATSAPP_API_TOKEN = Deno.env.get("WHATSAPP_API_TOKEN");

    if (!WHATSAPP_API_URL || !WHATSAPP_API_TOKEN) {
      console.error("WhatsApp API credentials not set");
      return new Response(JSON.stringify({ error: "API credentials missing" }), { status: 500 });
    }

    const response = await fetch(WHATSAPP_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${WHATSAPP_API_TOKEN}`,
      },
      body: JSON.stringify({
        phone: cliente.telefone.replace(/\D/g, ""),
        message: message,
      }),
    });

    const result = await response.json();

    // 4. Logar resultado
    await supabaseClient.from("whatsapp_logs").insert({
      cliente_id,
      status: response.ok ? "sent" : "failed",
      message_body: message,
      error_message: response.ok ? null : JSON.stringify(result),
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: response.ok ? 200 : 400,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
