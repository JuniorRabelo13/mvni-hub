import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BATCH_SIZE = 1000;
const PARALLEL_CALLS = 3;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const workerId = crypto.randomUUID();

  try {
    // 1. Processamento em paralelo com Promise.all
    const runBatch = async () => {
      let totalProcessed = 0;
      
      // Busca um lote de chunks (até 1000)
      const { data: chunks, error: claimError } = await supabaseAdmin.rpc("claim_batch_import_chunks", { 
        p_batch_size: BATCH_SIZE 
      });

      if (claimError || !chunks || chunks.length === 0) return 0;

      const payloads = chunks.map((c: any) => c.payload);
      const chunkIds = chunks.map((c: any) => c.id);

      try {
        // 2. UPSERT massivo em uma única query SQL via RPC
        const { error: upsertError } = await supabaseAdmin.rpc("upsert_import_batch", { 
          p_payloads: payloads 
        });

        if (upsertError) throw upsertError;

        // 3. Marcar chunks como concluídos em massa
        await supabaseAdmin
          .from("import_chunks")
          .update({ status: "done", updated_at: new Date().toISOString() })
          .in("id", chunkIds);

        // 4. Atualizar progresso do job (incremento atômico para evitar concorrência)
        const jobId = chunks[0].job_id;
        await supabaseAdmin.rpc("increment_job_progress_batch", { 
          p_job_id: jobId, 
          p_amount: chunks.length 
        });

        totalProcessed = chunks.length;
      } catch (err) {
        console.error("Erro no batch upsert:", err);
        // Fallback: marcar chunks individuais como falha
        for (const id of chunkIds) {
          await supabaseAdmin.rpc("fail_import_chunk", { p_chunk_id: id, p_erro: err.message });
        }
      }

      // 5. Heartbeat atualizado a cada batch
      await supabaseAdmin.rpc("update_import_heartbeat", { p_worker_id: workerId });

      return totalProcessed;
    };

    // Executa 3 chamadas simultâneas
    const results = await Promise.all(Array(PARALLEL_CALLS).fill(null).map(() => runBatch()));
    const processedCount = results.reduce((a, b) => a + b, 0);

    return new Response(JSON.stringify({ success: true, processed: processedCount, worker_id: workerId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});