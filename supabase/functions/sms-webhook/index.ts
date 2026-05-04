import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.2";

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type"); // dlr ou mo

    if (req.method === "POST") {
      const payload = await req.json();

      if (type === "dlr") {
        // Status: 0=delivered, 1=failed, etc (conforme LabsMobile)
        const { subid, status } = payload;
        const mappedStatus = status === "0" ? "delivered" : "failed";
        
        await supabase.from("sms_messages")
          .update({ status: mappedStatus, updated_at: new Date().toISOString() })
          .eq("provider_id", subid);
      } 
      
      else if (type === "mo") {
        const { msisdn, message, user_id } = payload;
        // User ID deve ser passado ou inferido pelo webhook secret no futuro
        await supabase.from("sms_messages").insert({
          user_id: user_id, // Placeholder
          telefone: msisdn,
          mensagem: message,
          direcao: "inbound",
          status: "delivered"
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
