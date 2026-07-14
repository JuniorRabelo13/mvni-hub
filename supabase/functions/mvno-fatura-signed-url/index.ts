// Edge Function: mvno-fatura-signed-url
// Gera signed URL curta (5 min) para o cliente baixar seu PDF da fatura.
// Verifica ownership via RLS (client scoped) antes de assinar.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const body = await req.json().catch(() => ({}));
    const faturaId = body?.fatura_id as string | undefined;
    if (!faturaId) {
      return new Response(JSON.stringify({ error: "fatura_id obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // RLS aplica: usuário só vê a fatura se for dele (via clientes.user_id) ou admin.
    const { data: fatura, error } = await userClient
      .from("mvno_faturas")
      .select("id, pdf_url")
      .eq("id", faturaId)
      .maybeSingle();

    if (error || !fatura) {
      return new Response(JSON.stringify({ error: "Fatura não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!fatura.pdf_url) {
      return new Response(JSON.stringify({ error: "PDF indisponível" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: signed, error: sErr } = await admin.storage
      .from("mvno-faturas-cliente")
      .createSignedUrl(fatura.pdf_url, 300);
    if (sErr) throw sErr;

    return new Response(JSON.stringify({ url: signed.signedUrl, expires_in: 300 }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("mvno-fatura-signed-url error", e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
