import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, agentId } = await req.json()

    if (action === 'connect') {
      // In a real implementation with Baileys:
      // 1. Initialize Baileys instance
      // 2. Generate QR
      // 3. Store QR in DB
      // 4. Handle connection event to update status_conexao to 'conectado'
      
      // For this implementation, we will simulate the QR generation
      // and a delayed success to demonstrate the flow.
      
      const mockQr = "https://wa.me/qr/SIMULATED_QR_" + Math.random().toString(36).substring(7);
      
      await supabase.from('whatsapp_agents').update({
        status_conexao: 'qr',
        qr_code: mockQr,
        conectado: false
      }).eq('id', agentId);

      // Simulate a background process that "detects" connection after 10 seconds
      // In production, this would be an event listener in the Baileys instance.
      setTimeout(async () => {
        await supabase.from('whatsapp_agents').update({
          status_conexao: 'conectado',
          conectado: true,
          qr_code: null,
          ultima_atividade: new Date().toISOString()
        }).eq('id', agentId);
      }, 10000);

      return new Response(JSON.stringify({ status: 'qr_generated', qr: mockQr }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    if (action === 'disconnect') {
      await supabase.from('whatsapp_agents').update({
        status_conexao: 'desconectado',
        conectado: false,
        qr_code: null
      }).eq('id', agentId);

      return new Response(JSON.stringify({ status: 'disconnected' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})
