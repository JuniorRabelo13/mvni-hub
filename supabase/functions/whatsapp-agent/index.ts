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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, leadId, message, userId, clienteId, instanceId } = await req.json()

    // 1. Get Config
    const { data: config } = await supabaseAdmin
      .from('whatsapp_config')
      .select('*')
      .single()

    // 2. Check Working Hours
    if (config) {
      const now = new Date()
      const currentTime = now.toLocaleTimeString('pt-BR', { hour12: false })
      const isWorkingHours = currentTime >= config.horario_inicio && currentTime <= config.horario_fim

      if (action === 'new_lead' && !isWorkingHours) {
        return new Response(JSON.stringify({ status: 'outside_hours' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    // 3. Logic for incoming message
    if (action === 'incoming_message' || action === 'trigger_ia') {
      
      // CALL THE NEW AI ENGINE
      const aiResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/ai-engine`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lead_id: leadId,
          cliente_id: clienteId,
          whatsapp_instance_id: instanceId,
          message: message
        })
      })

      if (!aiResponse.ok) {
        throw new Error(`AI Engine failed: ${await aiResponse.text()}`)
      }

      const aiData = await aiResponse.json()
      const responseText = aiData.response

      // Update lead status if it's a lead
      if (leadId) {
        await supabaseAdmin.from('leads').update({ 
          status: 'abordado', 
          ultimo_contato: new Date().toISOString() 
        }).eq('id', leadId)
      }

      // Return the generated response and delay to the caller (usually a webhook or frontend)
      return new Response(JSON.stringify({ 
        status: 'responded', 
        response: responseText, 
        delay_ms: aiData.delay_ms,
        agent: aiData.agent 
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error('Agent Error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
