import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    let continueProcessing = true;
    let processedCount = 0;

    while (continueProcessing && processedCount < 50) { // Limit loop per execution to avoid timeout
      // 1. Reivindicar próximo chunk
      const { data: chunk, error: claimError } = await supabaseAdmin.rpc("claim_next_import_chunk");

      if (claimError) {
        console.error("Erro ao reivindicar chunk:", claimError);
        break;
      }

      if (!chunk) {
        console.log("Nenhum chunk pendente encontrado.");
        break;
      }

      // 2. Verificar proteção contra loop infinito e cancelamento (conforme ETAPA 6)
      const { data: job, error: jobError } = await supabaseAdmin
        .from("import_jobs")
        .select("status, cancelado")
        .eq("id", chunk.job_id)
        .single();

      if (jobError || !job || job.cancelado || job.status === "canceled" || job.status === "done" || chunk.tentativas >= 3) {
        console.log(`Parando processamento para chunk ${chunk.id}: Job cancelado ou limite atingido.`);
        
        // Se cancelado ou limite de tentativas atingido, atualizar chunk
        if (chunk.tentativas >= 3) {
          await supabaseAdmin.rpc("fail_import_chunk", { 
            p_chunk_id: chunk.id, 
            p_erro: "Limite de tentativas (3) atingido." 
          });
        }
        continue;
      }

      try {
        console.log(`Processando chunk ${chunk.id} do job ${chunk.job_id}...`);
        
        // LOGICA DE IMPORTAÇÃO (Exemplo genérico)
        // Aqui você integraria com a lógica real de processamento de clientes/linhas
        // Para este exemplo, apenas simulamos sucesso
        
        // 3. Simular sucesso
        const { error: updateError } = await supabaseAdmin
          .from("import_chunks")
          .update({ status: "done", updated_at: new Date().toISOString() })
          .eq("id", chunk.id);

        if (updateError) throw updateError;

        // Atualizar progresso do job
        const { data: currentJob } = await supabaseAdmin
          .from("import_jobs")
          .select("linhas_processadas, total_linhas")
          .eq("id", chunk.id)
          .single();
        
        // Nota: Idealmente usar um incremento atômico no DB
        await supabaseAdmin.rpc("increment_job_progress", { p_job_id: chunk.job_id });

      } catch (err: any) {
        console.error(`Falha no chunk ${chunk.id}:`, err);
        
        // ETAPA 2 — RETRY COM BACKOFF
        await supabaseAdmin.rpc("fail_import_chunk", { 
          p_chunk_id: chunk.id, 
          p_erro: err.message || "Erro desconhecido durante o processamento" 
        });

        // Registrar no log de erros (ETAPA 3)
        await supabaseAdmin.from("import_logs").insert({
          job_id: chunk.job_id,
          cnpj: chunk.payload?.cnpj || null,
          erro: err.message,
          payload: chunk.payload
        });
      }

      processedCount++;
    }

    return new Response(JSON.stringify({ success: true, processed: processedCount }), {
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
