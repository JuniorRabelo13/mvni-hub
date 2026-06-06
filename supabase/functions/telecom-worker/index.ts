import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireCronOrAdmin } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // SECURITY: cron/internal secret or admin only
  const _authResp = await requireCronOrAdmin(req);
  if (_authResp) return new Response(_authResp.body, { status: _authResp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    console.log("[TELECOM-WORKER] Starting job polling...");

    // 1. Buscar jobs pendentes ou falhados com tentativas restantes
    const { data: jobs, error: fetchError } = await supabase
      .from("telecom_jobs")
      .select("*")
      .or('status.eq.pending,status.eq.failed')
      .lt('attempts', 3)
      .order('created_at', { ascending: true })
      .limit(10);

    if (fetchError) throw fetchError;
    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ message: "No jobs to process" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = [];

    for (const job of jobs) {
      // Exponential Backoff check
      if (job.status === 'failed') {
        const lastUpdate = new Date(job.updated_at).getTime();
        const now = Date.now();
        const waitTime = Math.pow(2, job.attempts) * 60 * 1000; // 2^1 * 1min, 2^2 * 1min, etc.
        
        if (now - lastUpdate < waitTime) {
          console.log(`[TELECOM-WORKER] Skipping job ${job.id} - waiting for backoff`);
          continue;
        }
      }

      console.log(`[TELECOM-WORKER] Processing job ${job.id} (${job.action})`);

      // Marcar como processando
      await supabase.from("telecom_jobs").update({ 
        status: 'processing',
        attempts: job.attempts + 1,
        updated_at: new Date().toISOString()
      }).eq("id", job.id);

      try {
        // Chamar a função de sync (internamente ou via HTTP)
        // Para garantir o timeout de 15s e isolamento, chamamos via HTTP
        const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/telecom-provider-sync`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            action: job.action,
            linha_id: job.linha_id,
            job_id: job.id
          }),
        });

        const data = await response.json();
        results.push({ job_id: job.id, success: data.success });

      } catch (err) {
        console.error(`[TELECOM-WORKER] Error processing job ${job.id}:`, err.message);
        await supabase.from("telecom_jobs").update({
          status: 'failed',
          last_error: err.message,
          updated_at: new Date().toISOString()
        }).eq("id", job.id);
        results.push({ job_id: job.id, success: false, error: err.message });
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
