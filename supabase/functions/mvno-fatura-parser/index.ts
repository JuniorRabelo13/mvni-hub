// Edge Function: mvno-fatura-parser
// Processa um mvno_parser_job (CSV/XLSX básico). PDF/OCR retorna pending_ai.
// Requer admin/master_admin. Distribui itens por cliente_id via linha (numero).
//
// Colunas esperadas (case-insensitive):
//   numero, competencia, descricao, categoria, quantidade, valor_unit, valor_total
// Onde numero identifica a linha (mvno_linhas.numero).

import { createClient } from "npm:@supabase/supabase-js@2";
import * as XLSX from "npm:xlsx@0.18.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Row = Record<string, string | number | undefined>;

function parseCSV(text: string): Row[] {
  const lines = text.replace(/\r/g, "").split("\n").filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const sep = lines[0].includes(";") ? ";" : ",";
  const header = lines[0].split(sep).map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const parts = line.split(sep);
    const row: Row = {};
    header.forEach((h, i) => (row[h] = parts[i]?.trim()));
    return row;
  });
}

function num(v: unknown): number {
  if (v === undefined || v === null || v === "") return 0;
  const s = String(v).replace(/\./g, "").replace(",", ".");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

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

    const body = await req.json().catch(() => ({}));
    const jobId = body?.job_id as string | undefined;
    if (!jobId) {
      return new Response(JSON.stringify({ error: "job_id obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Marca job em processamento
    await admin
      .from("mvno_parser_jobs")
      .update({ status: "processing", iniciado_em: new Date().toISOString() })
      .eq("id", jobId);

    const { data: job, error: jErr } = await admin
      .from("mvno_parser_jobs")
      .select("id, tipo, upload_id")
      .eq("id", jobId)
      .single();
    if (jErr || !job) throw jErr ?? new Error("Job não encontrado");

    const { data: upload, error: uErr } = await admin
      .from("mvno_uploads_faturas")
      .select("id, arquivo_url, competencia, operadora_id")
      .eq("id", job.upload_id)
      .single();
    if (uErr || !upload) throw uErr ?? new Error("Upload não encontrado");

    if (job.tipo === "pdf" || job.tipo === "ocr") {
      await admin
        .from("mvno_parser_jobs")
        .update({
          status: "pending_ai",
          finalizado_em: new Date().toISOString(),
          resultado: { message: "PDF/OCR aguardando integração de IA" },
        })
        .eq("id", jobId);
      await admin.from("mvno_parser_logs").insert({
        job_id: jobId,
        nivel: "info",
        mensagem: "Job marcado como pending_ai (PDF/OCR não implementado neste sprint)",
      });
      return new Response(JSON.stringify({ status: "pending_ai" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download do arquivo
    const { data: fileBlob, error: dErr } = await admin.storage
      .from("mvno-faturas-operadora")
      .download(upload.arquivo_url);
    if (dErr || !fileBlob) throw dErr ?? new Error("Arquivo não encontrado");

    let rows: Row[] = [];
    if (job.tipo === "csv") {
      rows = parseCSV(await fileBlob.text());
    } else if (job.tipo === "xlsx") {
      const buf = new Uint8Array(await fileBlob.arrayBuffer());
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      rows = raw.map((r) => {
        const o: Row = {};
        for (const k of Object.keys(r)) o[k.toLowerCase().trim()] = r[k] as any;
        return o;
      });
    }

    let processadas = 0;
    let erros = 0;

    // Cache linha->cliente
    const linhaCache = new Map<string, { id: string; cliente_id: string | null }>();

    // Agrupa por numero+competencia => fatura
    const grouped = new Map<string, { numero: string; competencia: string; rows: Row[] }>();
    for (const r of rows) {
      const numero = String(r["numero"] ?? "").trim();
      const comp = String(r["competencia"] ?? upload.competencia).slice(0, 10);
      if (!numero) {
        erros++;
        continue;
      }
      const key = `${numero}__${comp}`;
      if (!grouped.has(key)) grouped.set(key, { numero, competencia: comp, rows: [] });
      grouped.get(key)!.rows.push(r);
    }

    for (const [, g] of grouped) {
      try {
        let linha = linhaCache.get(g.numero);
        if (!linha) {
          const { data: l } = await admin
            .from("mvno_linhas")
            .select("id, cliente_id")
            .eq("numero", g.numero)
            .maybeSingle();
          if (!l) {
            erros++;
            await admin.from("mvno_parser_logs").insert({
              job_id: jobId,
              nivel: "warn",
              mensagem: `Linha ${g.numero} não encontrada`,
            });
            continue;
          }
          linha = l;
          linhaCache.set(g.numero, l);
        }

        const valorTotal = g.rows.reduce((s, r) => s + num(r["valor_total"]), 0);

        // Upsert fatura por (linha_id, competencia)
        const { data: fatura, error: fErr } = await admin
          .from("mvno_faturas")
          .upsert(
            {
              linha_id: linha.id,
              cliente_id: linha.cliente_id,
              competencia: g.competencia,
              valor: valorTotal,
              status: "aberta",
              vencimento: g.competencia,
            },
            { onConflict: "linha_id,competencia" },
          )
          .select()
          .single();
        if (fErr || !fatura) throw fErr ?? new Error("Erro fatura");

        // Substitui itens
        await admin.from("mvno_fatura_itens").delete().eq("fatura_id", fatura.id);
        const itens = g.rows.map((r) => ({
          fatura_id: fatura.id,
          descricao: String(r["descricao"] ?? "Item"),
          categoria: (String(r["categoria"] ?? "outros").toLowerCase() as any) || "outros",
          quantidade: num(r["quantidade"]) || 1,
          valor_unit: num(r["valor_unit"]),
          valor_total: num(r["valor_total"]),
        }));
        if (itens.length) await admin.from("mvno_fatura_itens").insert(itens);

        processadas++;
      } catch (e) {
        erros++;
        await admin.from("mvno_parser_logs").insert({
          job_id: jobId,
          nivel: "error",
          mensagem: `Erro processando ${g.numero}: ${String((e as Error).message)}`,
        });
      }
    }

    await admin
      .from("mvno_uploads_faturas")
      .update({
        status: erros === 0 ? "done" : "partial",
        total_linhas: grouped.size,
        processadas,
        erros_count: erros,
      })
      .eq("id", upload.id);

    await admin
      .from("mvno_parser_jobs")
      .update({
        status: "done",
        finalizado_em: new Date().toISOString(),
        resultado: { processadas, erros, total: grouped.size },
      })
      .eq("id", jobId);

    return new Response(JSON.stringify({ processadas, erros, total: grouped.size }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("mvno-fatura-parser error", e);
    return new Response(JSON.stringify({ error: String((e as Error)?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
