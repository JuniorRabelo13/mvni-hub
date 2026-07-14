// Edge Function: mvno-fatura-upload
// Recebe upload multipart de fatura da operadora, salva no bucket privado
// mvno-faturas-operadora e cria registro em mvno_uploads_faturas + job em mvno_parser_jobs.
// Requer admin/master_admin.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

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
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: cErr } = await userClient.auth.getClaims(token);
    if (cErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub;

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "master_admin"]);
    if (!roles?.length) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;
    const operadoraId = form.get("operadora_id") as string | null;
    const competencia = form.get("competencia") as string | null; // YYYY-MM-01

    if (!file || !operadoraId || !competencia) {
      return new Response(
        JSON.stringify({ error: "file, operadora_id e competencia são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    const mime = file.type || "application/octet-stream";
    const path = `${operadoraId}/${competencia}/${crypto.randomUUID()}.${ext}`;

    const { error: upErr } = await admin.storage
      .from("mvno-faturas-operadora")
      .upload(path, file, { contentType: mime, upsert: false });
    if (upErr) throw upErr;

    const { data: upload, error: iErr } = await admin
      .from("mvno_uploads_faturas")
      .insert({
        uploader_id: userId,
        operadora_id: operadoraId,
        competencia,
        arquivo_url: path,
        mime,
        status: "pending",
      })
      .select()
      .single();
    if (iErr) throw iErr;

    const tipo =
      ext === "csv" ? "csv" : ext === "xlsx" || ext === "xls" ? "xlsx" : ext === "pdf" ? "pdf" : "ocr";

    const { data: job, error: jErr } = await admin
      .from("mvno_parser_jobs")
      .insert({ upload_id: upload.id, tipo, status: "pending" })
      .select()
      .single();
    if (jErr) throw jErr;

    return new Response(JSON.stringify({ upload, job }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("mvno-fatura-upload error", e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
