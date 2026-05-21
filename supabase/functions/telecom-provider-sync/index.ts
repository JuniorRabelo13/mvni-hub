import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getProvider } from "./adapter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const startTime = Date.now();

  try {
    const { action, linha_id, job_id } = await req.json();

    if (!action || !linha_id) {
      throw new Error("Action and linha_id are required");
    }

    // 1. Buscar dados da linha e operadora
    const { data: linha, error: linhaError } = await supabase
      .from("linhas")
      .select("*, clientes(id, nome)")
      .eq("id", linha_id)
      .single();

    if (linhaError || !linha) throw new Error("Linha não encontrada");

    // Provedor padrão se não houver na linha (ex: 'Vivo Empresas')
    const providerName = linha.operadora || "Vivo Empresas";
    const provider = getProvider(providerName);
    const msisdn = linha.msisdn;

    if (!msisdn) throw new Error("MSISDN da linha não configurado");

    console.log(`[TELECOM] Processing ${action} for ${msisdn} via ${providerName}`);

    // 2. Execução com Timeout Protection (15s)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    let result;
    try {
      switch (action) {
        case 'activate':
          result = await provider.activateLine(msisdn);
          break;
        case 'suspend':
          result = await provider.suspendLine(msisdn);
          break;
        case 'reactivate':
          result = await provider.reactivateLine(msisdn);
          break;
        case 'check_status':
          result = await provider.getLineStatus(msisdn);
          break;
        default:
          throw new Error(`Ação ${action} não suportada`);
      }
    } finally {
      clearTimeout(timeoutId);
    }

    const executionTime = Date.now() - startTime;

    // 3. Registrar Logs
    await supabase.from("telecom_provider_logs").insert({
      cliente_id: linha.clientes?.id,
      linha_id: linha.id,
      provider: providerName,
      action,
      payload: { msisdn, action },
      response: result,
      success: result.success,
      error_message: result.success ? null : result.message
    });

    // 4. Atualizar status da linha se sucesso
    if (result.success && result.status) {
      await supabase.from("linhas").update({ 
        status: result.status,
        updated_at: new Date().toISOString()
      }).eq("id", linha.id);
    }

    // 5. Atualizar Job se existir
    if (job_id) {
      await supabase.from("telecom_jobs").update({
        status: result.success ? 'completed' : 'failed',
        last_error: result.success ? null : result.message,
        updated_at: new Date().toISOString()
      }).eq("id", job_id);
    }

    console.log(JSON.stringify({
      provider: providerName,
      action,
      msisdn,
      success: result.success,
      execution_time: `${executionTime}ms`,
      status: result.status
    }));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`[TELECOM_ERROR] ${error.message} (${executionTime}ms)`);

    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
