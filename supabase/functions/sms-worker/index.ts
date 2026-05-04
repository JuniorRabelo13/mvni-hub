import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // 1. Pegar lote de mensagens para enviar
    const { data: messages, error: claimError } = await supabase.rpc("sms_claim_messages", { p_limit: 20 });
    
    if (claimError) throw claimError;
    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ message: "Sem mensagens pendentes" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const results = [];

    for (const msg of messages) {
      // Pegar configurações do usuário
      const { data: settings } = await supabase.from("sms_settings").select("*").eq("user_id", msg.user_id).single();

      if (!settings?.labsmobile_username || !settings?.labsmobile_token) {
        await supabase.from("sms_messages").update({ status: "failed", erro: "Configurações LabsMobile ausentes" }).eq("id", msg.id);
        results.push({ id: msg.id, status: "failed", error: "Missing settings" });
        continue;
      }

      // Enviar via LabsMobile API
      try {
        const auth = btoa(`${settings.labsmobile_username}:${settings.labsmobile_token}`);
        const response = await fetch("https://api.labsmobile.com/json/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${auth}`,
          },
          body: JSON.stringify({
            message: msg.mensagem,
            tpoa: settings.remetente || "MVNIHUB",
            recipient: [{ msisdn: msg.telefone }],
          }),
        });

        const data = await response.json();

        if (response.ok && data.subid) {
          await supabase.from("sms_messages").update({ 
            status: "sent", 
            provider_id: data.subid,
            updated_at: new Date().toISOString()
          }).eq("id", msg.id);
          results.push({ id: msg.id, status: "sent", subid: data.subid });
        } else {
          throw new Error(data.message || "Erro no LabsMobile");
        }
      } catch (err) {
        await supabase.from("sms_messages").update({ 
          status: "failed", 
          erro: err.message,
          updated_at: new Date().toISOString()
        }).eq("id", msg.id);
        results.push({ id: msg.id, status: "failed", error: err.message });
      }

      // Pequeno delay entre envios para respeitar rate limits e aquecimento
      await new Promise(r => setTimeout(r, 100));
    }

    return new Response(JSON.stringify({ results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
